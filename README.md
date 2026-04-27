# Doudoc

Doudoc is a VS Code extension that reads the documentation in `/<projectRoot>/docs` (or any folder you configure) and displays it in a modern interface with:

- a compact `WebviewView` in the activity bar;
- a main `WebviewPanel` for reading;
- global search on title + content;
- in-page search with highlighting;
- a clickable table of contents;
- Mermaid diagram rendering in fenced code blocks;
- syntax highlighting on code blocks (via highlight.js);
- support for Markdown relative links and local images;
- back / forward navigation history (`Alt+←` / `Alt+→`);
- quick-open palette (`Ctrl/Cmd+K`) to jump to any page by title;
- reading progress bar and estimated reading time;
- in-place WYSIWYG editing with paste-image, conflict detection, autosave-friendly toolbar.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `doudoc.docsPaths` | `["docs"]` | Array of folder paths (relative to the workspace root) scanned by Doudoc as documentation sources. Configure several to expose multiple knowledge bases. |

## Open any Markdown file

Right-click a `.md` file in the explorer, in the editor, or on its tab and pick **Open with Doudoc** to read it in the panel — even if it lives outside your configured `docsPaths`.

## Pre-publication

```bash
npm install
npm run verify
npm run package
```

The `npm run package` command produces `doudoc-1.0.0.vsix` and automatically triggers the build via `vscode:prepublish`.

## Local installation

1. Generate the package:

```bash
npm install
npm run package
```

2. In VS Code:

- open `Extensions`
- open the `...` menu
- select `Install from VSIX...`
- select `doudoc-1.0.0.vsix`

## Quick test

The project contains a demo `docs/` folder with:

- multi-level file tree;
- relative links between pages;
- a local image;
- label fallback cases;
- warning cases for unresolved assets or links.

## Development

```bash
npm install
npm run build
npm test
```
