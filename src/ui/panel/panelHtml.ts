import { createBaseStyles, createNonce, wrapHtmlDocument } from '@ui/shared/webviewHtml';
import type { ThemeMode } from '@shared/types';

export function getPanelHtml(theme: ThemeMode, cspSource: string): string {
  const nonce = createNonce();
  const body = `
    <div class="layout">
      <header class="shell-header">
        <div class="header-brand">
          <button class="icon-button is-plain header-sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Hide sidebar"></button>
          <div class="header-history">
            <button class="icon-button is-plain header-history-btn" id="history-back" type="button" aria-label="Go back" title="Back" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
            <button class="icon-button is-plain header-history-btn" id="history-forward" type="button" aria-label="Go forward" title="Forward" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg></button>
          </div>
          <div class="brand-copy">
            <div class="brand-title">Documentation</div>
            <div class="brand-subtitle" id="brand-subtitle">Current page</div>
          </div>
        </div>
        <div class="header-search">
          <input id="page-search" class="search-input header-search-input" type="search" placeholder="Find in current page" />
        </div>
        <div id="edit-actions" class="edit-actions" style="display:none">
          <span id="edit-status" class="edit-status"></span>
          <button id="save-btn" class="edit-action-btn save-btn" type="button">Save</button>
          <button id="cancel-btn" class="edit-action-btn cancel-btn" type="button">Cancel</button>
        </div>
        <div class="header-actions">
          <button class="icon-button is-plain header-create-page" id="create-page" type="button" aria-label="Create new page" title="New page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg></button>
          <button class="icon-button is-plain header-zen-toggle" id="zen-toggle" type="button" aria-label="Toggle zen mode" title="Toggle zen mode"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zM5 14h2v3h3v2H5v-5zm12 0h2v5h-5v-2h3v-3z"/></svg></button>
          <button class="icon-button is-plain header-open-editor" id="open-in-editor" type="button" aria-label="Open in VS Code editor" title="Open source in editor" style="display:none"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3zM19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z"/></svg></button>
          <button class="icon-button is-plain header-edit-toggle" id="edit-toggle" type="button" aria-label="Edit page" style="display:none"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.548 20.938h16.9a.75.75 0 0 1 0 1.5H3.548a.75.75 0 0 1 0-1.5ZM18.205 2.295a2.423 2.423 0 0 1 3.426 3.426l-1.38 1.38-3.427-3.426 1.38-1.38Zm-2.44 2.44 3.427 3.427L8.52 18.834a.75.75 0 0 1-.349.197l-4.5 1.273a.75.75 0 0 1-.926-.926l1.273-4.5a.75.75 0 0 1 .197-.349L14.765 4.735Z"/></svg></button>
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
          <div id="reading-progress" class="reading-progress" aria-hidden="true"><div id="reading-progress-bar" class="reading-progress-bar"></div></div>
          <div class="page-toolbar">
            <div id="page-search-meta" class="search-meta"></div>
          </div>
          <div id="edit-toolbar" class="edit-toolbar" style="display:none">
            <div class="edit-toolbar-group">
              <button class="edit-btn" data-cmd="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
              <button class="edit-btn" data-cmd="italic" title="Italic (Ctrl+I)"><em>I</em></button>
              <button class="edit-btn" data-cmd="strikethrough" title="Strikethrough"><s>S</s></button>
            </div>
            <div class="edit-toolbar-sep"></div>
            <div class="edit-toolbar-group">
              <button class="edit-btn" data-cmd="heading1" title="Heading 1">H1</button>
              <button class="edit-btn" data-cmd="heading2" title="Heading 2">H2</button>
              <button class="edit-btn" data-cmd="heading3" title="Heading 3">H3</button>
            </div>
            <div class="edit-toolbar-sep"></div>
            <div class="edit-toolbar-group">
              <button class="edit-btn" data-cmd="blockquote" title="Blockquote">&ldquo;</button>
              <button class="edit-btn" data-cmd="code" title="Inline code">&lt;/&gt;</button>
              <button class="edit-btn" data-cmd="codeblock" title="Code block">{ }</button>
            </div>
            <div class="edit-toolbar-sep"></div>
            <div class="edit-toolbar-group">
              <button class="edit-btn" data-cmd="ul" title="Bullet list">&bull; list</button>
              <button class="edit-btn" data-cmd="ol" title="Numbered list">1. list</button>
              <button class="edit-btn" data-cmd="task" title="Task list">&#9744; task</button>
              <button class="edit-btn" data-cmd="hr" title="Horizontal rule">&mdash;</button>
            </div>
            <div class="edit-toolbar-sep"></div>
            <div class="edit-toolbar-group">
              <button class="edit-btn" data-cmd="link" title="Insert link">Link</button>
              <button class="edit-btn" data-cmd="image" title="Insert image">Img</button>
              <button class="edit-btn" data-cmd="table" title="Insert table">Table</button>
            </div>
          </div>
          <div id="edit-conflict" class="edit-conflict" style="display:none">
            <strong>Conflict:</strong> This file was modified externally. Save will overwrite those changes. <button id="conflict-dismiss" class="edit-conflict-dismiss" type="button">Dismiss</button>
          </div>
          <div id="insert-dialog" class="insert-dialog" style="display:none">
            <div class="insert-dialog-inner">
              <div class="insert-dialog-title" id="insert-dialog-title">Insert</div>
              <div class="insert-dialog-fields" id="insert-dialog-fields"></div>
              <div class="insert-dialog-actions">
                <button id="insert-dialog-ok" class="edit-action-btn save-btn" type="button">OK</button>
                <button id="insert-dialog-cancel" class="edit-action-btn cancel-btn insert-dialog-cancel-btn" type="button">Cancel</button>
              </div>
            </div>
          </div>
          <div id="page-warnings" class="page-warnings"></div>
          <section id="content" class="content"></section>
        </main>
        <aside id="toc" class="toc"></aside>
      </div>
    </div>
    <script async id="mermaid-script" src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
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
    const editToggleEl = document.getElementById('edit-toggle');
    const historyBackEl = document.getElementById('history-back');
    const historyForwardEl = document.getElementById('history-forward');
    const openInEditorEl = document.getElementById('open-in-editor');
    const createPageEl = document.getElementById('create-page');
    const zenToggleEl = document.getElementById('zen-toggle');
    const brandSubtitleEl = document.getElementById('brand-subtitle');
    const readingProgressBarEl = document.getElementById('reading-progress-bar');
    const editToolbarEl = document.getElementById('edit-toolbar');
    const editActionsEl = document.getElementById('edit-actions');
    const editStatusEl = document.getElementById('edit-status');
    const editConflictEl = document.getElementById('edit-conflict');
    const saveBtnEl = document.getElementById('save-btn');
    const cancelBtnEl = document.getElementById('cancel-btn');
    const conflictDismissEl = document.getElementById('conflict-dismiss');
    const insertDialogEl = document.getElementById('insert-dialog');
    const insertDialogTitleEl = document.getElementById('insert-dialog-title');
    const insertDialogFieldsEl = document.getElementById('insert-dialog-fields');
    const insertDialogOkEl = document.getElementById('insert-dialog-ok');
    const insertDialogCancelEl = document.getElementById('insert-dialog-cancel');
    let insertDialogResolve = null;
    let tocObserver = null;
    let isEditMode = false;
    let originalHtml = '';
    let hasUnsavedChanges = false;
    let pasteImageRange = null;
    let historyStack = [];
    let historyIndex = -1;
    let isHistoryNavigation = false;
    let preferences = { readingWidth: 'comfortable', zenMode: false, autoSave: false, autoSaveDelay: 2000 };
    let autoSaveTimer = null;

    // Mermaid initialization — deferred via async script load event to avoid blocking page render
    let mermaidReady = false;
    (function initMermaid() {
      function onMermaidLoaded() {
        if (typeof mermaid === 'undefined') return;
        mermaid.initialize({
          startOnLoad: false,
          theme: '${theme === 'dark' ? 'dark' : 'default'}',
          securityLevel: 'strict',
        });
        mermaidReady = true;
        renderMermaidDiagrams();
      }
      if (typeof mermaid !== 'undefined') {
        // Already loaded (e.g. cached)
        onMermaidLoaded();
      } else {
        const mermaidScript = document.getElementById('mermaid-script');
        if (mermaidScript) {
          mermaidScript.addEventListener('load', onMermaidLoaded);
        }
      }
    })();

    async function renderMermaidDiagrams() {
      if (!mermaidReady || typeof mermaid === 'undefined') return;
      const nodes = contentEl.querySelectorAll('.mermaid-block pre.mermaid');
      if (!nodes.length) return;
      try {
        await mermaid.run({ nodes: Array.from(nodes) });
      } catch (e) {
        console.warn('Mermaid render error:', e);
      }
    }

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
          if (isEditMode && hasUnsavedChanges) {
            editStatusEl.textContent = 'Save or cancel before navigating';
            return;
          }
          if (isEditMode) cancelEdit();
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
      scanWarningsEl.innerHTML = '<details class="warning-banner"><summary><strong>' + panelState.warnings.length + ' scan warning(s)</strong></summary><ul>' + items + suffix + '</ul></details>';
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

    function pushHistory(relativePath) {
      if (!relativePath || isHistoryNavigation) return;
      if (historyStack[historyIndex] === relativePath) return;
      historyStack = historyStack.slice(0, historyIndex + 1);
      historyStack.push(relativePath);
      historyIndex = historyStack.length - 1;
      updateHistoryButtons();
    }

    function updateHistoryButtons() {
      if (!historyBackEl || !historyForwardEl) return;
      historyBackEl.disabled = historyIndex <= 0;
      historyForwardEl.disabled = historyIndex < 0 || historyIndex >= historyStack.length - 1;
    }

    function navigateHistory(delta) {
      const next = historyIndex + delta;
      if (next < 0 || next >= historyStack.length) return;
      historyIndex = next;
      const target = historyStack[historyIndex];
      isHistoryNavigation = true;
      vscode.postMessage({ type: 'panel-open-page', relativePath: target });
      setTimeout(() => { isHistoryNavigation = false; }, 0);
      updateHistoryButtons();
    }

    function updateReadingMeta(page) {
      if (!brandSubtitleEl) return;
      if (!page) {
        brandSubtitleEl.textContent = 'Current page';
        return;
      }
      const minutes = page.readingMinutes || 1;
      const parts = [minutes + ' min read'];
      if (page.lastModified) {
        const date = new Date(page.lastModified);
        if (!Number.isNaN(date.getTime())) {
          const formatted = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
          const prefix = page.lastModifiedSource === 'git' ? 'updated' : 'modified';
          parts.push(prefix + ' ' + formatted);
        }
      }
      brandSubtitleEl.textContent = parts.join(' · ');
    }

    function buildPageHeader(page) {
      if (!page) return '';
      const fm = page.frontMatter || {};
      const tags = Array.isArray(fm.tags) ? fm.tags : [];
      const tagsHtml = tags.length
        ? '<div class="doc-tags">' + tags.map(function(tag) { return '<span class="doc-tag">' + escapeHtml(tag) + '</span>'; }).join('') + '</div>'
        : '';
      const descHtml = fm.description ? '<p class="doc-description">' + escapeHtml(fm.description) + '</p>' : '';
      const dateHtml = fm.date ? '<div class="doc-date">' + escapeHtml(fm.date) + '</div>' : '';
      if (!tagsHtml && !descHtml && !dateHtml) return '';
      return '<header class="doc-header">' + dateHtml + descHtml + tagsHtml + '</header>';
    }

    function updateReadingProgress() {
      if (!readingProgressBarEl) return;
      const main = contentEl;
      if (!main) { readingProgressBarEl.style.width = '0%'; return; }
      const max = main.scrollHeight - main.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, main.scrollTop / max)) : 0;
      readingProgressBarEl.style.width = (ratio * 100).toFixed(2) + '%';
    }

    function renderPage(page, anchor) {
      const previousPath = currentPage ? currentPage.relativePath : null;
      const isSamePage = !!page && page.relativePath === previousPath;
      const preservedScrollTop = isSamePage ? contentEl.scrollTop : 0;
      currentPage = page;
      clearHighlights();
      updateReadingMeta(page);
      if (openInEditorEl) {
        openInEditorEl.style.display = page ? '' : 'none';
      }
      if (page) {
        pushHistory(page.relativePath);
      }

      if (!page) {
        pageWarningsEl.innerHTML = '';
        contentEl.innerHTML = '<div class="empty-state">Select a documentation page to begin.</div>';
        renderToc();
        updatePageSearchUi();
        updateReadingProgress();
        return;
      }

      if (page.warnings.length) {
        const items = page.warnings.map((warning) => '<li>' + escapeHtml(warning) + '</li>').join('');
        pageWarningsEl.innerHTML = '<details class="warning-banner"><summary><strong>' + page.warnings.length + ' page warning(s)</strong></summary><ul>' + items + '</ul></details>';
      } else {
        pageWarningsEl.innerHTML = '';
      }

      contentEl.innerHTML = '<article class="doc-article">' + buildPageHeader(page) + page.html + '</article>';
      bindContentLinks();
      renderMermaidDiagrams();
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
      } else if (isSamePage) {
        contentEl.scrollTop = preservedScrollTop;
      } else {
        contentEl.scrollTop = 0;
      }
      updateReadingProgress();
    }

    function bindContentLinks() {
      contentEl.querySelectorAll('a[data-doc-path]').forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          if (isEditMode) return;
          vscode.postMessage({
            type: 'panel-open-page',
            relativePath: link.dataset.docPath,
            anchor: link.dataset.docAnchor || undefined
          });
        });
      });
      contentEl.querySelectorAll('.code-block .code-copy-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
          event.preventDefault();
          if (isEditMode) return;
          const block = btn.closest('.code-block');
          const codeEl = block?.querySelector('pre > code');
          const text = codeEl ? (codeEl.textContent || '') : '';
          try {
            await navigator.clipboard.writeText(text);
            const original = btn.textContent;
            btn.textContent = 'Copied';
            btn.classList.add('is-copied');
            setTimeout(() => {
              btn.textContent = original || 'Copy';
              btn.classList.remove('is-copied');
            }, 1400);
          } catch {
            btn.textContent = 'Copy failed';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
          }
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

    /* ── WYSIWYG edit mode ── */

    function enterEditMode() {
      if (!currentPage || isEditMode) return;
      isEditMode = true;
      hasUnsavedChanges = false;
      clearHighlights();

      const article = contentEl.querySelector('.doc-article');
      if (article) {
        originalHtml = article.innerHTML;
        article.setAttribute('contenteditable', 'true');
        article.classList.add('is-editing');
      }

      editToolbarEl.style.display = '';
      editActionsEl.style.display = '';
      editToggleEl.style.display = 'none';
      editConflictEl.style.display = 'none';
      editStatusEl.textContent = '';

      vscode.postMessage({ type: 'panel-enter-edit' });
    }

    function exitEditMode() {
      isEditMode = false;
      hasUnsavedChanges = false;

      const article = contentEl.querySelector('.doc-article');
      if (article) {
        article.removeAttribute('contenteditable');
        article.classList.remove('is-editing');
      }

      editToolbarEl.style.display = 'none';
      editActionsEl.style.display = 'none';
      editConflictEl.style.display = 'none';
      if (currentPage) editToggleEl.style.display = '';
    }

    function cancelEdit() {
      const article = contentEl.querySelector('.doc-article');
      if (article) article.innerHTML = originalHtml;
      exitEditMode();
      vscode.postMessage({ type: 'panel-cancel-edit' });
    }

    function saveEdit() {
      const article = contentEl.querySelector('.doc-article');
      if (!article) return;
      editStatusEl.textContent = 'Saving...';
      saveBtnEl.disabled = true;
      const markdown = contentToMarkdown(article);
      vscode.postMessage({ type: 'panel-save-page', markdown });
    }

    /* ── Toolbar commands ── */

    function execToolbarCommand(cmd) {
      const article = contentEl.querySelector('.doc-article');
      if (!article) return;
      article.focus();

      switch (cmd) {
        case 'bold': document.execCommand('bold'); break;
        case 'italic': document.execCommand('italic'); break;
        case 'strikethrough': document.execCommand('strikethrough'); break;
        case 'heading1': document.execCommand('formatBlock', false, 'h1'); break;
        case 'heading2': document.execCommand('formatBlock', false, 'h2'); break;
        case 'heading3': document.execCommand('formatBlock', false, 'h3'); break;
        case 'blockquote': document.execCommand('formatBlock', false, 'blockquote'); break;
        case 'ul': document.execCommand('insertUnorderedList'); break;
        case 'ol': document.execCommand('insertOrderedList'); break;
        case 'task': insertTaskList(); break;
        case 'hr': document.execCommand('insertHorizontalRule'); break;
        case 'code': wrapSelectionInline('code'); break;
        case 'codeblock': insertCodeBlock(); break;
        case 'link': promptInsertLink(); break;
        case 'image': promptInsertImage(); break;
        case 'table': promptInsertTable(); break;
      }
    }

    /* ── Edit helpers (block insertion, caret) ── */

    const COMMON_LANGS = ['text', 'javascript', 'typescript', 'tsx', 'jsx', 'python', 'bash', 'shell',
      'json', 'yaml', 'html', 'css', 'scss', 'sass', 'sql', 'php', 'java', 'kotlin', 'rust', 'go',
      'c', 'cpp', 'csharp', 'ruby', 'swift', 'markdown', 'mermaid', 'diff', 'xml', 'dockerfile',
      'toml', 'ini', 'graphql', 'lua', 'r', 'scala', 'powershell', 'plaintext'];

    function getEditableArticle() {
      return contentEl.querySelector('.doc-article');
    }

    function getCurrentTopLevelBlock(article) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      let node = sel.getRangeAt(0).startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      while (node && node !== article) {
        if (node.parentNode === article) return node;
        node = node.parentNode;
      }
      return null;
    }

    function placeCaretIn(node, atEnd) {
      if (!node) return;
      const sel = window.getSelection();
      if (!sel) return;
      const r = document.createRange();
      r.selectNodeContents(node);
      r.collapse(!atEnd);
      sel.removeAllRanges();
      sel.addRange(r);
    }

    function isBlockEmpty(el) {
      if (!el) return true;
      const html = el.innerHTML.trim();
      return html === '' || html === '<br>' || html === '<br/>';
    }

    function ensureTrailingParagraph(block) {
      const next = block.nextElementSibling;
      if (next && next.tagName === 'P') return;
      const p = document.createElement('p');
      p.appendChild(document.createElement('br'));
      block.after(p);
    }

    function insertBlockAtCursor(block) {
      const article = getEditableArticle();
      if (!article) return null;
      const target = getCurrentTopLevelBlock(article);
      if (target) {
        if (target.tagName === 'P' && isBlockEmpty(target)) {
          target.replaceWith(block);
        } else {
          target.after(block);
        }
      } else {
        article.appendChild(block);
      }
      ensureTrailingParagraph(block);
      hasUnsavedChanges = true;
      return block;
    }

    function buildTaskItem(text) {
      const li = document.createElement('li');
      li.className = 'task-list-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'task-list-checkbox';
      cb.contentEditable = 'false';
      const span = document.createElement('span');
      span.className = 'task-list-text';
      if (text) span.textContent = text;
      li.appendChild(cb);
      li.appendChild(document.createTextNode(' '));
      li.appendChild(span);
      return li;
    }

    function insertTaskList() {
      const ul = document.createElement('ul');
      ul.className = 'task-list contains-task-list';
      const li = buildTaskItem('');
      ul.appendChild(li);
      insertBlockAtCursor(ul);
      placeCaretIn(li.querySelector('.task-list-text'));
    }

    function promptInsertTable() {
      showInsertDialog('Insert table', [
        { name: 'cols', label: 'Columns', placeholder: '3', value: '3' },
        { name: 'rows', label: 'Rows (excluding header)', placeholder: '2', value: '2' },
      ]).then(function(data) {
        if (!data) return;
        const cols = Math.max(1, Math.min(12, parseInt(data.cols, 10) || 3));
        const rows = Math.max(1, Math.min(50, parseInt(data.rows, 10) || 2));
        const wrap = document.createElement('div');
        wrap.className = 'doc-table-wrap';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        for (let c = 0; c < cols; c++) {
          const th = document.createElement('th');
          th.textContent = 'Header ' + (c + 1);
          headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        for (let r = 0; r < rows; r++) {
          const tr = document.createElement('tr');
          for (let c = 0; c < cols; c++) {
            const td = document.createElement('td');
            td.innerHTML = '<br>';
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        wrap.appendChild(table);
        insertBlockAtCursor(wrap);
        const firstTh = table.querySelector('th');
        if (firstTh) placeCaretIn(firstTh, true);
      });
    }

    function wrapSelectionInline(tag) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const el = document.createElement(tag);
      try {
        range.surroundContents(el);
      } catch {
        el.textContent = sel.toString() || ' ';
        range.deleteContents();
        range.insertNode(el);
      }
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      sel.addRange(r);
      hasUnsavedChanges = true;
    }

    function insertCodeBlock() {
      const sel = window.getSelection();
      const selectedText = sel ? sel.toString() : '';
      showInsertDialog('Insert code block', [
        { name: 'lang', label: 'Language', placeholder: 'e.g. javascript', value: '', list: COMMON_LANGS },
        { name: 'code', label: 'Code', placeholder: 'Paste or type code…', value: selectedText, multiline: true },
      ]).then(function(data) {
        if (!data) return;
        const langInput = (data.lang || '').trim().toLowerCase();
        const lang = langInput || 'text';
        const code = (data.code || '').replace(/\\n+$/, '');
        const wrap = document.createElement('div');
        wrap.className = 'code-block';
        wrap.setAttribute('data-lang', lang);
        if (lang && lang !== 'text') {
          const label = document.createElement('span');
          label.className = 'code-block-lang';
          label.contentEditable = 'false';
          label.textContent = lang;
          wrap.appendChild(label);
        }
        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        if (lang && lang !== 'text') codeEl.className = 'language-' + lang;
        codeEl.textContent = code || ' ';
        pre.appendChild(codeEl);
        wrap.appendChild(pre);
        insertBlockAtCursor(wrap);
        placeCaretIn(codeEl, true);
      });
    }

    function showInsertDialog(title, fields) {
      return new Promise(function(resolve) {
        insertDialogTitleEl.textContent = title;
        var dataListsHtml = '';
        var fieldsHtml = fields.map(function(f, idx) {
          var name = escapeHtml(f.name);
          var label = escapeHtml(f.label);
          var placeholder = escapeHtml(f.placeholder || '');
          var value = escapeHtml(f.value || '');
          if (f.multiline) {
            return '<label class="insert-dialog-label">' + label +
              '<textarea class="insert-dialog-input insert-dialog-textarea" data-field="' +
              name + '" placeholder="' + placeholder + '" rows="6">' + value + '</textarea></label>';
          }
          var listAttr = '';
          if (f.list && f.list.length) {
            var listId = 'doudoc-datalist-' + idx;
            listAttr = ' list="' + listId + '"';
            dataListsHtml += '<datalist id="' + listId + '">' +
              f.list.map(function(opt) { return '<option value="' + escapeHtml(opt) + '"></option>'; }).join('') +
              '</datalist>';
          }
          return '<label class="insert-dialog-label">' + label +
            '<input class="insert-dialog-input search-input" type="text" data-field="' +
            name + '" placeholder="' + placeholder + '" value="' + value + '"' + listAttr + ' autocomplete="off" /></label>';
        }).join('');
        insertDialogFieldsEl.innerHTML = fieldsHtml + dataListsHtml;
        insertDialogEl.style.display = '';
        var firstInput = insertDialogFieldsEl.querySelector('input, textarea');
        if (firstInput) {
          firstInput.focus();
          if (firstInput.tagName === 'INPUT') firstInput.select();
        }
        insertDialogResolve = resolve;
      });
    }

    function closeInsertDialog(result) {
      insertDialogEl.style.display = 'none';
      if (insertDialogResolve) {
        insertDialogResolve(result);
        insertDialogResolve = null;
      }
    }

    insertDialogOkEl.addEventListener('click', function() {
      var inputs = insertDialogFieldsEl.querySelectorAll('input[data-field], textarea[data-field]');
      var data = {};
      inputs.forEach(function(input) { data[input.dataset.field] = input.value; });
      closeInsertDialog(data);
    });

    insertDialogCancelEl.addEventListener('click', function() {
      closeInsertDialog(null);
    });

    insertDialogEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        insertDialogOkEl.click();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.tagName === 'TEXTAREA') {
        e.preventDefault();
        insertDialogOkEl.click();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeInsertDialog(null);
      }
    });

    function promptInsertLink() {
      const sel = window.getSelection();
      const selectedText = sel?.toString() || '';
      let savedRange = null;
      if (sel && sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();

      showInsertDialog('Insert Link', [
        { name: 'url', label: 'URL', placeholder: 'https://... or relative .md path' },
        { name: 'text', label: 'Display text', placeholder: 'Link text', value: selectedText }
      ]).then(function(data) {
        if (!data || !data.url) return;
        const display = data.text || data.url;
        const a = document.createElement('a');
        if (data.url.endsWith('.md') || (data.url.includes('/') && !data.url.includes('://'))) {
          a.href = '#';
          a.setAttribute('data-doc-path', data.url);
        } else {
          a.href = data.url;
          a.target = '_blank';
          a.rel = 'noreferrer noopener';
        }
        a.textContent = display;
        if (savedRange) {
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(savedRange);
          savedRange.deleteContents();
          savedRange.insertNode(a);
          savedRange.setStartAfter(a);
          savedRange.collapse(true);
          s.removeAllRanges();
          s.addRange(savedRange);
        }
      });
    }

    function promptInsertImage() {
      const sel = window.getSelection();
      let savedRange = null;
      if (sel && sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();

      showInsertDialog('Insert Image', [
        { name: 'src', label: 'Image path', placeholder: 'Relative path to image' },
        { name: 'alt', label: 'Alt text', placeholder: 'Description' }
      ]).then(function(data) {
        if (!data || !data.src) return;
        const img = document.createElement('img');
        img.setAttribute('data-original-src', data.src);
        img.src = data.src;
        img.alt = data.alt || '';
        if (savedRange) {
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(savedRange);
          savedRange.deleteContents();
          savedRange.insertNode(img);
          savedRange.setStartAfter(img);
          savedRange.collapse(true);
          s.removeAllRanges();
          s.addRange(savedRange);
        }
      });
    }

    /* ── HTML → Markdown converter ── */

    function contentToMarkdown(container) {
      return processBlocks(container).replace(/\\n{3,}/g, '\\n\\n').trim() + '\\n';
    }

    function processBlocks(container) {
      let md = '';
      for (const child of container.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const t = child.textContent.trim();
          if (t) md += t + '\\n\\n';
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const tag = child.tagName.toLowerCase();
        switch (tag) {
          case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
            const lvl = parseInt(tag[1]);
            const text = inlineContent(child).trim();
            if (text) md += '#'.repeat(lvl) + ' ' + text + '\\n\\n';
            break;
          }
          case 'p': {
            // Defensive: if a block-level element ended up nested inside a <p>
            // (can happen when contenteditable inserts a table/pre/list inside the
            // current paragraph), promote those nested blocks instead of flattening.
            const hasNestedBlock = Array.from(child.children).some((c) => {
              const t = c.tagName.toLowerCase();
              return t === 'table' || t === 'pre' || t === 'ul' || t === 'ol' ||
                t === 'blockquote' || t === 'hr' || t === 'div' ||
                /^h[1-6]$/.test(t);
            });
            if (hasNestedBlock) {
              md += processBlocks(child);
              break;
            }
            const text = inlineContent(child);
            if (text.trim()) md += text + '\\n\\n';
            break;
          }
          case 'pre': {
            const codeEl = child.querySelector('code');
            const langMatch = codeEl?.className?.match(/language-(\\w+)/);
            const lang = langMatch ? langMatch[1] : '';
            const raw = codeEl?.textContent || child.textContent || '';
            md += '\\u0060\\u0060\\u0060' + lang + '\\n' + raw + '\\n\\u0060\\u0060\\u0060\\n\\n';
            break;
          }
          case 'ul':
            md += processList(child, '-') + '\\n';
            break;
          case 'ol':
            md += processOrderedList(child) + '\\n';
            break;
          case 'blockquote': {
            const inner = processBlocks(child).trim();
            md += inner.split('\\n').map(function(l) { return '> ' + l; }).join('\\n') + '\\n\\n';
            break;
          }
          case 'hr':
            md += '---\\n\\n';
            break;
          case 'table':
            md += processTable(child) + '\\n\\n';
            break;
          case 'img':
            md += renderImageMd(child) + '\\n\\n';
            break;
          case 'div':
            if (child.classList.contains('doc-asset-warning')) break;
            if (child.classList.contains('mermaid-block')) {
              const source = child.getAttribute('data-mermaid-source') || child.textContent || '';
              md += '\\u0060\\u0060\\u0060mermaid\\n' + source.trim() + '\\n\\u0060\\u0060\\u0060\\n\\n';
              break;
            }
            if (child.classList.contains('code-block')) {
              const lang = child.getAttribute('data-lang') || '';
              const codeEl = child.querySelector('pre > code');
              const raw = codeEl ? (codeEl.textContent || '') : (child.querySelector('pre')?.textContent || '');
              const fenceLang = lang === 'text' ? '' : lang;
              md += '\\u0060\\u0060\\u0060' + fenceLang + '\\n' + raw.replace(/\\n$/, '') + '\\n\\u0060\\u0060\\u0060\\n\\n';
              break;
            }
            md += processBlocks(child);
            break;
          default:
            md += processBlocks(child);
        }
      }
      return md;
    }

    function inlineContent(el) {
      let result = '';
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          result += child.textContent;
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const tag = child.tagName.toLowerCase();
        switch (tag) {
          case 'strong': case 'b':
            result += '**' + inlineContent(child) + '**';
            break;
          case 'em': case 'i':
            result += '*' + inlineContent(child) + '*';
            break;
          case 'del': case 's':
            result += '~~' + inlineContent(child) + '~~';
            break;
          case 'code':
            result += '\\u0060' + (child.textContent || '') + '\\u0060';
            break;
          case 'a':
            result += renderLinkMd(child);
            break;
          case 'img':
            result += renderImageMd(child);
            break;
          case 'br':
            result += '  \\n';
            break;
          case 'mark':
            result += inlineContent(child);
            break;
          case 'input':
            if ((child.getAttribute('type') || '').toLowerCase() === 'checkbox') {
              result += child.checked ? '[x] ' : '[ ] ';
            }
            break;
          default:
            result += inlineContent(child);
        }
      }
      return result;
    }

    function renderLinkMd(el) {
      const text = inlineContent(el);
      const docPath = el.getAttribute('data-doc-path');
      if (docPath) {
        const anchor = el.getAttribute('data-doc-anchor');
        const href = anchor ? docPath + '#' + anchor : docPath;
        return '[' + text + '](' + href + ')';
      }
      const originalHref = el.getAttribute('data-original-href') || el.getAttribute('href') || '';
      if (originalHref && originalHref !== '#') {
        return '[' + text + '](' + originalHref + ')';
      }
      return text;
    }

    function renderImageMd(el) {
      const src = el.getAttribute('data-original-src') || el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      return '![' + alt + '](' + src + ')';
    }

    function processList(ul, marker) {
      let md = '';
      for (const li of ul.children) {
        if (li.tagName.toLowerCase() !== 'li') continue;
        const clone = li.cloneNode(true);
        clone.querySelectorAll('ul, ol').forEach(function(l) { l.remove(); });
        let prefix = '';
        if (li.classList.contains('task-list-item')) {
          const cb = clone.querySelector('input[type="checkbox"]');
          const checked = cb && (cb.checked || cb.getAttribute('checked') !== null);
          prefix = checked ? '[x] ' : '[ ] ';
          if (cb) cb.remove();
        }
        const text = inlineContent(clone).trim();
        md += marker + ' ' + prefix + text + '\\n';
        const nestedUl = li.querySelector(':scope > ul');
        const nestedOl = li.querySelector(':scope > ol');
        if (nestedUl) {
          md += processList(nestedUl, marker).split('\\n').filter(Boolean).map(function(l) { return '  ' + l; }).join('\\n') + '\\n';
        }
        if (nestedOl) {
          md += processOrderedList(nestedOl).split('\\n').filter(Boolean).map(function(l) { return '  ' + l; }).join('\\n') + '\\n';
        }
      }
      return md;
    }

    function processOrderedList(ol) {
      let md = '';
      const startAttr = parseInt(ol.getAttribute('start') || '1', 10);
      let num = Number.isFinite(startAttr) && startAttr >= 1 ? startAttr : 1;
      for (const li of ol.children) {
        if (li.tagName.toLowerCase() !== 'li') continue;
        const clone = li.cloneNode(true);
        clone.querySelectorAll('ul, ol').forEach(function(l) { l.remove(); });
        const text = inlineContent(clone).trim();
        md += num + '. ' + text + '\\n';
        num++;
        const nestedUl = li.querySelector(':scope > ul');
        const nestedOl = li.querySelector(':scope > ol');
        if (nestedUl) {
          md += processList(nestedUl, '-').split('\\n').filter(Boolean).map(function(l) { return '   ' + l; }).join('\\n') + '\\n';
        }
        if (nestedOl) {
          md += processOrderedList(nestedOl).split('\\n').filter(Boolean).map(function(l) { return '   ' + l; }).join('\\n') + '\\n';
        }
      }
      return md;
    }

    function processTable(table) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (!rows.length) return '';
      const headers = Array.from(rows[0].querySelectorAll('th, td'));
      const headerTexts = headers.map(function(h) { return inlineContent(h).trim(); });
      const aligns = headers.map(function(h) {
        const a = (h.getAttribute('style') || '').toLowerCase();
        if (a.includes('text-align:center') || a.includes('text-align: center')) return ':---:';
        if (a.includes('text-align:right') || a.includes('text-align: right')) return '---:';
        if (a.includes('text-align:left') || a.includes('text-align: left')) return ':---';
        return '---';
      });
      let md = '| ' + headerTexts.join(' | ') + ' |\\n';
      md += '| ' + aligns.join(' | ') + ' |\\n';
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        const texts = cells.map(function(c) { return inlineContent(c).trim(); });
        while (texts.length < headerTexts.length) texts.push('');
        md += '| ' + texts.join(' | ') + ' |\\n';
      }
      return md;
    }

    /* ── Edit event listeners ── */

    editToggleEl.addEventListener('click', enterEditMode);

    saveBtnEl.addEventListener('click', saveEdit);

    cancelBtnEl.addEventListener('click', cancelEdit);

    conflictDismissEl.addEventListener('click', function() {
      editConflictEl.style.display = 'none';
    });

    editToolbarEl.addEventListener('click', function(event) {
      const btn = event.target.closest('[data-cmd]');
      if (btn) {
        event.preventDefault();
        execToolbarCommand(btn.dataset.cmd);
      }
    });

    contentEl.addEventListener('input', function() {
      if (!isEditMode) return;
      hasUnsavedChanges = true;
      if (preferences.autoSave) {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        const delay = Math.max(500, preferences.autoSaveDelay || 2000);
        autoSaveTimer = setTimeout(function() {
          if (!isEditMode) return;
          const article = contentEl.querySelector('.doc-article');
          if (!article) return;
          const markdown = contentToMarkdown(article);
          if (editStatusEl) editStatusEl.textContent = 'Auto-saving…';
          vscode.postMessage({ type: 'panel-save-page', markdown: markdown, isAutoSave: true });
        }, delay);
      }
    });

    contentEl.addEventListener('paste', function(e) {
      if (!isEditMode) return;

      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            e.preventDefault();
            const file = items[i].getAsFile();
            if (!file) return;
            const sel = window.getSelection();
            const savedRange = (sel && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
            const reader = new FileReader();
            reader.onload = function() {
              pasteImageRange = savedRange;
              vscode.postMessage({ type: 'panel-paste-image', dataUrl: reader.result });
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }

      e.preventDefault();
      const html = e.clipboardData?.getData('text/html');
      const text = e.clipboardData?.getData('text/plain');
      if (html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        temp.querySelectorAll('[style]').forEach(function(el) { el.removeAttribute('style'); });
        temp.querySelectorAll('[class]').forEach(function(el) {
          const cls = el.className;
          if (!cls.includes('language-')) el.removeAttribute('class');
        });
        document.execCommand('insertHTML', false, temp.innerHTML);
      } else if (text) {
        document.execCommand('insertText', false, text);
      }
    });

    contentEl.addEventListener('keydown', function(e) {
      if (!isEditMode) return;
      handleEditorKeydown(e);
    });

    function getElementContext(node) {
      if (!node) return { li: null, taskItem: null, cell: null, table: null, codeBlock: null };
      const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      if (!el) return { li: null, taskItem: null, cell: null, table: null, codeBlock: null };
      const li = el.closest('li');
      const cell = el.closest('td, th');
      const table = el.closest('table');
      const codeBlock = el.closest('.code-block, pre');
      const taskItem = li && li.classList.contains('task-list-item') ? li : null;
      return { li, taskItem, cell, table, codeBlock };
    }

    function handleEditorKeydown(e) {
      // Save shortcut
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        saveEdit();
        return;
      }
      // Inline formatting + dialogs shortcuts
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (!e.shiftKey && k === 'b') { e.preventDefault(); document.execCommand('bold'); return; }
        if (!e.shiftKey && k === 'i') { e.preventDefault(); document.execCommand('italic'); return; }
        if (!e.shiftKey && k === 'k') { e.preventDefault(); promptInsertLink(); return; }
        if (e.shiftKey && k === 'c') { e.preventDefault(); insertCodeBlock(); return; }
      }

      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const ctx = getElementContext(sel.anchorNode);

      // Tab / Shift+Tab inside table cell — navigate / add row
      if (ctx.cell && e.key === 'Tab') {
        e.preventDefault();
        moveTableCellFocus(ctx.cell, e.shiftKey ? -1 : 1);
        return;
      }

      // Enter inside a code block (<pre><code>) — insert literal newline, not a paragraph
      if (ctx.codeBlock && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.execCommand('insertLineBreak');
        return;
      }

      // Enter inside task-list item — replicate checkbox or exit list when empty
      if (ctx.taskItem && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // Compute "empty" by ignoring the leading checkbox.
        const textOnly = Array.from(ctx.taskItem.childNodes)
          .filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.tagName === 'INPUT'))
          .map((n) => n.textContent || '')
          .join('');
        const empty = !textOnly.trim();
        if (empty) {
          const ul = ctx.taskItem.closest('ul');
          if (ul) {
            const p = document.createElement('p');
            p.appendChild(document.createElement('br'));
            ul.after(p);
            ctx.taskItem.remove();
            if (!ul.querySelector('li')) ul.remove();
            placeCaretIn(p);
          }
        } else {
          const newLi = buildTaskItem('');
          ctx.taskItem.after(newLi);
          placeCaretIn(newLi.querySelector('.task-list-text'));
        }
        hasUnsavedChanges = true;
        return;
      }

      // Enter inside an empty regular list item — exit the list (browser behaviour is OK
      // for ul/ol but a fresh task-list-text span gets stripped, so we already handled
      // the task case above). Nothing more to do here.
    }

    function moveTableCellFocus(currentCell, direction) {
      const row = currentCell.parentElement;
      if (!row) return;
      const cells = Array.from(row.querySelectorAll('td, th'));
      const idx = cells.indexOf(currentCell);
      if (idx + direction >= 0 && idx + direction < cells.length) {
        placeCaretIn(cells[idx + direction], direction < 0);
        return;
      }
      const table = currentCell.closest('table');
      if (!table) return;
      const allRows = Array.from(table.querySelectorAll('tr'));
      const rowIdx = allRows.indexOf(row);
      const targetRow = allRows[rowIdx + direction];
      if (targetRow) {
        const targetCells = Array.from(targetRow.querySelectorAll('td, th'));
        const target = direction > 0 ? targetCells[0] : targetCells[targetCells.length - 1];
        if (target) placeCaretIn(target, direction < 0);
      } else if (direction > 0) {
        const tbody = table.querySelector('tbody') || table;
        const newRow = document.createElement('tr');
        for (let i = 0; i < cells.length; i++) {
          const td = document.createElement('td');
          td.innerHTML = '<br>';
          newRow.appendChild(td);
        }
        tbody.appendChild(newRow);
        placeCaretIn(newRow.querySelector('td'));
        hasUnsavedChanges = true;
      }
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
      // If user reveals the sidebar while in zen mode, exit zen so the sidebar is actually visible.
      if (!isSidebarOpen && preferences.zenMode) {
        vscode.postMessage({ type: 'panel-toggle-zen' });
      }
      isSidebarOpen = !isSidebarOpen;
      renderSidebarToggle();
      persistViewState();
    });

    themeToggleEl.addEventListener('click', () => {
      vscode.postMessage({ type: 'toggle-theme' });
    });

    if (historyBackEl) historyBackEl.addEventListener('click', () => navigateHistory(-1));
    if (historyForwardEl) historyForwardEl.addEventListener('click', () => navigateHistory(1));

    if (openInEditorEl) {
      openInEditorEl.addEventListener('click', () => {
        if (!currentPage) return;
        vscode.postMessage({ type: 'panel-open-in-editor', relativePath: currentPage.relativePath });
      });
    }

    if (createPageEl) {
      createPageEl.addEventListener('click', () => {
        vscode.postMessage({ type: 'panel-create-page' });
      });
    }
    if (zenToggleEl) {
      zenToggleEl.addEventListener('click', () => {
        vscode.postMessage({ type: 'panel-toggle-zen' });
      });
    }

    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (!isSidebarOpen) {
          isSidebarOpen = true;
          renderSidebarToggle();
        }
        if (globalSearchEl) {
          globalSearchEl.focus();
          globalSearchEl.select();
        }
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateHistory(-1);
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        navigateHistory(1);
      }
    });

    contentEl.addEventListener('scroll', () => {
      updateReadingProgress();
    }, { passive: true });
    window.addEventListener('resize', updateReadingProgress);

    window.addEventListener('message', (event) => {
      const message = event.data;

      if (message.type === 'panel-state') {
        panelState = message;
        document.documentElement.dataset.theme = panelState.theme;
        if (message.preferences) {
          preferences = message.preferences;
          document.documentElement.dataset.readingWidth = preferences.readingWidth || 'comfortable';
          document.documentElement.dataset.zen = preferences.zenMode ? 'on' : 'off';
        }
        if (mermaidReady && typeof mermaid !== 'undefined') {
          mermaid.initialize({
            startOnLoad: false,
            theme: panelState.theme === 'dark' ? 'dark' : 'default',
            securityLevel: 'strict',
          });
        }
        globalSearchEl.value = panelState.query;
        renderSidebarToggle();
        renderThemeToggle();
        renderTree();
        renderScanWarnings();
        renderResults();
        return;
      }

      if (message.type === 'panel-page') {
        if (isEditMode) return;
        renderPage(message.page, message.anchor);
        editToggleEl.style.display = message.page ? '' : 'none';
        return;
      }

      if (message.type === 'panel-edit-ready') {
        return;
      }

      if (message.type === 'panel-save-result') {
        saveBtnEl.disabled = false;
        if (message.success) {
          if (message.isAutoSave) {
            if (editStatusEl) editStatusEl.textContent = 'Auto-saved';
            hasUnsavedChanges = false;
          } else {
            exitEditMode();
          }
        } else {
          editStatusEl.textContent = 'Error: ' + (message.error || 'Save failed');
        }
        return;
      }

      if (message.type === 'panel-edit-conflict') {
        editConflictEl.style.display = '';
        return;
      }

      if (message.type === 'panel-paste-image-result') {
        if (!message.success || !message.relativePath || !message.assetUri) {
          editStatusEl.textContent = 'Image paste failed: ' + (message.error || 'Unknown error');
          return;
        }
        const img = document.createElement('img');
        img.setAttribute('data-original-src', message.relativePath);
        img.src = message.assetUri;
        img.alt = '';
        if (pasteImageRange) {
          const s = window.getSelection();
          s.removeAllRanges();
          s.addRange(pasteImageRange);
          pasteImageRange.deleteContents();
          pasteImageRange.insertNode(img);
          pasteImageRange.setStartAfter(img);
          pasteImageRange.collapse(true);
          s.removeAllRanges();
          s.addRange(pasteImageRange);
          pasteImageRange = null;
        } else {
          const article = contentEl.querySelector('.doc-article');
          if (article) article.appendChild(img);
        }
        hasUnsavedChanges = true;
        return;
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
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 14px;
      background: var(--header-bg);
      color: var(--text);
      border-bottom: 1px solid var(--border);
      height: 56px;
      backdrop-filter: saturate(140%) blur(8px);
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex-shrink: 0;
    }
    .header-search {
      flex: 1 1 auto;
      min-width: 120px;
      max-width: 360px;
      margin-left: auto;
    }
    .header-search-input {
      background: var(--bg-muted);
      border: 1px solid var(--border);
      color: var(--text);
      transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;
    }
    .header-search-input:focus {
      border-color: var(--accent);
      background: var(--bg-elevated);
      box-shadow: 0 0 0 3px var(--accent-soft);
      outline: none;
    }
    .header-search-input::placeholder {
      color: var(--text-subtle);
    }
    .header-theme-toggle {
      color: var(--text-muted);
    }
    .header-sidebar-toggle {
      color: var(--text-muted);
      flex: none;
    }
    .header-sidebar-toggle:hover,
    .header-theme-toggle:hover {
      background: var(--bg-hover);
      color: var(--text);
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
      color: var(--accent-strong);
      background: var(--accent-soft);
      border: 1px solid var(--border);
    }
    .brand-copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      line-height: 1.15;
      padding-left: 4px;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.005em;
    }
    .brand-subtitle {
      color: var(--text-muted);
      font-size: 11px;
      margin-top: 1px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 240px;
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
      display: flex;
      flex-direction: column;
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
      flex: 1 1 0;
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
    .doc-article[contenteditable]:focus {
      outline: none;
    }
    .doc-article h1,
    .doc-article h2,
    .doc-article h3,
    .doc-article h4,
    .doc-article h5,
    .doc-article h6 {
      line-height: 1.25;
      margin-top: 1.8em;
      scroll-margin-top: 88px;
      font-weight: 650;
      letter-spacing: -0.01em;
    }
    .doc-article h1 { font-size: 2.05em; letter-spacing: -0.02em; font-weight: 700; }
    .doc-article h2 { font-size: 1.5em; letter-spacing: -0.015em; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
    .doc-article h3 { font-size: 1.2em; }
    .doc-article p { margin: 0.85em 0; }
    .doc-article a {
      color: var(--accent);
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 120ms ease, color 120ms ease;
    }
    .doc-article a:hover { color: var(--accent-strong); border-bottom-color: currentColor; }
    .doc-article blockquote {
      margin: 1em 0;
      padding: 0.4em 1em;
      border-left: 3px solid var(--accent);
      background: var(--accent-soft);
      color: var(--text);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }
    .doc-article hr {
      border: 0;
      border-top: 1px solid var(--border);
      margin: 2em 0;
    }
    .doc-article pre {
      overflow: auto;
      padding: 16px 18px;
      border-radius: var(--radius-md);
      background: var(--code-bg);
      border: 1px solid var(--border);
      margin: 0;
      box-shadow: var(--shadow-sm);
    }
    .doc-article code {
      background: var(--code-inline-bg);
      border-radius: var(--radius-sm);
      padding: 0.12em 0.4em;
      font-size: 0.92em;
      font-family: "JetBrains Mono", "Fira Code", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
    }
    .doc-article pre > code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      display: block;
      font-size: 12.5px;
      line-height: 1.55;
    }
    .code-block {
      position: relative;
      margin: 1.2em 0;
    }
    .code-block-lang {
      position: absolute;
      top: 8px;
      left: 12px;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      pointer-events: none;
      user-select: none;
      z-index: 1;
    }
    .code-block:has(.code-block-lang) > pre {
      padding-top: 30px;
    }
    .code-copy-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-muted);
      cursor: pointer;
      opacity: 0;
      transition: opacity 120ms ease, color 120ms ease, border-color 120ms ease;
      z-index: 2;
    }
    .code-block:hover .code-copy-btn,
    .code-copy-btn:focus-visible {
      opacity: 1;
    }
    .code-copy-btn:hover {
      color: var(--text);
      border-color: var(--accent);
    }
    .code-copy-btn.is-copied {
      opacity: 1;
      color: #16a34a;
      border-color: #16a34a;
    }
    .doc-article.is-editing .code-copy-btn {
      display: none;
    }
    /* highlight.js — inlined themes (atom-one) */
    .hljs { color: var(--text); background: transparent; }
    html[data-theme='dark'] .hljs-comment,
    html[data-theme='dark'] .hljs-quote { color: #6b7a8e; font-style: italic; }
    html[data-theme='dark'] .hljs-doctag,
    html[data-theme='dark'] .hljs-keyword,
    html[data-theme='dark'] .hljs-formula { color: #c678dd; }
    html[data-theme='dark'] .hljs-section,
    html[data-theme='dark'] .hljs-name,
    html[data-theme='dark'] .hljs-selector-tag,
    html[data-theme='dark'] .hljs-deletion,
    html[data-theme='dark'] .hljs-subst { color: #e06c75; }
    html[data-theme='dark'] .hljs-literal { color: #56b6c2; }
    html[data-theme='dark'] .hljs-string,
    html[data-theme='dark'] .hljs-regexp,
    html[data-theme='dark'] .hljs-addition,
    html[data-theme='dark'] .hljs-attribute,
    html[data-theme='dark'] .hljs-meta .hljs-string { color: #98c379; }
    html[data-theme='dark'] .hljs-attr,
    html[data-theme='dark'] .hljs-variable,
    html[data-theme='dark'] .hljs-template-variable,
    html[data-theme='dark'] .hljs-type,
    html[data-theme='dark'] .hljs-selector-class,
    html[data-theme='dark'] .hljs-selector-attr,
    html[data-theme='dark'] .hljs-selector-pseudo,
    html[data-theme='dark'] .hljs-number { color: #d19a66; }
    html[data-theme='dark'] .hljs-symbol,
    html[data-theme='dark'] .hljs-bullet,
    html[data-theme='dark'] .hljs-link,
    html[data-theme='dark'] .hljs-meta,
    html[data-theme='dark'] .hljs-selector-id,
    html[data-theme='dark'] .hljs-title { color: #61aeee; }
    html[data-theme='dark'] .hljs-built_in,
    html[data-theme='dark'] .hljs-title.class_,
    html[data-theme='dark'] .hljs-class .hljs-title { color: #e6c07b; }
    html[data-theme='dark'] .hljs-emphasis { font-style: italic; }
    html[data-theme='dark'] .hljs-strong { font-weight: bold; }
    html[data-theme='dark'] .hljs-link { text-decoration: underline; }

    html[data-theme='light'] .hljs-comment,
    html[data-theme='light'] .hljs-quote { color: #a0a1a7; font-style: italic; }
    html[data-theme='light'] .hljs-doctag,
    html[data-theme='light'] .hljs-keyword,
    html[data-theme='light'] .hljs-formula { color: #a626a4; }
    html[data-theme='light'] .hljs-section,
    html[data-theme='light'] .hljs-name,
    html[data-theme='light'] .hljs-selector-tag,
    html[data-theme='light'] .hljs-deletion,
    html[data-theme='light'] .hljs-subst { color: #e45649; }
    html[data-theme='light'] .hljs-literal { color: #0184bb; }
    html[data-theme='light'] .hljs-string,
    html[data-theme='light'] .hljs-regexp,
    html[data-theme='light'] .hljs-addition,
    html[data-theme='light'] .hljs-attribute,
    html[data-theme='light'] .hljs-meta .hljs-string { color: #50a14f; }
    html[data-theme='light'] .hljs-attr,
    html[data-theme='light'] .hljs-variable,
    html[data-theme='light'] .hljs-template-variable,
    html[data-theme='light'] .hljs-type,
    html[data-theme='light'] .hljs-selector-class,
    html[data-theme='light'] .hljs-selector-attr,
    html[data-theme='light'] .hljs-selector-pseudo,
    html[data-theme='light'] .hljs-number { color: #986801; }
    html[data-theme='light'] .hljs-symbol,
    html[data-theme='light'] .hljs-bullet,
    html[data-theme='light'] .hljs-link,
    html[data-theme='light'] .hljs-meta,
    html[data-theme='light'] .hljs-selector-id,
    html[data-theme='light'] .hljs-title { color: #4078f2; }
    html[data-theme='light'] .hljs-built_in,
    html[data-theme='light'] .hljs-title.class_,
    html[data-theme='light'] .hljs-class .hljs-title { color: #c18401; }
    html[data-theme='light'] .hljs-emphasis { font-style: italic; }
    html[data-theme='light'] .hljs-strong { font-weight: bold; }
    html[data-theme='light'] .hljs-link { text-decoration: underline; }
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
    .doc-table-wrap {
      margin: 1.2em 0;
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .doc-table-wrap > table {
      border-collapse: collapse;
      width: 100%;
      font-size: 13.5px;
    }
    .doc-table-wrap th,
    .doc-table-wrap td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }
    .doc-table-wrap th {
      background: var(--bg-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--border-strong);
    }
    .doc-table-wrap tbody tr:last-child td {
      border-bottom: none;
    }
    .doc-table-wrap tbody tr:hover td {
      background: var(--bg-muted);
    }
    .doc-article ul:has(> li.task-list-item) {
      list-style: none;
      padding-left: 4px;
    }
    .doc-article li.task-list-item {
      position: relative;
      padding-left: 2px;
    }
    .doc-article .task-list-checkbox {
      margin: 0 8px 0 0;
      transform: translateY(1px);
      cursor: pointer;
      accent-color: var(--accent);
    }
    .doc-article:not(.is-editing) .task-list-checkbox {
      pointer-events: none;
    }
    .doc-article del,
    .doc-article s {
      color: var(--text-muted);
    }
    .mermaid-block {
      margin: 1.2em 0;
      overflow: auto;
      border-radius: 8px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      padding: 14px;
      text-align: center;
    }
    .mermaid-block pre.mermaid {
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      text-align: center;
    }
    .mermaid-block svg {
      max-width: 100%;
      height: auto;
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
    /* ── Edit mode ── */
    .header-edit-toggle {
      color: #ffffff;
    }
    .header-edit-toggle:hover {
      background: rgba(255,255,255,0.16);
    }
    .edit-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .edit-status {
      font-size: 12px;
      color: rgba(255,255,255,0.8);
      white-space: nowrap;
    }
    .edit-action-btn {
      padding: 5px 14px;
      border-radius: 6px;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .save-btn {
      background: #22c55e;
      color: #ffffff;
    }
    .save-btn:hover {
      background: #16a34a;
    }
    .save-btn:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .cancel-btn {
      background: rgba(255,255,255,0.16);
      color: #ffffff;
    }
    .cancel-btn:hover {
      background: rgba(255,255,255,0.24);
    }
    .edit-toolbar {
      position: sticky;
      top: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
      padding: 2em 12px 6px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border);
    }
    .edit-toolbar-group {
      display: flex;
      gap: 2px;
    }
    .edit-toolbar-sep {
      width: 1px;
      height: 22px;
      background: var(--border);
      margin: 0 4px;
    }
    .edit-btn {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
      line-height: 1.2;
      white-space: nowrap;
    }
    .edit-btn:hover {
      background: var(--bg-muted);
      border-color: var(--accent);
    }
    .edit-conflict {
      padding: 8px 14px;
      margin: 0 18px;
      border-radius: 8px;
      border: 1px solid rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.12);
      color: var(--text);
      font-size: 13px;
    }
    .edit-conflict-dismiss {
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text);
      font-size: 12px;
      cursor: pointer;
    }
    .doc-article.is-editing {
      min-height: 200px;
      padding-top: 0;
    }
    .doc-article.is-editing > :first-child {
      margin-top: 0;
    }
    .doc-article.is-editing .doc-table-wrap {
      overflow: visible;
    }
    .doc-article.is-editing td,
    .doc-article.is-editing th {
      min-width: 60px;
      cursor: text;
    }
    .doc-article.is-editing td:focus,
    .doc-article.is-editing th:focus,
    .doc-article.is-editing td:focus-within,
    .doc-article.is-editing th:focus-within {
      outline: 2px solid var(--accent);
      outline-offset: -2px;
      background: var(--accent-soft);
    }
    .doc-article.is-editing .code-block {
      position: relative;
    }
    .doc-article.is-editing .code-block .code-copy-btn {
      display: none;
    }
    .doc-article.is-editing .code-block-lang {
      user-select: none;
    }
    .doc-article.is-editing pre {
      cursor: text;
    }
    .doc-article.is-editing .task-list-text:empty::before {
      content: '\\200b';
    }
    .insert-dialog-textarea {
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      font-size: 12.5px;
      line-height: 1.45;
      resize: vertical;
      min-height: 110px;
    }
    .insert-dialog {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 60px;
      background: rgba(0,0,0,0.35);
    }
    .insert-dialog-inner {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px 20px;
      width: 360px;
      max-width: 90%;
      box-shadow: var(--shadow);
      display: grid;
      gap: 12px;
    }
    .insert-dialog-title {
      font-weight: 600;
      font-size: 14px;
    }
    .insert-dialog-fields {
      display: grid;
      gap: 10px;
    }
    .insert-dialog-label {
      display: grid;
      gap: 4px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .insert-dialog-input {
      font-size: 13px;
      padding: 8px 10px;
    }
    .insert-dialog-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .insert-dialog-cancel-btn {
      background: var(--bg-muted);
      color: var(--text);
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
    .header-history {
      display: flex;
      gap: 2px;
      margin-right: 4px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .header-actions .icon-button,
    .header-history .icon-button {
      width: 30px;
      height: 30px;
      padding: 5px;
      border-radius: var(--radius-sm);
    }
    .header-history-btn {
      color: var(--text-muted);
      width: 28px;
      height: 28px;
      padding: 4px;
      border-radius: var(--radius-sm);
      transition: background 120ms ease, color 120ms ease;
    }
    .header-history-btn:hover:not(:disabled) {
      background: var(--bg-hover);
      color: var(--text);
    }
    .header-history-btn:disabled {
      opacity: 0.3;
      cursor: default;
    }
    .header-history-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .header-open-editor,
    .header-create-page,
    .header-zen-toggle {
      color: var(--text-muted);
      transition: background 120ms ease, color 120ms ease;
    }
    .header-open-editor:hover,
    .header-create-page:hover,
    .header-zen-toggle:hover {
      background: var(--bg-hover);
      color: var(--text);
    }
    .header-create-page svg,
    .header-zen-toggle svg,
    .header-open-editor svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .reading-progress {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: transparent;
      z-index: 5;
      pointer-events: none;
    }
    .reading-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--accent), var(--accent-strong));
      transition: width 0.08s linear;
    }
    /* Front matter header */
    .doc-header {
      margin: 0 0 24px;
      padding: 0 0 16px;
      border-bottom: 1px solid var(--border);
    }
    .doc-header .doc-date {
      font-size: 12px;
      color: var(--text-muted);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .doc-header .doc-description {
      font-size: 16px;
      color: var(--text-muted);
      line-height: 1.55;
      margin: 0 0 12px;
    }
    .doc-header .doc-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .doc-header .doc-tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      font-size: 12px;
      border-radius: 999px;
      background: var(--bg-muted);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    /* Reading width */
    :root[data-reading-width="narrow"] .doc-article { max-width: 640px; margin: 0 auto; }
    :root[data-reading-width="comfortable"] .doc-article { max-width: 760px; margin: 0 auto; }
    :root[data-reading-width="wide"] .doc-article { max-width: 960px; margin: 0 auto; }
    :root[data-reading-width="full"] .doc-article { max-width: none; }
    /* Zen mode: hide sidebar, hide TOC, center content */
    :root[data-zen="on"] .sidebar { display: none; }
    :root[data-zen="on"] .toc { display: none; }
    :root[data-zen="on"] .shell-body { grid-template-columns: minmax(0, 1fr) !important; }
    /* Print stylesheet for PDF export via window.print() */
    @media print {
      :root, body { background: #ffffff !important; color: #000000 !important; }
      .layout { display: block !important; height: auto !important; }
      .shell-header,
      .sidebar,
      .toc,
      .reading-progress,
      .page-toolbar,
      .edit-toolbar,
      .edit-actions,
      #edit-conflict,
      .insert-dialog,
      .scan-warnings,
      .page-warnings,
      .header-actions,
      .header-history,
      .header-search,
      .header-sidebar-toggle,
      .header-open-editor,
      .code-copy-btn { display: none !important; }
      .shell-body { display: block !important; height: auto !important; overflow: visible !important; }
      .content-shell { display: block !important; height: auto !important; overflow: visible !important; }
      .content { padding: 0 !important; overflow: visible !important; height: auto !important; }
      .doc-article {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        color: #000000 !important;
        line-height: 1.55 !important;
      }
      .doc-article a { color: #000000; text-decoration: underline; }
      .doc-article pre, .doc-article code { background: #f5f5f5 !important; color: #000 !important; }
      .doc-article h1, .doc-article h2, .doc-article h3 { page-break-after: avoid; }
      .doc-article pre, .doc-article table, .doc-article img { page-break-inside: avoid; }
    }
  `;

  return wrapHtmlDocument(
    'Doudoc Panel',
    nonce,
    `<style>${styles}</style>${body}`,
    script,
    theme,
    cspSource,
  );
}
