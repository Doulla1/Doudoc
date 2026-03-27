import { createBaseStyles, createNonce, wrapHtmlDocument } from '@ui/shared/webviewHtml';
import type { ThemeMode } from '@shared/types';

export function getPanelHtml(theme: ThemeMode): string {
  const nonce = createNonce();
  const body = `
    <div class="layout">
      <header class="shell-header">
        <div class="header-brand">
          <button class="icon-button header-sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Hide sidebar"></button>
          <div class="brand-copy">
            <div class="brand-title">Documentation</div>
            <div class="brand-subtitle">Current page</div>
          </div>
        </div>
        <div class="header-search">
          <input id="page-search" class="search-input header-search-input" type="search" placeholder="Find in current page" />
        </div>
        <div class="header-actions">
          <button class="icon-button is-plain header-theme-toggle" id="theme-toggle" type="button" aria-label="Toggle theme"></button>
        </div>
      </header>
      <div class="shell-body" id="shell-body">
        <aside class="sidebar">
          <div class="sidebar-top">
            <div class="sidebar-heading">
              <span class="section-label">Pages</span>
            </div>
            <input id="global-search" class="search-input sidebar-search-input" type="search" placeholder="Search docs by title or content" />
            <div id="scan-warnings" class="scan-warnings"></div>
            <div id="results" class="results"></div>
          </div>
          <div id="tree" class="tree"></div>
        </aside>
        <main class="content-shell">
          <div class="page-toolbar">
            <div id="page-search-meta" class="search-meta"></div>
          </div>
          <div id="page-warnings" class="page-warnings"></div>
          <section id="content" class="content"></section>
        </main>
        <aside id="toc" class="toc"></aside>
      </div>
    </div>
  `;

  const script = `
    const vscode = acquireVsCodeApi();
    const persistedViewState = vscode.getState() || {};
    let panelState = {
      tree: [],
      results: [],
      selectedPath: null,
      query: '',
      theme: 'dark',
      hasDocsDirectory: false,
      docsRoot: null,
      warnings: []
    };
    let currentPage = null;
    let currentHighlights = [];
    let currentHighlightIndex = -1;
    let isSidebarOpen = persistedViewState.isSidebarOpen !== false;

    const treeEl = document.getElementById('tree');
    const resultsEl = document.getElementById('results');
    const contentEl = document.getElementById('content');
    const tocEl = document.getElementById('toc');
    const shellBodyEl = document.getElementById('shell-body');
    const globalSearchEl = document.getElementById('global-search');
    const pageSearchEl = document.getElementById('page-search');
    const pageSearchMetaEl = document.getElementById('page-search-meta');
    const scanWarningsEl = document.getElementById('scan-warnings');
    const pageWarningsEl = document.getElementById('page-warnings');
    const themeToggleEl = document.getElementById('theme-toggle');
    const sidebarToggleEl = document.getElementById('sidebar-toggle');
    let tocObserver = null;

    function escapeHtml(value) {
      return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function foldSearchText(input) {
      let folded = '';
      const indexMap = [];
      let cursor = 0;

      for (const char of input) {
        const normalized = char
          .normalize('NFKD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLowerCase();

        if (normalized) {
          for (const normalizedChar of normalized) {
            folded += normalizedChar;
            indexMap.push(cursor);
          }
        }

        cursor += char.length;
      }

      return { folded, indexMap };
    }

    function renderNode(node) {
      if (node.type === 'file') {
        const activeClass = node.relativePath === panelState.selectedPath ? ' is-active' : '';
        return '<button class="tree-button file-node' + activeClass + '" data-file-path="' + escapeHtml(node.relativePath) + '"><span>•</span><span>' + escapeHtml(node.label) + '</span></button>';
      }

      const children = (node.children || []).map(renderNode).join('');
      return '<details class="dir-node" open><summary class="tree-button"><span>▾</span><span>' + escapeHtml(node.label) + '</span></summary><div class="tree-node-children">' + children + '</div></details>';
    }

    function bindTree() {
      treeEl.querySelectorAll('[data-file-path]').forEach((button) => {
        button.addEventListener('click', () => {
          vscode.postMessage({ type: 'panel-open-page', relativePath: button.dataset.filePath });
        });
      });
    }

    function renderTree() {
      if (!panelState.hasDocsDirectory) {
        treeEl.innerHTML = '<div class="empty-state">Missing <code>/docs</code> at project root.</div>';
        return;
      }

      if (!panelState.tree.length) {
        treeEl.innerHTML = '<div class="empty-state">No documentation page found.</div>';
        return;
      }

      treeEl.innerHTML = panelState.tree.map(renderNode).join('');
      bindTree();
    }

    function renderResults() {
      if (!panelState.query) {
        resultsEl.innerHTML = '';
        return;
      }

      if (!panelState.results.length) {
        resultsEl.innerHTML = '<div class="empty-state">No result for this query.</div>';
        return;
      }

      resultsEl.innerHTML = panelState.results.slice(0, 8).map((result) => {
        return '<button class="result-card" data-result-path="' + escapeHtml(result.relativePath) + '"><div class="result-title">' + escapeHtml(result.label) + '</div><div class="result-meta"><span class="badge">' + escapeHtml(result.matchType) + '</span><span>' + escapeHtml(result.relativePath) + '</span></div><div class="result-excerpt">' + escapeHtml(result.excerpt) + '</div></button>';
      }).join('');

      resultsEl.querySelectorAll('[data-result-path]').forEach((button) => {
        button.addEventListener('click', () => {
          vscode.postMessage({ type: 'panel-open-page', relativePath: button.dataset.resultPath });
        });
      });
    }

    function renderScanWarnings() {
      if (!panelState.warnings.length) {
        scanWarningsEl.innerHTML = '';
        return;
      }

      const items = panelState.warnings.slice(0, 3).map((warning) => '<li>' + escapeHtml(warning) + '</li>').join('');
      const suffix = panelState.warnings.length > 3 ? '<li>+' + (panelState.warnings.length - 3) + ' more warning(s)</li>' : '';
      scanWarningsEl.innerHTML = '<div class="warning-banner"><strong>' + panelState.warnings.length + ' scan warning(s)</strong><ul>' + items + suffix + '</ul></div>';
    }

    function renderThemeToggle() {
      const nextTheme = panelState.theme === 'dark' ? 'light' : 'dark';
      const label = nextTheme === 'light' ? 'Switch to light theme' : 'Switch to dark theme';
      const icon = nextTheme === 'light'
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5a.75.75 0 0 1 .75.75V7a.75.75 0 0 1-1.5 0V5.25A.75.75 0 0 1 12 4.5Zm0 11.5a.75.75 0 0 1 .75.75v1.75a.75.75 0 0 1-1.5 0v-1.75A.75.75 0 0 1 12 16Zm7.5-4.75a.75.75 0 0 1 0 1.5h-1.75a.75.75 0 0 1 0-1.5Zm-11.5 0a.75.75 0 0 1 0 1.5H6.25a.75.75 0 0 1 0-1.5Zm8.132-4.382a.75.75 0 0 1 1.06 0l1.238 1.238a.75.75 0 1 1-1.06 1.06l-1.238-1.237a.75.75 0 0 1 0-1.06Zm-10.562 10.56a.75.75 0 0 1 1.06 0l1.238 1.239a.75.75 0 1 1-1.06 1.06l-1.238-1.239a.75.75 0 0 1 0-1.06Zm0-9.5a.75.75 0 0 1 1.06 0L7.868 9.16a.75.75 0 1 1-1.06 1.06L5.57 8.985a.75.75 0 0 1 0-1.06Zm10.562 10.56a.75.75 0 0 1 1.06 0 .75.75 0 0 1 0 1.06l-1.238 1.239a.75.75 0 1 1-1.06-1.06l1.238-1.239ZM12 8.25A3.75 3.75 0 1 1 8.25 12 3.754 3.754 0 0 1 12 8.25Zm0 1.5A2.25 2.25 0 1 0 14.25 12 2.252 2.252 0 0 0 12 9.75Z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.222 3.442a.75.75 0 0 1 .748.879 7.5 7.5 0 0 0 9.707 8.774.75.75 0 0 1 .876.95A10.5 10.5 0 1 1 12.27 2.567a.75.75 0 0 1 .952.875Zm-.992 1.02a9 9 0 1 0 10.276 10.29A9.002 9.002 0 0 1 12.23 4.462Z"/></svg>';

      themeToggleEl.innerHTML = icon;
      themeToggleEl.title = label;
      themeToggleEl.setAttribute('aria-label', label);
    }

    function persistViewState() {
      vscode.setState({ isSidebarOpen });
    }

    function renderSidebarToggle() {
      const label = isSidebarOpen ? 'Hide sidebar' : 'Show sidebar';
      const icon = isSidebarOpen
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75A2.75 2.75 0 0 1 4.75 4Zm.75 1.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1H9v-12Zm5 12h8.75a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1H10.5Zm5.03-8.97a.75.75 0 0 1 0 1.06L13.06 12l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 0 1 1.06 0Z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75A2.75 2.75 0 0 1 4.75 4Zm.75 1.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1H9v-12Zm5 12h8.75a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1H10.5Zm-1.03-8.97a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06L11.94 12 9.47 9.53a.75.75 0 0 1 0-1.06Z"/></svg>';

      shellBodyEl.classList.toggle('is-sidebar-collapsed', !isSidebarOpen);
      sidebarToggleEl.innerHTML = icon;
      sidebarToggleEl.title = label;
      sidebarToggleEl.setAttribute('aria-label', label);
      sidebarToggleEl.setAttribute('aria-pressed', String(!isSidebarOpen));
    }

    function renderToc() {
      if (!currentPage || !currentPage.headings.length) {
        tocEl.innerHTML = '<div class="empty-state">No table of contents for this page.</div>';
        return;
      }

      tocEl.innerHTML = '<div class="toc-header">On this page</div>' + currentPage.headings.map((heading) => {
        return '<button class="toc-link depth-' + heading.depth + '" data-anchor="' + escapeHtml(heading.id) + '">' + escapeHtml(heading.text) + '</button>';
      }).join('');

      tocEl.querySelectorAll('[data-anchor]').forEach((button) => {
        button.addEventListener('click', () => {
          const target = document.getElementById(button.dataset.anchor);
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    function renderPage(page, anchor) {
      currentPage = page;
      clearHighlights();

      if (!page) {
        pageWarningsEl.innerHTML = '';
        contentEl.innerHTML = '<div class="empty-state">Select a documentation page to begin.</div>';
        renderToc();
        updatePageSearchUi();
        return;
      }

      if (page.warnings.length) {
        const items = page.warnings.map((warning) => '<li>' + escapeHtml(warning) + '</li>').join('');
        pageWarningsEl.innerHTML = '<div class="warning-banner"><strong>Page warnings</strong><ul>' + items + '</ul></div>';
      } else {
        pageWarningsEl.innerHTML = '';
      }

      contentEl.innerHTML = '<article class="doc-article">' + page.html + '</article>';
      contentEl.scrollTop = 0;
      bindContentLinks();
      renderToc();
      setupTocObserver();
      if (pageSearchEl.value) {
        highlightInPage(pageSearchEl.value);
      } else {
        updatePageSearchUi();
      }

      if (anchor) {
        const target = document.getElementById(anchor);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function bindContentLinks() {
      contentEl.querySelectorAll('a[data-doc-path]').forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          vscode.postMessage({
            type: 'panel-open-page',
            relativePath: link.dataset.docPath,
            anchor: link.dataset.docAnchor || undefined
          });
        });
      });
    }

    function clearHighlights() {
      currentHighlights.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) {
          return;
        }
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      });
      currentHighlights = [];
      currentHighlightIndex = -1;
      updatePageSearchUi();
    }

    function highlightInPage(query) {
      clearHighlights();

      const foldedQuery = foldSearchText(query).folded.trim();

      if (!foldedQuery || !currentPage) {
        return;
      }

      const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          const parentElement = node.parentElement;
          if (!parentElement) {
            return NodeFilter.FILTER_REJECT;
          }
          if (['SCRIPT', 'STYLE', 'MARK', 'CODE', 'PRE'].includes(parentElement.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }

      textNodes.forEach((textNode) => {
        const text = textNode.textContent || '';
        const foldedText = foldSearchText(text);

        if (foldedText.folded.indexOf(foldedQuery) === -1) {
          return;
        }

        const fragment = document.createDocumentFragment();
        let cursor = 0;
        let originalCursor = 0;

        while (cursor < foldedText.folded.length) {
          const matchIndex = foldedText.folded.indexOf(foldedQuery, cursor);
          if (matchIndex === -1) {
            fragment.appendChild(document.createTextNode(text.slice(originalCursor)));
            break;
          }

          const originalStart = foldedText.indexMap[matchIndex] ?? 0;
          const originalEnd = foldedText.indexMap[matchIndex + foldedQuery.length] ?? text.length;

          if (originalStart > originalCursor) {
            fragment.appendChild(document.createTextNode(text.slice(originalCursor, originalStart)));
          }

          const mark = document.createElement('mark');
          mark.className = 'doudoc-highlight';
          mark.textContent = text.slice(originalStart, originalEnd);
          currentHighlights.push(mark);
          fragment.appendChild(mark);
          originalCursor = originalEnd;
          cursor = matchIndex + foldedQuery.length;
        }

        textNode.parentNode?.replaceChild(fragment, textNode);
      });

      if (currentHighlights.length) {
        currentHighlightIndex = 0;
        focusCurrentHighlight();
      }

      updatePageSearchUi();
    }

    function updatePageSearchUi() {
      const hasQuery = !!pageSearchEl.value;
      const hasHighlights = currentHighlights.length > 0;

      if (!hasQuery) {
        pageSearchMetaEl.textContent = '';
      } else if (!hasHighlights) {
        pageSearchMetaEl.textContent = 'No match';
      } else {
        pageSearchMetaEl.textContent = (currentHighlightIndex + 1) + ' / ' + currentHighlights.length;
      }
    }

    function focusCurrentHighlight() {
      if (!currentHighlights.length || currentHighlightIndex < 0) {
        return;
      }

      currentHighlights.forEach((mark, index) => {
        mark.classList.toggle('is-current', index === currentHighlightIndex);
      });

      currentHighlights[currentHighlightIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function navigateHighlight(direction) {
      if (!currentHighlights.length) {
        return;
      }

      currentHighlightIndex = (currentHighlightIndex + direction + currentHighlights.length) % currentHighlights.length;
      updatePageSearchUi();
      focusCurrentHighlight();
    }

    function setupTocObserver() {
      tocObserver?.disconnect();
      const links = Array.from(tocEl.querySelectorAll('[data-anchor]'));
      if (!links.length) {
        return;
      }

      tocObserver = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (!visible?.target?.id) {
          return;
        }

        links.forEach((link) => {
          link.classList.toggle('is-active', link.dataset.anchor === visible.target.id);
        });
      }, { root: contentEl, threshold: 0.2 });

      contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => tocObserver.observe(heading));
    }

    globalSearchEl.addEventListener('input', (event) => {
      vscode.postMessage({ type: 'panel-search', query: event.target.value });
    });

    pageSearchEl.addEventListener('input', (event) => {
      highlightInPage(event.target.value);
    });

    pageSearchEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        navigateHighlight(event.shiftKey ? -1 : 1);
      }
    });

    sidebarToggleEl.addEventListener('click', () => {
      isSidebarOpen = !isSidebarOpen;
      renderSidebarToggle();
      persistViewState();
    });

    themeToggleEl.addEventListener('click', () => {
      vscode.postMessage({ type: 'toggle-theme' });
    });

    window.addEventListener('message', (event) => {
      const message = event.data;

      if (message.type === 'panel-state') {
        panelState = message;
        document.documentElement.dataset.theme = panelState.theme;
        globalSearchEl.value = panelState.query;
        renderSidebarToggle();
        renderThemeToggle();
        renderTree();
        renderScanWarnings();
        renderResults();
        return;
      }

      if (message.type === 'panel-page') {
        renderPage(message.page, message.anchor);
      }
    });

    renderSidebarToggle();
    vscode.postMessage({ type: 'panel-ready' });
  `;

  const styles = `
    ${createBaseStyles()}
    .layout {
      height: 100vh;
      display: grid;
      grid-template-rows: 52px minmax(0, 1fr);
      background: var(--bg);
    }
    .shell-header {
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      padding: 0 16px;
      background: var(--header-bg);
      color: #ffffff;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .header-search {
      min-width: 0;
    }
    .header-search-input {
      background: rgba(255,255,255,0.96);
      border: none;
      color: #172b4d;
    }
    .header-search-input::placeholder {
      color: #6b778c;
    }
    .header-theme-toggle {
      color: #ffffff;
    }
    .header-sidebar-toggle {
      color: #ffffff;
      flex: none;
    }
    .header-sidebar-toggle:hover,
    .header-theme-toggle:hover {
      background: rgba(255,255,255,0.16);
    }
    .shell-body {
      min-height: 0;
      display: grid;
      grid-template-columns: 248px minmax(0, 1fr) 220px;
      transition: grid-template-columns 160ms ease;
    }
    .shell-body.is-sidebar-collapsed {
      grid-template-columns: 0 minmax(0, 1fr) 220px;
    }
    .sidebar,
    .content-shell {
      min-height: 0;
      background: var(--bg-elevated);
    }
    .sidebar {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      border-right: 1px solid var(--border);
      min-width: 0;
      overflow: hidden;
    }
    .shell-body.is-sidebar-collapsed .sidebar {
      border-right: none;
      opacity: 0;
      pointer-events: none;
    }
    .sidebar-top {
      padding: 10px 10px 8px;
      display: grid;
      gap: 8px;
      border-bottom: 1px solid var(--border);
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 12px;
      color: #ffffff;
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.18);
    }
    .brand-copy {
      min-width: 0;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 600;
    }
    .brand-subtitle {
      color: rgba(255,255,255,0.72);
      font-size: 11px;
    }
    .sidebar-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .results,
    .tree,
    .content,
    .toc {
      overflow: auto;
    }
    .results {
      display: grid;
      gap: 6px;
      max-height: 160px;
    }
    .scan-warnings,
    .page-warnings {
      display: grid;
      gap: 10px;
    }
    .result-card {
      display: grid;
      gap: 4px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: inherit;
      text-align: left;
      cursor: pointer;
    }
    .result-card:hover {
      border-color: var(--accent);
      background: var(--bg-muted);
    }
    .result-title {
      font-weight: 600;
      font-size: 13px;
    }
    .result-meta,
    .result-excerpt,
    .search-meta {
      color: var(--text-muted);
      font-size: 12px;
    }
    .result-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .tree {
      padding: 6px 6px 12px;
      display: grid;
      gap: 2px;
      align-content: start;
    }
    .sidebar .tree-button {
      gap: 8px;
      padding: 6px 8px;
      font-size: 12.5px;
    }
    .sidebar .tree-node-children {
      margin-left: 10px;
      padding-left: 8px;
    }
    .content-shell {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      background: var(--bg);
    }
    .page-toolbar {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      padding: 8px 20px 4px;
      background: var(--bg);
      border-bottom: none;
    }
    .page-search-input {
      min-width: 260px;
      max-width: 320px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border);
    }
    .sidebar-search-input {
      background: var(--bg-muted);
    }
    .content {
      min-height: 0;
      padding: 0 18px 28px;
    }
    .doc-article {
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 4px 0 72px;
      line-height: 1.7;
      color: var(--text);
    }
    .doc-article > :first-child {
      margin-top: 0;
    }
    .doc-article h1,
    .doc-article h2,
    .doc-article h3,
    .doc-article h4,
    .doc-article h5,
    .doc-article h6 {
      line-height: 1.2;
      margin-top: 1.8em;
      scroll-margin-top: 88px;
    }
    .doc-article pre {
      overflow: auto;
      padding: 14px;
      border-radius: 8px;
      background: var(--code-bg);
      border: 1px solid var(--border);
    }
    .doc-article code {
      background: var(--code-bg);
      border-radius: 6px;
      padding: 0.1em 0.35em;
    }
    .doc-article img {
      max-width: 100%;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .doc-article blockquote {
      margin: 1.2em 0;
      padding: 0.8em 1em;
      border-left: 3px solid var(--accent);
      background: rgba(111,211,255,0.08);
      border-radius: 0 14px 14px 0;
    }
    .toc {
      padding: 16px 12px;
      background: var(--bg);
      border-left: 1px solid var(--border);
    }
    .toc-header {
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .toc-link {
      width: 100%;
      border: none;
      background: transparent;
      color: var(--text-muted);
      text-align: left;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
    }
    .toc-link:hover,
    .toc-link.is-active {
      background: rgba(111,211,255,0.12);
      color: var(--text);
    }
    .toc-link.depth-2 { padding-left: 18px; }
    .toc-link.depth-3 { padding-left: 26px; }
    .toc-link.depth-4,
    .toc-link.depth-5,
    .toc-link.depth-6 { padding-left: 34px; }
    .file-node span:first-child,
    .dir-node summary span:first-child {
      color: var(--text-muted);
      width: 12px;
      flex: none;
      text-align: center;
    }
    mark.doudoc-highlight.is-current {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
    details > summary {
      list-style: none;
    }
    details > summary::-webkit-details-marker {
      display: none;
    }
    @media (max-width: 700px) {
      .shell-body {
        grid-template-columns: 1fr;
      }
      .toc {
        display: none;
      }
      .sidebar {
        max-height: 280px;
        border-right: none;
        border-bottom: 1px solid var(--border);
      }
    }
    @media (max-width: 840px) {
      .shell-header {
        grid-template-columns: 1fr auto;
      }
      .header-search {
        grid-column: 1 / -1;
      }
      .doc-article {
        padding: 10px 0 72px;
      }
    }
  `;

  return wrapHtmlDocument(
    'Doudoc Panel',
    nonce,
    `<style>${styles}</style>${body}`,
    script,
    theme,
  );
}
