import { createBaseStyles, createNonce, wrapHtmlDocument } from '@ui/shared/webviewHtml';
import type { ThemeMode } from '@shared/types';

export function getExplorerHtml(theme: ThemeMode, cspSource: string): string {
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

    function countFiles(nodes) {
      return nodes.reduce((total, node) => total + (node.type === 'file' ? 1 : countFiles(node.children || [])), 0);
    }

    searchEl.addEventListener('input', (event) => {
      vscode.postMessage({ type: 'explorer-search', query: event.target.value });
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type !== 'explorer-state') {
        return;
      }

      state = message;
      document.documentElement.dataset.theme = state.theme;
      searchEl.value = state.query;
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
    cspSource,
  );
}
