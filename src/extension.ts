import * as vscode from 'vscode';
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
  let theme: ThemeMode = persistedTheme ?? 'light';
  let selectedPath: string | null = null;
  let explorerQuery = '';
  let panelQuery = '';

  await repository.refresh();
  selectedPath = repository.getDefaultPagePath();

  const explorerView = new ExplorerViewProvider(handleMessage, () => theme);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('doudoc.explorerView', explorerView));

  context.subscriptions.push(
    vscode.commands.registerCommand('doudoc.openPanel', async () => {
      const panel = DocsPanel.createOrReveal(context, handleMessage, () => theme);
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
  );

  const watcher = createDocsWatcher(workspaceFolder);
  context.subscriptions.push(
    watcher.onDidChange(async () => {
      await repository.refresh();
      ensureSelectedPath();
      await publishAll();
    }),
    watcher.onDidCreate(async () => {
      await repository.refresh();
      ensureSelectedPath();
      await publishAll();
    }),
    watcher.onDidDelete(async () => {
      await repository.refresh();
      ensureSelectedPath();
      await publishAll();
    }),
  );
  context.subscriptions.push(watcher);

  async function handleMessage(message: ExplorerToHostMessage | PanelToHostMessage | unknown): Promise<void> {
    if (!message || typeof message !== 'object' || typeof (message as { type?: unknown }).type !== 'string') {
      return;
    }

    const typedMessage = message as {
      type: string;
      query?: unknown;
      relativePath?: unknown;
      anchor?: unknown;
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
        const panel = DocsPanel.createOrReveal(context, handleMessage, () => theme);
        await publishExplorerState();
        await publishPanelState(panel);
        await publishCurrentPage(panel, typeof typedMessage.anchor === 'string' ? typedMessage.anchor : undefined);
        return;
      }
      case 'toggle-theme':
        theme = theme === 'dark' ? 'light' : 'dark';
        await context.globalState.update('doudoc.theme', theme);
        await publishAll();
        return;
      case 'refresh-docs':
        await repository.refresh();
        ensureSelectedPath();
        await publishAll();
        return;
      default:
        return;
    }
  }

  async function publishAll(): Promise<void> {
    await publishExplorerState();
    const panel = DocsPanel.getCurrent();
    if (panel) {
      await publishPanelState(panel);
      await publishCurrentPage(panel);
    }
  }

  async function publishExplorerState(): Promise<void> {
    const snapshot = repository.getSnapshot();
    await explorerView.postMessage({
      type: 'explorer-state',
      theme,
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
      theme,
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

function createDocsWatcher(workspaceFolder: vscode.WorkspaceFolder): vscode.FileSystemWatcher {
  return vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, 'docs/**'));
}
