# Doudoc

Doudoc is a VS Code extension that reads the documentation in `/<projectRoot>/docs` and displays it in a modern interface with:

- a compact `WebviewView` in the activity bar;
- a main `WebviewPanel` for reading;
- global search on title + content;
- in-page search with highlighting;
- a clickable table of contents;
- support for Markdown relative links and local images.

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
