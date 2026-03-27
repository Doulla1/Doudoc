import * as vscode from 'vscode';
import { getExplorerHtml } from './explorerHtml';
import type { HostToExplorerMessage } from '@shared/messages';
import type { ThemeMode } from '@shared/types';

export class ExplorerViewProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | null = null;

  constructor(
    private readonly onMessage: (message: unknown) => void,
    private readonly getTheme: () => ThemeMode,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = getExplorerHtml(this.getTheme(), webviewView.webview.cspSource);
    webviewView.webview.onDidReceiveMessage((message) => this.onMessage(message));
  }

  postMessage(message: HostToExplorerMessage): Thenable<boolean> {
    if (!this.view) {
      return Promise.resolve(false);
    }

    return this.view.webview.postMessage(message);
  }

  reveal(): void {
    this.view?.show?.(true);
  }

  setHtml(html: string): void {
    if (!this.view) {
      return;
    }

    this.view.webview.html = html;
    this.view.webview.onDidReceiveMessage((message) => this.onMessage(message));
  }
}
