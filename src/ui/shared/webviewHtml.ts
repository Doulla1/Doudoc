export function createNonce(): string {
  return Math.random().toString(36).slice(2, 15);
}

export function wrapHtmlDocument(
  title: string,
  nonce: string,
  body: string,
  script: string,
  theme: 'dark' | 'light',
  cspSource: string,
): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${cspSource} data: https:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net; font-src ${cspSource} https: data:;"
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
      font-family: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
      font-feature-settings: "cv02", "cv03", "cv04", "cv11", "ss01", "ss03";
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    html[data-theme='dark'] {
      color-scheme: dark;
      --bg: #0b0f17;
      --bg-elevated: #11161f;
      --bg-muted: #161c27;
      --bg-hover: #1a2230;
      --header-bg: #0b0f17;
      --header-surface: rgba(255,255,255,0.05);
      --border: rgba(255,255,255,0.06);
      --border-strong: rgba(255,255,255,0.10);
      --text: #e8edf5;
      --text-muted: #8a93a3;
      --text-subtle: #5d6675;
      --accent: #6ea8fe;
      --accent-strong: #94c0ff;
      --accent-soft: rgba(110, 168, 254, 0.14);
      --success: #4ade80;
      --warning: #fbbf24;
      --danger: #f87171;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.18);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.28);
      --shadow-lg: 0 12px 32px rgba(0,0,0,0.42);
      --shadow: var(--shadow-sm);
      --code-bg: #0a0e15;
      --code-inline-bg: rgba(255,255,255,0.06);
      --mark-bg: #fcd34d;
      --mark-text: #1a1300;
      --scrollbar-track: transparent;
      --scrollbar-thumb: rgba(255,255,255,0.14);
      --scrollbar-thumb-hover: rgba(255,255,255,0.26);
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
    }
    html[data-theme='light'] {
      color-scheme: light;
      --bg: #fbfbfd;
      --bg-elevated: #ffffff;
      --bg-muted: #f3f4f8;
      --bg-hover: #ebedf2;
      --header-bg: #ffffff;
      --header-surface: rgba(15, 23, 42, 0.04);
      --border: rgba(15, 23, 42, 0.08);
      --border-strong: rgba(15, 23, 42, 0.14);
      --text: #0f172a;
      --text-muted: #475569;
      --text-subtle: #94a3b8;
      --accent: #2563eb;
      --accent-strong: #1d4ed8;
      --accent-soft: rgba(37, 99, 235, 0.10);
      --success: #16a34a;
      --warning: #d97706;
      --danger: #dc2626;
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
      --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
      --shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.12);
      --shadow: var(--shadow-sm);
      --code-bg: #f5f6f8;
      --code-inline-bg: rgba(15, 23, 42, 0.06);
      --mark-bg: #fde68a;
      --mark-text: #422006;
      --scrollbar-track: transparent;
      --scrollbar-thumb: rgba(15, 23, 42, 0.16);
      --scrollbar-thumb-hover: rgba(15, 23, 42, 0.28);
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); }
    body { min-height: 100vh; line-height: 1.5; }
    * {
      scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
      scrollbar-width: thin;
    }
    *::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }
    *::-webkit-scrollbar-track {
      background: var(--scrollbar-track);
    }
    *::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-thumb);
      border: 3px solid var(--scrollbar-track);
      border-radius: 999px;
    }
    *::-webkit-scrollbar-thumb:hover {
      background-color: var(--scrollbar-thumb-hover);
    }
    *::-webkit-scrollbar-corner {
      background: var(--scrollbar-track);
    }
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
      padding: 8px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text);
      outline: none;
      font-size: 13px;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }
    .empty-state {
      padding: 20px;
      border: 1px dashed var(--border);
      border-radius: var(--radius-lg);
      background: var(--bg-elevated);
      color: var(--text-muted);
    }
    .warning-banner {
      display: block;
      padding: 0;
      border-radius: 14px;
      border: 1px solid rgba(255, 192, 91, 0.24);
      background: rgba(255, 192, 91, 0.12);
      color: var(--text);
    }
    .warning-banner > summary {
      list-style: none;
      cursor: pointer;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;
    }
    .warning-banner > summary::-webkit-details-marker {
      display: none;
    }
    .warning-banner > summary::before {
      content: '';
      width: 0;
      height: 0;
      border-left: 5px solid currentColor;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      transition: transform 120ms ease;
      opacity: 0.7;
    }
    .warning-banner[open] > summary::before {
      transform: rotate(90deg);
    }
    .warning-banner strong {
      font-size: 13px;
    }
    .warning-banner ul {
      margin: 0;
      padding: 0 16px 12px 34px;
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
      padding: 6px 10px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      text-align: left;
      cursor: pointer;
      font-size: 13px;
      transition: background 120ms ease, color 120ms ease;
    }
    .tree-button:hover {
      background: var(--bg-hover);
      color: var(--text);
    }
    .tree-button.is-active {
      background: var(--accent-soft);
      color: var(--accent-strong);
      font-weight: 550;
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
