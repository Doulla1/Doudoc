import { createBaseStyles, createNonce, wrapHtmlDocument } from '@ui/shared/webviewHtml';
import type { ThemeMode } from '@shared/types';

export function getPanelHtml(theme: ThemeMode, cspSource: string): string {
  const nonce = createNonce();
  const body = `
    <div class="layout">
      <header class="shell-header">
        <div class="header-brand">
          <button class="icon-button is-plain header-sidebar-toggle" id="sidebar-toggle" type="button" aria-label="Hide sidebar"></button>
          <div class="brand-copy">
            <div class="brand-title">Documentation</div>
            <div class="brand-subtitle">Current page</div>
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
              <button class="edit-btn" data-cmd="hr" title="Horizontal rule">&mdash;</button>
            </div>
            <div class="edit-toolbar-sep"></div>
            <div class="edit-toolbar-group">
              <button class="edit-btn" data-cmd="link" title="Insert link">Link</button>
              <button class="edit-btn" data-cmd="image" title="Insert image">Img</button>
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
          if (isEditMode) return;
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
        case 'hr': document.execCommand('insertHorizontalRule'); break;
        case 'code': wrapSelectionInline('code'); break;
        case 'codeblock': insertCodeBlock(); break;
        case 'link': promptInsertLink(); break;
        case 'image': promptInsertImage(); break;
      }
    }

    function wrapSelectionInline(tag) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const el = document.createElement(tag);
      try {
        range.surroundContents(el);
      } catch {
        el.textContent = sel.toString();
        range.deleteContents();
        range.insertNode(el);
      }
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      sel.addRange(r);
    }

    function insertCodeBlock() {
      const sel = window.getSelection();
      const text = sel?.toString() || 'code';
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = text;
      pre.appendChild(code);
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(pre);
        range.setStartAfter(pre);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    function showInsertDialog(title, fields) {
      return new Promise(function(resolve) {
        insertDialogTitleEl.textContent = title;
        insertDialogFieldsEl.innerHTML = fields.map(function(f) {
          return '<label class="insert-dialog-label">' + escapeHtml(f.label) +
            '<input class="insert-dialog-input search-input" type="text" data-field="' +
            escapeHtml(f.name) + '" placeholder="' + escapeHtml(f.placeholder || '') +
            '" value="' + escapeHtml(f.value || '') + '" /></label>';
        }).join('');
        insertDialogEl.style.display = '';
        var firstInput = insertDialogFieldsEl.querySelector('input');
        if (firstInput) firstInput.focus();
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
      var inputs = insertDialogFieldsEl.querySelectorAll('input[data-field]');
      var data = {};
      inputs.forEach(function(input) { data[input.dataset.field] = input.value; });
      closeInsertDialog(data);
    });

    insertDialogCancelEl.addEventListener('click', function() {
      closeInsertDialog(null);
    });

    insertDialogEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
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
        const text = inlineContent(clone).trim();
        md += marker + ' ' + text + '\\n';
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
      let num = 1;
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
      let md = '| ' + headerTexts.join(' | ') + ' |\\n';
      md += '| ' + headerTexts.map(function() { return '---'; }).join(' | ') + ' |\\n';
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
      if (isEditMode) hasUnsavedChanges = true;
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
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveEdit();
      }
    });

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
          exitEditMode();
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
      gap: 16px;
      padding: 0 16px;
      background: var(--header-bg);
      color: #ffffff;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      height: 52px;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      width: 180px;
      flex-shrink: 0;
    }
    .header-search {
      flex: 1;
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
