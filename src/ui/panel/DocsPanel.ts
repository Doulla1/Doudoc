import * as vscode from 'vscode';
import { getPanelHtml } from './panelHtml';
import type { HostToPanelMessage } from '@shared/messages';
import type { ThemeMode } from '@shared/types';

export class DocsPanel {
  private static current: DocsPanel | null = null;
  private readonly panel: vscode.WebviewPanel;

  private constructor(
    context: vscode.ExtensionContext,
    private readonly onMessage: (message: unknown) => void,
    private readonly getTheme: () => ThemeMode,
  ) {
    this.panel = vscode.window.createWebviewPanel(
      'doudoc.panel',
      'Doudoc',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri, ...vscode.workspace.workspaceFolders?.map((folder) => folder.uri) ?? []],
      },
    );

    this.panel.webview.html = getPanelHtml(this.getTheme(), this.panel.webview.cspSource);
    this.panel.webview.onDidReceiveMessage((message) => this.onMessage(message));
    this.panel.onDidDispose(() => {
      if (DocsPanel.current === this) {
        DocsPanel.current = null;
      }
    });
  }

  static getCurrent(): DocsPanel | null {
    return DocsPanel.current;
  }

  static createOrReveal(
    context: vscode.ExtensionContext,
    onMessage: (message: unknown) => void,
    getTheme: () => ThemeMode,
  ): DocsPanel {
    if (DocsPanel.current) {
      DocsPanel.current.panel.reveal(vscode.ViewColumn.Active);
      return DocsPanel.current;
    }

    DocsPanel.current = new DocsPanel(context, onMessage, getTheme);
    return DocsPanel.current;
  }

  postMessage(message: HostToPanelMessage): Thenable<boolean> {
    return this.panel.webview.postMessage(message);
  }

  setTitle(title: string): void {
    this.panel.title = title;
  }

  reveal(): void {
    this.panel.reveal(vscode.ViewColumn.Active);
  }

  getWebview(): vscode.Webview {
    return this.panel.webview;
  }

  setHtml(html: string): void {
    this.panel.webview.html = html;
  }
}
