import * as vscode from 'vscode';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { DocsRepository } from '@services/docsRepository';
import { ExplorerViewProvider } from '@ui/view/ExplorerViewProvider';
import { DocsPanel } from '@ui/panel/DocsPanel';
import type { ExplorerToHostMessage, PanelToHostMessage } from '@shared/messages';
import type { ThemeMode } from '@shared/types';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const persistedTheme = context.globalState.get<ThemeMode>('doudoc.theme');

  if (!workspaceFolder) {
    return;
  }

  const repository = new DocsRepository(workspaceFolder.uri.fsPath);
  repository.setConfiguredPaths(readConfiguredPaths());
  let panelTheme: ThemeMode = persistedTheme ?? 'light';
  let explorerTheme: ThemeMode = getActiveTheme();
  let selectedPath: string | null = null;
  let explorerQuery = '';
  let panelQuery = '';
  let isEditing = false;
  let editTimestamp: number | null = null;
  const watcherDisposables: vscode.Disposable[] = [];

  await repository.refresh();
  selectedPath = repository.getDefaultPagePath();

  const explorerView = new ExplorerViewProvider(handleMessage, () => explorerTheme);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('doudoc.explorerView', explorerView));
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      explorerTheme = getActiveTheme();
      void publishExplorerState();
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration('doudoc.docsPaths')) {
        repository.setConfiguredPaths(readConfiguredPaths());
        await repository.refresh();
        ensureSelectedPath();
        rewireWatchers();
        await publishAll();
      }
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
    const seen = new Set<string>();
    for (const sourcePath of repository.getConfiguredPaths()) {
      if (seen.has(sourcePath)) continue;
      seen.add(sourcePath);
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolder!, `${sourcePath.replace(/\/$/, '')}/**`),
      );
      watcherDisposables.push(
        watcher,
        watcher.onDidChange((uri) => void onWatcherEvent(uri, 'change')),
        watcher.onDidCreate(() => void onWatcherEvent(null, 'create')),
        watcher.onDidDelete(() => void onWatcherEvent(null, 'delete')),
      );
    }
  }

  async function onWatcherEvent(uri: vscode.Uri | null, kind: 'change' | 'create' | 'delete'): Promise<void> {
    if (kind === 'change' && uri && isEditing && selectedPath) {
      const editingPage = repository.getSnapshot().pages.find((page) => page.relativePath === selectedPath);
      if (editingPage && path.normalize(uri.fsPath) === editingPage.absolutePath) {
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
        if (typeof typedMessage.query !== 'string') {
          return;
        }
        explorerQuery = typedMessage.query;
        await publishExplorerState();
        return;
      case 'panel-search': {
        if (typeof typedMessage.query !== 'string') {
          return;
        }
        panelQuery = typedMessage.query;
        const panel = DocsPanel.getCurrent();
        if (panel) {
          await publishPanelState(panel);
        }
        return;
      }
      case 'open-page':
      case 'panel-open-page': {
        if (typeof typedMessage.relativePath !== 'string') {
          return;
        }
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
      case 'panel-enter-edit': {
        if (!selectedPath) {
          return;
        }
        isEditing = true;
        editTimestamp = repository.getPageTimestamp(selectedPath);
        const editPanel = DocsPanel.getCurrent();
        if (editPanel) {
          await editPanel.postMessage({ type: 'panel-edit-ready', editTimestamp: editTimestamp ?? 0 });
        }
        return;
      }
      case 'panel-save-page': {
        if (typeof typedMessage.markdown !== 'string' || !selectedPath) {
          return;
        }
        const savePanel = DocsPanel.getCurrent();
        try {
          await repository.savePage(selectedPath, typedMessage.markdown);
          isEditing = false;
          editTimestamp = null;
          await repository.refresh();
          if (savePanel) {
            await savePanel.postMessage({ type: 'panel-save-result', success: true });
            await publishPanelState(savePanel);
            await publishCurrentPage(savePanel);
          }
          await publishExplorerState();
        } catch (error) {
          if (savePanel) {
            const reason = error instanceof Error ? error.message : 'Unknown error';
            await savePanel.postMessage({ type: 'panel-save-result', success: false, error: reason });
          }
        }
        return;
      }
      case 'panel-cancel-edit':
        isEditing = false;
        editTimestamp = null;
        return;
      case 'panel-paste-image': {
        if (typeof typedMessage.dataUrl !== 'string' || !isEditing) {
          return;
        }
        const pastePanel = DocsPanel.getCurrent();
        if (!pastePanel) {
          return;
        }
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

          // Compute relative path from the current page's directory so the
          // markdown-it image resolver (which resolves relative to the page)
          // can locate the asset regardless of how deep the page is.
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
        if (typeof typedMessage.relativePath !== 'string') {
          return;
        }
        const target = repository.getSnapshot().pages.find((page) => page.relativePath === typedMessage.relativePath);
        if (!target) {
          return;
        }
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(target.absolutePath));
        return;
      }
      default:
        return;
    }
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
    const snapshot = repository.getSnapshot();

    await panel.postMessage({
      type: 'panel-state',
      theme: panelTheme,
      tree: snapshot.tree,
      selectedPath,
      query: panelQuery,
      hasDocsDirectory: snapshot.hasDocsDirectory,
      docsRoot: snapshot.docsRoot,
      results: repository.search(panelQuery),
      warnings: snapshot.warnings,
    });
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

export function deactivate(): void {}

function readConfiguredPaths(): string[] {
  const config = vscode.workspace.getConfiguration('doudoc');
  const value = config.get<string[]>('docsPaths', ['docs']);
  if (!Array.isArray(value)) {
    return ['docs'];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim());
}

function getActiveTheme(): ThemeMode {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ? 'light' : 'dark';
}
