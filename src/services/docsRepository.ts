import * as fs from 'node:fs/promises';
import * as syncFs from 'node:fs';
import * as path from 'node:path';
import { analyzeMarkdown, renderMarkdown } from '@core/markdown';
import { formatFileLabel, normalizeSearchText } from '@core/string-utils';
import { searchPages } from '@core/search';
import type { DocPageRecord, DocsSnapshot, DocSearchResult, DocTreeNode, RenderedDocPage } from '@shared/types';
import * as vscode from 'vscode';

export class DocsRepository {
  private snapshot: DocsSnapshot = {
    docsRoot: null,
    hasDocsDirectory: false,
    tree: [],
    pages: [],
    warnings: [],
  };

  constructor(private readonly projectRoot: string) {}

  async refresh(): Promise<DocsSnapshot> {
    const docsRoot = path.join(this.projectRoot, 'docs');
    const hasDocsDirectory = await this.pathExists(docsRoot);

    if (!hasDocsDirectory) {
      this.snapshot = {
        docsRoot,
        hasDocsDirectory: false,
        tree: [],
        pages: [],
        warnings: [],
      };
      return this.snapshot;
    }

    const pages: DocPageRecord[] = [];
    const warnings: string[] = [];
    const tree = await this.readDirectory(docsRoot, docsRoot, pages, warnings);

    this.snapshot = {
      docsRoot,
      hasDocsDirectory: true,
      tree,
      pages: pages.sort((left, right) => left.label.localeCompare(right.label)),
      warnings,
    };

    return this.snapshot;
  }

  getSnapshot(): DocsSnapshot {
    return this.snapshot;
  }

  search(query: string): DocSearchResult[] {
    return searchPages(this.snapshot.pages, query);
  }

  filterTree(query: string): DocTreeNode[] {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
      return this.snapshot.tree;
    }

    const matchingPaths = new Set(
      this.snapshot.pages
        .filter((page) => {
          const haystack = normalizeSearchText([page.label, ...page.headings.map((heading) => heading.text), page.plainText].join(' '));
          return haystack.includes(normalizedQuery);
        })
        .map((page) => page.relativePath),
    );

    const filterNodes = (nodes: DocTreeNode[]): DocTreeNode[] =>
      nodes
        .map((node) => {
          if (node.type === 'file') {
            return matchingPaths.has(node.relativePath) ? node : null;
          }

          const children = filterNodes(node.children ?? []);
          if (children.length === 0) {
            return null;
          }

          return {
            ...node,
            children,
          };
        })
        .filter((node): node is DocTreeNode => node !== null);

    return filterNodes(this.snapshot.tree);
  }

  getPage(relativePath: string, webview: vscode.Webview): RenderedDocPage | null {
    const page = this.snapshot.pages.find((candidate) => candidate.relativePath === relativePath);

    if (!page || !this.snapshot.docsRoot) {
      return null;
    }

    const rendered = renderMarkdown(page.rawMarkdown, {
      currentAbsolutePath: page.absolutePath,
      docsRoot: this.snapshot.docsRoot,
      resolveDocumentHref: (absolutePath) => path.relative(this.snapshot.docsRoot as string, absolutePath).split(path.sep).join('/'),
      resolveAssetHref: (absolutePath) => webview.asWebviewUri(vscode.Uri.file(absolutePath)).toString(),
      pathExists: (absolutePath) => syncFs.existsSync(absolutePath),
    });

    return {
      id: page.id,
      label: page.label,
      relativePath: page.relativePath,
      html: rendered.html,
      headings: rendered.headings,
      warnings: rendered.warnings,
    };
  }

  getDefaultPagePath(): string | null {
    return this.snapshot.pages[0]?.relativePath ?? null;
  }

  private async readDirectory(
    currentAbsolutePath: string,
    docsRoot: string,
    pages: DocPageRecord[],
    warnings: string[],
  ): Promise<DocTreeNode[]> {
    const entries = await fs.readdir(currentAbsolutePath, { withFileTypes: true });
    const visibleEntries = entries
      .filter((entry) => !entry.name.startsWith('.'))
      .filter((entry) => entry.isDirectory() || entry.name.toLowerCase().endsWith('.md'))
      .sort((left, right) => {
        if (left.isDirectory() && !right.isDirectory()) {
          return -1;
        }

        if (!left.isDirectory() && right.isDirectory()) {
          return 1;
        }

        return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
      });

    const nodes: DocTreeNode[] = [];

    for (const entry of visibleEntries) {
      const absolutePath = path.join(currentAbsolutePath, entry.name);
      const relativePath = path.relative(docsRoot, absolutePath).split(path.sep).join('/');

      if (entry.isDirectory()) {
        const children = await this.readDirectory(absolutePath, docsRoot, pages, warnings);
        if (children.length > 0) {
          nodes.push({
            id: `dir:${relativePath}`,
            type: 'directory',
            name: entry.name,
            label: formatFileLabel(entry.name),
            relativePath,
            children,
          });
        }
        continue;
      }

      try {
        const rawMarkdown = await fs.readFile(absolutePath, 'utf8');
        const analysis = analyzeMarkdown(rawMarkdown);
        const label = analysis.firstTitle ?? formatFileLabel(entry.name);

        const page: DocPageRecord = {
          id: `file:${relativePath}`,
          label,
          fileName: entry.name,
          relativePath,
          absolutePath,
          rawMarkdown,
          plainText: analysis.plainText,
          headings: analysis.headings,
        };

        pages.push(page);
        nodes.push({
          id: page.id,
          type: 'file',
          name: entry.name,
          label: page.label,
          relativePath,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        warnings.push(`Unable to read ${relativePath}: ${reason}`);
      }
    }

    return nodes;
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}
