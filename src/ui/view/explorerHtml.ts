import { createBaseStyles, createNonce, wrapHtmlDocument } from '@ui/shared/webviewHtml';
import type { ThemeMode } from '@shared/types';

export function getExplorerHtml(theme: ThemeMode): string {
  const nonce = createNonce();
  const body = `
    <div class="app">
      <header class="toolbar">
        <div class="brand">
          <div>
            <div class="brand-title">Doudoc</div>
            <div class="brand-subtitle">Workspace docs</div>
          </div>
        </div>
        <div class="toolbar-actions">
          <button class="icon-button is-plain" id="theme-toggle" type="button" aria-label="Toggle theme"></button>
        </div>
      </header>
      <div class="search-wrap">
        <input id="search" class="search-input" type="search" placeholder="Search docs by title or content" />
      </div>
      <div id="meta" class="meta"></div>
      <div id="warnings" class="warnings"></div>
      <div class="section-label">Navigation</div>
      <div id="tree" class="tree"></div>
    </div>
  `;

  const script = `
    const vscode = acquireVsCodeApi();
    let state = { tree: [], selectedPath: null, query: '', theme: 'dark', hasDocsDirectory: false, docsRoot: null, warnings: [] };
    const treeEl = document.getElementById('tree');
    const metaEl = document.getElementById('meta');
    const warningsEl = document.getElementById('warnings');
    const searchEl = document.getElementById('search');
    const themeToggleEl = document.getElementById('theme-toggle');

    function escapeHtml(value) {
      return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function renderTree(nodes) {
      if (!nodes.length) {
        treeEl.innerHTML = '<div class="empty-state">No matching documentation page.</div>';
        return;
      }

      treeEl.innerHTML = nodes.map(renderNode).join('');
      bindTree();
    }

    function renderNode(node) {
      if (node.type === 'file') {
        const activeClass = node.relativePath === state.selectedPath ? ' is-active' : '';
        return '<button class="tree-button file-node' + activeClass + '" data-file-path="' + escapeHtml(node.relativePath) + '"><span>•</span><span>' + escapeHtml(node.label) + '</span></button>';
      }

      const children = (node.children || []).map(renderNode).join('');
      return '<details class="dir-node" open><summary class="tree-button"><span>▾</span><span>' + escapeHtml(node.label) + '</span></summary><div class="tree-node-children">' + children + '</div></details>';
    }

    function bindTree() {
      treeEl.querySelectorAll('[data-file-path]').forEach((button) => {
        button.addEventListener('click', () => {
          vscode.postMessage({ type: 'open-page', relativePath: button.dataset.filePath });
        });
      });
    }

    function renderMeta() {
      if (!state.hasDocsDirectory) {
        metaEl.innerHTML = '<div class="empty-state">Missing <code>/docs</code> at project root.</div>';
        warningsEl.innerHTML = '';
        treeEl.innerHTML = '';
        return;
      }

      const count = countFiles(state.tree);
      metaEl.innerHTML = '<div class="meta-row"><span class="badge">' + count + ' page' + (count > 1 ? 's' : '') + '</span><button class="icon-button" id="refresh" title="Refresh docs">↻</button></div>';
      const refreshEl = document.getElementById('refresh');
      refreshEl?.addEventListener('click', () => vscode.postMessage({ type: 'refresh-docs' }));
    }

    function renderWarnings() {
      if (!state.warnings.length) {
        warningsEl.innerHTML = '';
        return;
      }

      const items = state.warnings.slice(0, 3).map((warning) => '<li>' + escapeHtml(warning) + '</li>').join('');
      const suffix = state.warnings.length > 3 ? '<li>+' + (state.warnings.length - 3) + ' more warning(s)</li>' : '';
      warningsEl.innerHTML = '<div class="warning-banner"><strong>' + state.warnings.length + ' documentation warning(s)</strong><ul>' + items + suffix + '</ul></div>';
    }

    function renderThemeToggle() {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      const label = nextTheme === 'light' ? 'Switch to light theme' : 'Switch to dark theme';
      const icon = nextTheme === 'light'
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5a.75.75 0 0 1 .75.75V7a.75.75 0 0 1-1.5 0V5.25A.75.75 0 0 1 12 4.5Zm0 11.5a.75.75 0 0 1 .75.75v1.75a.75.75 0 0 1-1.5 0v-1.75A.75.75 0 0 1 12 16Zm7.5-4.75a.75.75 0 0 1 0 1.5h-1.75a.75.75 0 0 1 0-1.5Zm-11.5 0a.75.75 0 0 1 0 1.5H6.25a.75.75 0 0 1 0-1.5Zm8.132-4.382a.75.75 0 0 1 1.06 0l1.238 1.238a.75.75 0 1 1-1.06 1.06l-1.238-1.237a.75.75 0 0 1 0-1.06Zm-10.562 10.56a.75.75 0 0 1 1.06 0l1.238 1.239a.75.75 0 1 1-1.06 1.06l-1.238-1.239a.75.75 0 0 1 0-1.06Zm0-9.5a.75.75 0 0 1 1.06 0L7.868 9.16a.75.75 0 1 1-1.06 1.06L5.57 8.985a.75.75 0 0 1 0-1.06Zm10.562 10.56a.75.75 0 0 1 1.06 0 .75.75 0 0 1 0 1.06l-1.238 1.239a.75.75 0 1 1-1.06-1.06l1.238-1.239ZM12 8.25A3.75 3.75 0 1 1 8.25 12 3.754 3.754 0 0 1 12 8.25Zm0 1.5A2.25 2.25 0 1 0 14.25 12 2.252 2.252 0 0 0 12 9.75Z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.222 3.442a.75.75 0 0 1 .748.879 7.5 7.5 0 0 0 9.707 8.774.75.75 0 0 1 .876.95A10.5 10.5 0 1 1 12.27 2.567a.75.75 0 0 1 .952.875Zm-.992 1.02a9 9 0 1 0 10.276 10.29A9.002 9.002 0 0 1 12.23 4.462Z"/></svg>';

      themeToggleEl.innerHTML = icon;
      themeToggleEl.title = label;
      themeToggleEl.setAttribute('aria-label', label);
    }

    function countFiles(nodes) {
      return nodes.reduce((total, node) => total + (node.type === 'file' ? 1 : countFiles(node.children || [])), 0);
    }

    searchEl.addEventListener('input', (event) => {
      vscode.postMessage({ type: 'explorer-search', query: event.target.value });
    });

    themeToggleEl.addEventListener('click', () => {
      vscode.postMessage({ type: 'toggle-theme' });
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type !== 'explorer-state') {
        return;
      }

      state = message;
      document.documentElement.dataset.theme = state.theme;
      searchEl.value = state.query;
      renderThemeToggle();
      renderMeta();
      renderWarnings();
      renderTree(state.tree);
    });

    vscode.postMessage({ type: 'explorer-ready' });
  `;

  const styles = `
    ${createBaseStyles()}
    html, body {
      background: var(--vscode-sideBar-background);
    }
    .app {
      min-height: 100vh;
      padding: 10px 10px 14px;
      display: grid;
      gap: 8px;
      align-content: start;
      background: transparent;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 2px 6px;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-title { font-weight: 600; font-size: 14px; }
    .brand-subtitle { color: var(--text-muted); font-size: 11px; }
    .toolbar-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .search-wrap {
      padding-top: 0;
    }
    .search-input {
      background: var(--bg-muted);
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 2px 4px 0;
    }
    .tree {
      display: grid;
      gap: 4px;
      align-content: start;
    }
    .dir-node {
      display: grid;
      gap: 4px;
    }
    .file-node span:first-child,
    .dir-node summary span:first-child {
      color: var(--text-muted);
      width: 12px;
      flex: none;
      text-align: center;
    }
    details > summary {
      list-style: none;
    }
    details > summary::-webkit-details-marker {
      display: none;
    }
  `;

  return wrapHtmlDocument(
    'Doudoc Explorer',
    nonce,
    `<style>${styles}</style>${body}`,
    script,
    theme,
  );
}
