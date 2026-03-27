export function createNonce(): string {
  return Math.random().toString(36).slice(2, 15);
}

export function wrapHtmlDocument(title: string, nonce: string, body: string, script: string, theme: 'dark' | 'light'): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src data: https: vscode-webview-resource:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src https: data:;"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    ${body}
    <script nonce="${nonce}">
      ${script}
    </script>
  </body>
</html>`;
}

export function createBaseStyles(): string {
  return `
    :root {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    html[data-theme='dark'] {
      color-scheme: dark;
      --bg: #10161f;
      --bg-elevated: #161d29;
      --bg-muted: #1d2532;
      --header-bg: #1d5f84;
      --header-surface: rgba(255,255,255,0.08);
      --border: rgba(255,255,255,0.08);
      --border-strong: rgba(255,255,255,0.12);
      --text: #eff4fb;
      --text-muted: #9aa8bb;
      --accent: #7cc5ff;
      --accent-strong: #b4e0ff;
      --shadow: 0 1px 2px rgba(0,0,0,0.24);
      --code-bg: #0f1520;
      --mark-bg: #ffdb6e;
      --mark-text: #291d00;
    }
    html[data-theme='light'] {
      color-scheme: light;
      --bg: #f7f8fa;
      --bg-elevated: #ffffff;
      --bg-muted: #f1f3f7;
      --header-bg: #1f7a96;
      --header-surface: rgba(255,255,255,0.18);
      --border: rgba(9, 30, 66, 0.12);
      --border-strong: rgba(9, 30, 66, 0.16);
      --text: #172b4d;
      --text-muted: #5e6c84;
      --accent: #0c66e4;
      --accent-strong: #0055cc;
      --shadow: 0 1px 2px rgba(9, 30, 66, 0.12);
      --code-bg: #f4f5f7;
      --mark-bg: #fff4a3;
      --mark-text: #533d00;
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); }
    body { min-height: 100vh; line-height: 1.5; }
    button, input {
      font: inherit;
    }
    a {
      color: var(--accent);
    }
    .icon-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text);
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
    }
    .icon-button:hover {
      background: var(--bg-muted);
      border-color: var(--accent);
    }
    .icon-button.is-plain {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: inherit;
    }
    .icon-button.is-plain:hover {
      background: rgba(12, 102, 228, 0.1);
      border-color: transparent;
    }
    .icon-button svg {
      width: 18px;
      height: 18px;
      display: block;
      fill: currentColor;
    }
    .search-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text);
      outline: none;
    }
    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(12, 102, 228, 0.14);
    }
    .empty-state {
      padding: 20px;
      border: 1px dashed var(--border);
      border-radius: 12px;
      background: var(--bg-elevated);
      color: var(--text-muted);
    }
    .warning-banner {
      display: grid;
      gap: 8px;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(255, 192, 91, 0.24);
      background: rgba(255, 192, 91, 0.12);
      color: var(--text);
    }
    .warning-banner strong {
      font-size: 13px;
    }
    .warning-banner ul {
      margin: 0;
      padding-left: 18px;
      color: var(--text-muted);
      font-size: 12px;
    }
    .doc-invalid-link {
      opacity: 0.72;
      text-decoration-style: dashed;
      pointer-events: none;
      cursor: default;
    }
    .doc-asset-warning {
      margin: 1rem 0;
      padding: 0.85rem 1rem;
      border-radius: 14px;
      border: 1px dashed rgba(255, 192, 91, 0.32);
      background: rgba(255, 192, 91, 0.12);
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .tree-button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
      font-size: 13px;
    }
    .tree-button:hover,
    .tree-button.is-active {
      background: rgba(12, 102, 228, 0.1);
    }
    .tree-node-children {
      margin-left: 14px;
      padding-left: 10px;
      border-left: 1px solid var(--border);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(12, 102, 228, 0.08);
      color: var(--accent-strong);
      font-size: 12px;
    }
    mark.doudoc-highlight {
      background: var(--mark-bg);
      color: var(--mark-text);
      border-radius: 4px;
      padding: 0 1px;
    }
  `;
}
