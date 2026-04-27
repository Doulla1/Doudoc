# Doudoc

Doudoc is a VS Code extension that reads the documentation in `/<projectRoot>/docs` (or any folder you configure) and displays it in a modern interface with:

- a compact `WebviewView` in the activity bar;
- a main `WebviewPanel` for reading;
- global search on title + content (with fuzzy typo tolerance);
- in-page search with highlighting;
- a clickable table of contents;
- Mermaid diagram rendering in fenced code blocks;
- syntax highlighting on code blocks (via highlight.js);
- support for Markdown relative links and local images;
- back / forward navigation history (`Alt+←` / `Alt+→`);
- quick-open palette (`Ctrl/Cmd+K`) to jump to any page by title;
- global VS Code quick-pick search (`Ctrl/Cmd+Alt+P`);
- reading progress bar and estimated reading time;
- last-modified date (from `git log` when available);
- YAML front matter (`title`, `description`, `date`, `tags`) with rendered header;
- in-place WYSIWYG editing with paste-image, conflict detection, **auto-save**;
- create a new page from the UI (toolbar `+` button or command palette);
- **zen mode** to hide sidebar and TOC for distraction-free reading;
- **export to PDF** via the native print dialog;
- multi-root workspace support — every workspace folder is scanned.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `doudoc.docsPaths` | `["docs"]` | Folder paths (relative to each workspace root) scanned as documentation sources. |
| `doudoc.defaultTheme` | `auto` | Webview theme: `auto` (follows VS Code), `light`, or `dark`. |
| `doudoc.readingWidth` | `comfortable` | Reading column width: `narrow`, `comfortable`, `wide`, `full`. |
| `doudoc.zenMode` | `false` | Start with sidebar and TOC hidden. Toggle with `Doudoc: Toggle zen mode`. |
| `doudoc.autoSave` | `false` | Save the current page automatically while editing. |
| `doudoc.autoSaveDelay` | `2000` | Debounce delay (ms, 500–60000) before auto-save fires. |
| `doudoc.useGitMTime` | `true` | Resolve last-modified date with `git log -1` when available; fallback to filesystem `mtime`. |
| `doudoc.fuzzySearch` | `true` | Allow 1–2 character typos in search queries. |

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
