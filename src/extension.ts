import * as vscode from 'vscode';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DocsRepository } from '@services/docsRepository';
import { ExplorerViewProvider } from '@ui/view/ExplorerViewProvider';
import { DocsPanel } from '@ui/panel/DocsPanel';
import type { ExplorerToHostMessage, PanelToHostMessage, PanelPreferences, ReadingWidth } from '@shared/messages';
import type { ThemeMode } from '@shared/types';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const persistedTheme = context.globalState.get<ThemeMode>('doudoc.theme');

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }

  const repository = new DocsRepository(workspaceFolders.map((folder) => folder.uri.fsPath));
  const config = readSettings();
  repository.setConfiguredPaths(config.docsPaths);
  repository.setUseGitMTime(config.useGitMTime);
  repository.setFuzzySearchEnabled(config.fuzzySearch);

  let panelTheme: ThemeMode = persistedTheme ?? resolveDefaultTheme(config.defaultTheme);
  let explorerTheme: ThemeMode = getActiveTheme();
  let selectedPath: string | null = null;
  let explorerQuery = '';
  let panelQuery = '';
  let isEditing = false;
  let editTimestamp: number | null = null;
  const selfWriteMtimes = new Map<string, number>();
  let zenMode = context.globalState.get<boolean>('doudoc.zenMode') ?? config.zenMode;
  const watcherDisposables: vscode.Disposable[] = [];

  await repository.refresh();
  selectedPath = repository.getDefaultPagePath();

  const explorerView = new ExplorerViewProvider(handleMessage, () => explorerTheme);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('doudoc.explorerView', explorerView));
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      explorerTheme = getActiveTheme();
      const cfg = readSettings();
      if (cfg.defaultTheme === 'auto') {
        panelTheme = explorerTheme;
      }
      void publishExplorerState();
      const panel = DocsPanel.getCurrent();
      if (panel) void publishPanelState(panel);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (
        event.affectsConfiguration('doudoc.docsPaths') ||
        event.affectsConfiguration('doudoc.useGitMTime') ||
        event.affectsConfiguration('doudoc.fuzzySearch') ||
        event.affectsConfiguration('doudoc.zenMode') ||
        event.affectsConfiguration('doudoc.defaultTheme') ||
        event.affectsConfiguration('doudoc.readingWidth') ||
        event.affectsConfiguration('doudoc.autoSave') ||
        event.affectsConfiguration('doudoc.autoSaveDelay')
      ) {
        const cfg = readSettings();
        repository.setConfiguredPaths(cfg.docsPaths);
        repository.setUseGitMTime(cfg.useGitMTime);
        repository.setFuzzySearchEnabled(cfg.fuzzySearch);
        await repository.refresh();
        ensureSelectedPath();
        rewireWatchers();
        if (cfg.defaultTheme !== 'auto') {
          panelTheme = cfg.defaultTheme;
        }
        await publishAll();
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      const folders = vscode.workspace.workspaceFolders ?? [];
      repository.setProjectRoots(folders.map((folder) => folder.uri.fsPath));
      await repository.refresh();
      ensureSelectedPath();
      rewireWatchers();
      await publishAll();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('doudoc.openPanel', async () => {
      const panel = DocsPanel.createOrReveal(context, handleMessage, () => panelTheme);
      await publishPanelState(panel);
      await publishCurrentPage(panel);
    }),
    vscode.commands.registerCommand('doudoc.refresh', async () => {
      await repository.refresh();
      if (!selectedPath) {
        selectedPath = repository.getDefaultPagePath();
      }
      await publishAll();
    }),
    vscode.commands.registerCommand('doudoc.openMarkdownFile', async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!targetUri || targetUri.scheme !== 'file') {
        await vscode.window.showWarningMessage('Doudoc: please target a local Markdown file.');
        return;
      }
      const absolutePath = targetUri.fsPath;
      if (!absolutePath.toLowerCase().endsWith('.md')) {
        await vscode.window.showWarningMessage('Doudoc: only .md files can be opened.');
        return;
      }

      const existing = repository.getPageByAbsolutePath(absolutePath);
      if (existing) {
        selectedPath = existing.relativePath;
      } else {
        repository.addExternalFile(absolutePath);
        await repository.refresh();
        const added = repository.getPageByAbsolutePath(absolutePath);
        selectedPath = added?.relativePath ?? selectedPath;
      }

      const panel = DocsPanel.createOrReveal(context, handleMessage, () => panelTheme);
      await publishExplorerState();
      await publishPanelState(panel);
      await publishCurrentPage(panel);
    }),
    vscode.commands.registerCommand('doudoc.searchDocs', async () => {
      const snapshot = repository.getSnapshot();
      const items = snapshot.pages.map((page) => ({
        label: page.label,
        description: page.frontMatter?.description ?? '',
        detail: page.relativePath,
        relativePath: page.relativePath,
      }));
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Search Doudoc pages by title…',
        matchOnDetail: true,
        matchOnDescription: true,
      });
      if (!picked) return;
      selectedPath = picked.relativePath;
      const panel = DocsPanel.createOrReveal(context, handleMessage, () => panelTheme);
      await publishExplorerState();
      await publishPanelState(panel);
      await publishCurrentPage(panel);
    }),
    vscode.commands.registerCommand('doudoc.createPage', async () => {
      await createNewPage();
    }),
    vscode.commands.registerCommand('doudoc.toggleZenMode', async () => {
      zenMode = !zenMode;
      await context.globalState.update('doudoc.zenMode', zenMode);
      const panel = DocsPanel.getCurrent();
      if (panel) await publishPanelState(panel);
    }),
  );

  rewireWatchers();
  context.subscriptions.push({
    dispose() {
      while (watcherDisposables.length > 0) {
        watcherDisposables.pop()?.dispose();
      }
    },
  });

  function rewireWatchers(): void {
    while (watcherDisposables.length > 0) {
      watcherDisposables.pop()?.dispose();
    }
    const folders = vscode.workspace.workspaceFolders ?? [];
    const seen = new Set<string>();
    for (const folder of folders) {
      for (const sourcePath of repository.getConfiguredPaths()) {
        const key = `${folder.uri.fsPath}:${sourcePath}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const watcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(folder, `${sourcePath.replace(/\/$/, '')}/**`),
        );
        watcherDisposables.push(
          watcher,
          watcher.onDidChange((uri) => void onWatcherEvent(uri, 'change')),
          watcher.onDidCreate(() => void onWatcherEvent(null, 'create')),
          watcher.onDidDelete(() => void onWatcherEvent(null, 'delete')),
        );
      }
    }
  }

  async function onWatcherEvent(uri: vscode.Uri | null, kind: 'change' | 'create' | 'delete'): Promise<void> {
    if (kind === 'change' && uri && isEditing && selectedPath) {
      const editingPage = repository.getSnapshot().pages.find((page) => page.relativePath === selectedPath);
      if (editingPage && path.normalize(uri.fsPath) === editingPage.absolutePath) {
        const fsPath = path.normalize(uri.fsPath);
        const expected = selfWriteMtimes.get(fsPath);
        let currentMtime: number | null = null;
        try { currentMtime = require('node:fs').statSync(fsPath).mtimeMs as number; } catch { /* ignore */ }
        if (expected !== undefined && currentMtime !== null && Math.abs(currentMtime - expected) < 5) {
          // Our own write — accept silently.
          editTimestamp = currentMtime;
          return;
        }
        const panel = DocsPanel.getCurrent();
        if (panel) {
          await panel.postMessage({ type: 'panel-edit-conflict' });
        }
        return;
      }
    }
    await repository.refresh();
    ensureSelectedPath();
    await publishAll();
  }

  async function createNewPage(): Promise<void> {
    const sources = repository.getSnapshot().sources.filter((source) => !source.isExternal && source.exists);
    if (sources.length === 0) {
      await vscode.window.showWarningMessage('Doudoc: no writable docs source. Create the docs folder first.');
      return;
    }
    let target = sources[0]!;
    if (sources.length > 1) {
      const picked = await vscode.window.showQuickPick(
        sources.map((source) => ({ label: source.label, description: source.rootPath, source })),
        { placeHolder: 'Choose a docs source' },
      );
      if (!picked) return;
      target = picked.source;
    }

    const title = await vscode.window.showInputBox({
      prompt: 'Title of the new page',
      placeHolder: 'Getting started',
      validateInput: (value) => (value.trim().length === 0 ? 'Title cannot be empty' : undefined),
    });
    if (!title) return;

    const relative = await vscode.window.showInputBox({
      prompt: 'Path inside the docs folder (relative, with .md extension)',
      value: `${slugify(title)}.md`,
      validateInput: (value) => {
        if (!value.toLowerCase().endsWith('.md')) return 'File name must end with .md';
        if (value.includes('..') || value.startsWith('/')) return 'Path must stay inside the docs folder';
        return undefined;
      },
    });
    if (!relative) return;

    const absolutePath = path.normalize(path.resolve(target.rootPath, relative));
    if (!absolutePath.startsWith(target.rootPath)) {
      await vscode.window.showErrorMessage('Doudoc: target path escapes the docs folder.');
      return;
    }

    try {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      try {
        await fs.access(absolutePath);
        await vscode.window.showWarningMessage(`Doudoc: ${relative} already exists.`);
        return;
      } catch {
        // File does not exist yet, proceed.
      }
      const today = new Date().toISOString().slice(0, 10);
      const content = `---\ntitle: ${JSON.stringify(title)}\ndate: ${today}\ntags: []\n---\n\n# ${title}\n\nWrite your documentation here.\n`;
      await fs.writeFile(absolutePath, content, 'utf8');
      await repository.refresh();
      const created = repository.getPageByAbsolutePath(absolutePath);
      if (created) selectedPath = created.relativePath;
      const panel = DocsPanel.createOrReveal(context, handleMessage, () => panelTheme);
      await publishExplorerState();
      await publishPanelState(panel);
      await publishCurrentPage(panel);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      await vscode.window.showErrorMessage(`Doudoc: failed to create page (${reason})`);
    }
  }

  async function handleMessage(message: ExplorerToHostMessage | PanelToHostMessage | unknown): Promise<void> {
    if (!message || typeof message !== 'object' || typeof (message as { type?: unknown }).type !== 'string') {
      return;
    }

    const typedMessage = message as {
      type: string;
      query?: unknown;
      relativePath?: unknown;
      anchor?: unknown;
      markdown?: unknown;
      dataUrl?: unknown;
      isAutoSave?: unknown;
    };

    switch (typedMessage.type) {
      case 'explorer-ready':
        await publishExplorerState();
        return;
      case 'panel-ready': {
        const panel = DocsPanel.getCurrent();
        if (panel) {
          await publishPanelState(panel);
          await publishCurrentPage(panel);
        }
        return;
      }
      case 'explorer-search':
        if (typeof typedMessage.query !== 'string') return;
        explorerQuery = typedMessage.query;
        await publishExplorerState();
        return;
      case 'panel-search': {
        if (typeof typedMessage.query !== 'string') return;
        panelQuery = typedMessage.query;
        const panel = DocsPanel.getCurrent();
        if (panel) await publishPanelState(panel);
        return;
      }
      case 'open-page':
      case 'panel-open-page': {
        if (typeof typedMessage.relativePath !== 'string') return;
        selectedPath = typedMessage.relativePath;
        const panel = DocsPanel.createOrReveal(context, handleMessage, () => panelTheme);
        await publishExplorerState();
        await publishPanelState(panel);
        await publishCurrentPage(panel, typeof typedMessage.anchor === 'string' ? typedMessage.anchor : undefined);
        return;
      }
      case 'toggle-theme':
        panelTheme = panelTheme === 'dark' ? 'light' : 'dark';
        await context.globalState.update('doudoc.theme', panelTheme);
        await publishAll();
        return;
      case 'refresh-docs':
        await repository.refresh();
        ensureSelectedPath();
        await publishAll();
        return;
      case 'panel-toggle-zen':
        zenMode = !zenMode;
        await context.globalState.update('doudoc.zenMode', zenMode);
        {
          const panel = DocsPanel.getCurrent();
          if (panel) await publishPanelState(panel);
        }
        return;
      case 'panel-create-page':
        await createNewPage();
        return;
      case 'panel-enter-edit': {
        if (!selectedPath) return;
        isEditing = true;
        editTimestamp = repository.getPageTimestamp(selectedPath);
        const editPanel = DocsPanel.getCurrent();
        if (editPanel) {
          await editPanel.postMessage({ type: 'panel-edit-ready', editTimestamp: editTimestamp ?? 0 });
        }
        return;
      }
      case 'panel-save-page': {
        if (typeof typedMessage.markdown !== 'string' || !selectedPath) return;
        const isAutoSave = typedMessage.isAutoSave === true;
        const savePanel = DocsPanel.getCurrent();
        try {
          await repository.savePage(selectedPath, typedMessage.markdown);
          // Record the mtime we just wrote to suppress conflict notifications from our own watcher.
          const justWrittenMtime = repository.getPageTimestamp(selectedPath);
          const savedPage = repository.getSnapshot().pages.find((p) => p.relativePath === selectedPath);
          if (justWrittenMtime !== null && savedPage) {
            selfWriteMtimes.set(savedPage.absolutePath, justWrittenMtime);
            // Clear after 2s — by then the watcher will have fired or the file will have changed externally.
            setTimeout(() => {
              if (selfWriteMtimes.get(savedPage.absolutePath) === justWrittenMtime) {
                selfWriteMtimes.delete(savedPage.absolutePath);
              }
            }, 2000);
          }
          if (!isAutoSave) {
            isEditing = false;
            editTimestamp = null;
          } else if (justWrittenMtime !== null) {
            editTimestamp = justWrittenMtime;
          }
          await repository.refresh();
          if (savePanel) {
            await savePanel.postMessage({ type: 'panel-save-result', success: true, isAutoSave });
            await publishPanelState(savePanel);
            if (!isAutoSave) await publishCurrentPage(savePanel);
          }
          await publishExplorerState();
        } catch (error) {
          if (savePanel) {
            const reason = error instanceof Error ? error.message : 'Unknown error';
            await savePanel.postMessage({ type: 'panel-save-result', success: false, error: reason, isAutoSave });
          }
        }
        return;
      }
      case 'panel-cancel-edit':
        isEditing = false;
        editTimestamp = null;
        return;
      case 'panel-paste-image': {
        if (typeof typedMessage.dataUrl !== 'string' || !isEditing) return;
        const pastePanel = DocsPanel.getCurrent();
        if (!pastePanel) return;
        try {
          const currentPage = selectedPath
            ? repository.getSnapshot().pages.find((page) => page.relativePath === selectedPath)
            : null;
          if (!currentPage) {
            throw new Error('No active page');
          }
          if (currentPage.sourceKey.startsWith('__ext')) {
            throw new Error('Pasting images is not supported for external files');
          }
          const assetsDir = path.join(currentPage.sourceRoot, 'assets');
          await fs.mkdir(assetsDir, { recursive: true });

          const match = /^data:image\/([\w+]+);base64,(.+)$/.exec(typedMessage.dataUrl);
          if (!match) {
            throw new Error('Invalid image data');
          }
          const ext = match[1] === 'jpeg' ? 'jpg' : match[1]!;
          const buffer = Buffer.from(match[2]!, 'base64');
          const timestamp = new Date().toISOString().replaceAll(/[-:T]/g, '').slice(0, 14);
          const fileName = `image-${timestamp}.${ext}`;
          const absolutePath = path.join(assetsDir, fileName);
          await fs.writeFile(absolutePath, buffer);

          const pageAbsoluteDir = path.dirname(currentPage.absolutePath);
          const relativePath = path.relative(pageAbsoluteDir, absolutePath).split(path.sep).join('/');
          const assetUri = pastePanel.getWebview().asWebviewUri(vscode.Uri.file(absolutePath)).toString();
          await pastePanel.postMessage({ type: 'panel-paste-image-result', success: true, relativePath, assetUri });
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Unknown error';
          await pastePanel.postMessage({ type: 'panel-paste-image-result', success: false, error: reason });
        }
        return;
      }
      case 'panel-open-in-editor': {
        if (typeof typedMessage.relativePath !== 'string') return;
        const target = repository.getSnapshot().pages.find((page) => page.relativePath === typedMessage.relativePath);
        if (!target) return;
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(target.absolutePath));
        return;
      }
      default:
        return;
    }
  }

  function getPreferences(): PanelPreferences {
    const cfg = readSettings();
    return {
      readingWidth: cfg.readingWidth,
      zenMode,
      autoSave: cfg.autoSave,
      autoSaveDelay: cfg.autoSaveDelay,
    };
  }

  function buildPanelStatePayload(): {
    theme: ThemeMode;
    tree: ReturnType<typeof repository.getSnapshot>['tree'];
    selectedPath: string | null;
    query: string;
    hasDocsDirectory: boolean;
    docsRoot: string | null;
    results: ReturnType<typeof repository.search>;
    warnings: string[];
    preferences: PanelPreferences;
  } {
    const snapshot = repository.getSnapshot();
    return {
      theme: panelTheme,
      tree: snapshot.tree,
      selectedPath,
      query: panelQuery,
      hasDocsDirectory: snapshot.hasDocsDirectory,
      docsRoot: snapshot.docsRoot,
      results: repository.search(panelQuery),
      warnings: snapshot.warnings,
      preferences: getPreferences(),
    };
  }

  async function publishAll(): Promise<void> {
    await publishExplorerState();
    const panel = DocsPanel.getCurrent();
    if (panel) {
      await publishPanelState(panel);
      if (!isEditing) {
        await publishCurrentPage(panel);
      }
    }
  }

  async function publishExplorerState(): Promise<void> {
    const snapshot = repository.getSnapshot();
    explorerTheme = getActiveTheme();
    await explorerView.postMessage({
      type: 'explorer-state',
      theme: explorerTheme,
      tree: repository.filterTree(explorerQuery),
      selectedPath,
      query: explorerQuery,
      hasDocsDirectory: snapshot.hasDocsDirectory,
      docsRoot: snapshot.docsRoot,
      warnings: snapshot.warnings,
    });
  }

  async function publishPanelState(panel: DocsPanel): Promise<void> {
    await panel.postMessage({ type: 'panel-state', ...buildPanelStatePayload() });
  }

  async function publishCurrentPage(panel: DocsPanel, anchor?: string): Promise<void> {
    const pagePath = selectedPath ?? repository.getDefaultPagePath();
    const page = pagePath ? repository.getPage(pagePath, panel.getWebview()) : null;
    panel.setTitle(page?.label ?? 'Doudoc');
    await panel.postMessage({
      type: 'panel-page',
      page,
      anchor,
    });
  }

  function ensureSelectedPath(): void {
    if (!selectedPath) {
      selectedPath = repository.getDefaultPagePath();
      return;
    }
    const stillExists = repository.getSnapshot().pages.some((page) => page.relativePath === selectedPath);
    if (!stillExists) {
      selectedPath = repository.getDefaultPagePath();
    }
  }

  await publishExplorerState();
}

export function deactivate(): void { }

interface DoudocSettings {
  docsPaths: string[];
  autoSave: boolean;
  autoSaveDelay: number;
  defaultTheme: 'auto' | 'light' | 'dark';
  readingWidth: ReadingWidth;
  zenMode: boolean;
  useGitMTime: boolean;
  fuzzySearch: boolean;
}

function readSettings(): DoudocSettings {
  const config = vscode.workspace.getConfiguration('doudoc');
  const docsPaths = config.get<string[]>('docsPaths', ['docs']);
  const widthRaw = config.get<string>('readingWidth', 'comfortable');
  const themeRaw = config.get<string>('defaultTheme', 'auto');
  return {
    docsPaths: Array.isArray(docsPaths)
      ? docsPaths.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim())
      : ['docs'],
    autoSave: config.get<boolean>('autoSave', false),
    autoSaveDelay: Math.max(500, Math.min(60000, config.get<number>('autoSaveDelay', 2000))),
    defaultTheme: themeRaw === 'light' || themeRaw === 'dark' ? themeRaw : 'auto',
    readingWidth: ['narrow', 'comfortable', 'wide', 'full'].includes(widthRaw) ? (widthRaw as ReadingWidth) : 'comfortable',
    zenMode: config.get<boolean>('zenMode', false),
    useGitMTime: config.get<boolean>('useGitMTime', true),
    fuzzySearch: config.get<boolean>('fuzzySearch', true),
  };
}

function resolveDefaultTheme(value: 'auto' | 'light' | 'dark'): ThemeMode {
  if (value === 'auto') return getActiveTheme();
  return value;
}

function getActiveTheme(): ThemeMode {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'light' : 'dark';
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'page';
}

