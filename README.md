# Doudoc

Doudoc is a VS Code extension that reads the documentation in `/<projectRoot>/docs` and displays it in a modern interface with:

- a compact `WebviewView` in the activity bar;
- a main `WebviewPanel` for reading;
- global search on title + content;
- in-page search with highlighting;
- a clickable table of contents;
- support for Markdown relative links and local images.

## Marketplace

Doudoc is ready for initial publication `1.0.0` on the VS Code Marketplace.

- license: `MIT`
- repository: `https://github.com/Doulla1/Doudoc`
- publisher: `adiallo`

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

Once the extension is installed:

- open the `Doudoc` activity bar;
- verify the dedicated Activity Bar icon;
- open pages from the `WebviewView`;
- test global search and in-page search;
- verify the display of non-blocking warnings.

## Current limitations

- inline WYSIWYG editing is not yet implemented;
- warnings are informative but not yet interactive;
- support for complex Markdown content errors remains intentionally minimal.

## Development

```bash
npm install
npm run build
npm test
```
