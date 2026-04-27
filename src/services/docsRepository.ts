import * as fs from 'node:fs/promises';
import * as syncFs from 'node:fs';
import * as path from 'node:path';
import { analyzeMarkdown, extractRelativeLinks, renderMarkdown } from '@core/markdown';
import { formatFileLabel, normalizeSearchText } from '@core/string-utils';
import { searchPages } from '@core/search';
import type {
  DocPageRecord,
  DocSourceInfo,
  DocsSnapshot,
  DocSearchResult,
  DocTreeNode,
  RenderedDocPage,
} from '@shared/types';
import * as vscode from 'vscode';

interface DocSourceConfig {
  configuredPath: string;
  rootAbsolute: string;
  key: string;
  label: string;
  isExternal: boolean;
  externalFile?: string;
}

const EXTERNAL_KEY_PREFIX = '__ext';

export class DocsRepository {
  private snapshot: DocsSnapshot = {
    docsRoot: null,
    hasDocsDirectory: false,
    sources: [],
    tree: [],
    pages: [],
    warnings: [],
  };

  private configuredPaths: string[] = ['docs'];
  private externalFiles: string[] = [];
  private externalCounter = 0;
  private gitMtimeCache = new Map<string, number | null>();
  private projectRoots: string[];
  private useGitMTime = true;
  private fuzzySearchEnabled = true;

  constructor(projectRoot: string | string[]) {
    this.projectRoots = Array.isArray(projectRoot) ? [...projectRoot] : [projectRoot];
  }

  setProjectRoots(roots: string[]): void {
    this.projectRoots = roots.length > 0 ? [...roots] : this.projectRoots;
  }

  getProjectRoots(): string[] {
    return [...this.projectRoots];
  }

  setUseGitMTime(value: boolean): void {
    this.useGitMTime = value;
  }

  setFuzzySearchEnabled(value: boolean): void {
    this.fuzzySearchEnabled = value;
  }

  setConfiguredPaths(paths: string[]): void {
    const sanitized = paths
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => entry.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, ''));
    this.configuredPaths = sanitized.length > 0 ? sanitized : ['docs'];
  }

  getConfiguredPaths(): string[] {
    return [...this.configuredPaths];
  }

  addExternalFile(absolutePath: string): string | null {
    const normalized = path.normalize(absolutePath);
    if (!normalized.toLowerCase().endsWith('.md')) {
      return null;
    }
    if (!this.externalFiles.includes(normalized)) {
      this.externalFiles.push(normalized);
    }
    return normalized;
  }

  getSourceRoots(): string[] {
    return this.snapshot.sources.filter((source) => !source.isExternal).map((source) => source.rootPath);
  }

  async refresh(): Promise<DocsSnapshot> {
    this.gitMtimeCache.clear();
    const sources = await this.buildSources();

    if (sources.length === 0) {
      this.snapshot = {
        docsRoot: null,
        hasDocsDirectory: false,
        sources: [],
        tree: [],
        pages: [],
        warnings: [],
      };
      return this.snapshot;
    }

    const pages: DocPageRecord[] = [];
    const warnings: string[] = [];
    const sourceTrees: DocTreeNode[] = [];
    const existingSources: DocSourceInfo[] = [];

    for (const source of sources) {
      const exists = await this.pathExists(source.rootAbsolute);
      const sourceInfo: DocSourceInfo = {
        key: source.key,
        label: source.label,
        rootPath: source.rootAbsolute,
        exists,
        isExternal: source.isExternal,
      };
      existingSources.push(sourceInfo);

      if (!exists) {
        if (!source.isExternal) {
          warnings.push(`Configured docs path does not exist: ${source.configuredPath}`);
        }
        continue;
      }

      if (source.isExternal && source.externalFile) {
        const node = await this.readSingleFile(
          source.externalFile,
          source.rootAbsolute,
          source.key,
          pages,
          warnings,
        );
        if (node) {
          sourceTrees.push({
            id: `dir:${source.key}`,
            type: 'directory',
            name: source.label,
            label: source.label,
            relativePath: source.key,
            children: [node],
          });
        }
        continue;
      }

      const children = await this.readDirectory(source.rootAbsolute, source.rootAbsolute, source.key, pages, warnings);

      if (sources.length === 1) {
        sourceTrees.push(...children);
      } else if (children.length > 0) {
        sourceTrees.push({
          id: `dir:${source.key}`,
          type: 'directory',
          name: source.label,
          label: source.label,
          relativePath: source.key,
          children,
        });
      }
    }

    const validSources = existingSources.filter((source) => source.exists);
    this.snapshot = {
      docsRoot: validSources.find((source) => !source.isExternal)?.rootPath ?? validSources[0]?.rootPath ?? null,
      hasDocsDirectory: validSources.length > 0,
      sources: existingSources,
      tree: sourceTrees,
      pages: pages.sort((left, right) => left.label.localeCompare(right.label)),
      warnings,
    };

    this.detectBrokenLinks();

    return this.snapshot;
  }

  getSnapshot(): DocsSnapshot {
    return this.snapshot;
  }

  search(query: string): DocSearchResult[] {
    return searchPages(this.snapshot.pages, query, { fuzzy: this.fuzzySearchEnabled });
  }

  filterTree(query: string): DocTreeNode[] {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
      return this.snapshot.tree;
    }

    const matchingPaths = new Set(
      this.snapshot.pages
        .filter((page) => {
          const fmText = page.frontMatter
            ? [page.frontMatter.description ?? '', ...(page.frontMatter.tags ?? [])].join(' ')
            : '';
          const haystack = normalizeSearchText(
            [page.label, ...page.headings.map((heading) => heading.text), fmText, page.plainText].join(' '),
          );
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

    if (!page) {
      return null;
    }

    const rendered = renderMarkdown(page.rawMarkdown, {
      currentAbsolutePath: page.absolutePath,
      docsRoot: page.sourceRoot,
      resolveDocumentHref: (absolutePath) => {
        const target = this.snapshot.pages.find((candidate) => candidate.absolutePath === absolutePath);
        if (target) {
          return target.relativePath;
        }
        return path.relative(page.sourceRoot, absolutePath).split(path.sep).join('/');
      },
      resolveAssetHref: (absolutePath) => webview.asWebviewUri(vscode.Uri.file(absolutePath)).toString(),
      pathExists: (absolutePath) => syncFs.existsSync(absolutePath),
    });

    const readingMinutes = Math.max(1, Math.ceil(page.wordCount / 130));

    const gitMtime = this.getGitLastModified(page.absolutePath);

    return {
      id: page.id,
      label: page.label,
      relativePath: page.relativePath,
      absolutePath: page.absolutePath,
      html: rendered.html,
      headings: rendered.headings,
      warnings: rendered.warnings,
      wordCount: page.wordCount,
      readingMinutes,
      frontMatter: page.frontMatter,
      lastModified: gitMtime ?? page.lastModified,
      lastModifiedSource: gitMtime ? 'git' : page.lastModified ? 'fs' : undefined,
    };
  }

  private getGitLastModified(absolutePath: string): number | undefined {
    if (!this.useGitMTime) return undefined;
    if (this.gitMtimeCache.has(absolutePath)) {
      const cached = this.gitMtimeCache.get(absolutePath);
      return cached === null ? undefined : cached ?? undefined;
    }
    try {
      // child_process is only loaded lazily so it stays optional in tests.
      const cp: typeof import('node:child_process') = require('node:child_process');
      const result = cp.spawnSync(
        'git',
        ['log', '-1', '--format=%ct', '--', absolutePath],
        { cwd: path.dirname(absolutePath), encoding: 'utf8', timeout: 1500 },
      );
      if (result.status === 0 && result.stdout.trim()) {
        const seconds = Number.parseInt(result.stdout.trim(), 10);
        if (Number.isFinite(seconds) && seconds > 0) {
          const ms = seconds * 1000;
          this.gitMtimeCache.set(absolutePath, ms);
          return ms;
        }
      }
    } catch {
      // Git unavailable or path not tracked.
    }
    this.gitMtimeCache.set(absolutePath, null);
    return undefined;
  }

  getPageByAbsolutePath(absolutePath: string): DocPageRecord | undefined {
    const normalized = path.normalize(absolutePath);
    return this.snapshot.pages.find((page) => page.absolutePath === normalized);
  }

  getDefaultPagePath(): string | null {
    return this.snapshot.pages[0]?.relativePath ?? null;
  }

  async savePage(relativePath: string, markdown: string): Promise<void> {
    const page = this.snapshot.pages.find((candidate) => candidate.relativePath === relativePath);
    if (!page) {
      throw new Error('Page not found');
    }
    if (!page.absolutePath.startsWith(page.sourceRoot)) {
      throw new Error('Path escapes source root');
    }
    await fs.writeFile(page.absolutePath, markdown, 'utf8');
  }

  getPageTimestamp(relativePath: string): number | null {
    const page = this.snapshot.pages.find((candidate) => candidate.relativePath === relativePath);
    if (!page) {
      return null;
    }
    try {
      return syncFs.statSync(page.absolutePath).mtimeMs;
    } catch {
      return null;
    }
  }

  getPageSourceRoot(relativePath: string): string | null {
    const page = this.snapshot.pages.find((candidate) => candidate.relativePath === relativePath);
    return page?.sourceRoot ?? null;
  }

  private async buildSources(): Promise<DocSourceConfig[]> {
    const sources: DocSourceConfig[] = [];
    const usedKeys = new Set<string>();
    const multiRoot = this.projectRoots.length > 1;

    for (const projectRoot of this.projectRoots) {
      const rootName = path.basename(projectRoot);
      for (const configuredPath of this.configuredPaths) {
        const rootAbsolute = path.normalize(path.resolve(projectRoot, configuredPath));
        const baseLabel = multiRoot ? `${rootName}/${configuredPath}` : configuredPath;
        let key = baseLabel;
        let suffix = 1;
        while (usedKeys.has(key)) {
          suffix += 1;
          key = `${baseLabel}#${suffix}`;
        }
        usedKeys.add(key);
        sources.push({
          configuredPath,
          rootAbsolute,
          key,
          label: baseLabel,
          isExternal: false,
        });
      }
    }

    for (const externalFile of this.externalFiles) {
      const normalized = path.normalize(externalFile);
      const insideExisting = sources.some(
        (source) =>
          normalized === source.rootAbsolute ||
          normalized.startsWith(source.rootAbsolute + path.sep),
      );
      if (insideExisting) {
        continue;
      }
      this.externalCounter += 1;
      const key = `${EXTERNAL_KEY_PREFIX}-${this.externalCounter}`;
      const label = path.basename(normalized);
      sources.push({
        configuredPath: normalized,
        rootAbsolute: path.dirname(normalized),
        key,
        label,
        isExternal: true,
        externalFile: normalized,
      });
    }

    return sources;
  }

  private detectBrokenLinks(): void {
    const knownAbsolutes = new Set(this.snapshot.pages.map((page) => page.absolutePath));
    for (const page of this.snapshot.pages) {
      const links = extractRelativeLinks(page.rawMarkdown);
      for (const link of links) {
        if (!link.toLowerCase().endsWith('.md')) {
          continue;
        }
        const targetPath = path.normalize(path.resolve(path.dirname(page.absolutePath), link));
        if (!syncFs.existsSync(targetPath)) {
          this.snapshot.warnings.push(`Broken link in ${page.relativePath}: ${link}`);
        } else if (!knownAbsolutes.has(targetPath) && !targetPath.startsWith(page.sourceRoot)) {
          this.snapshot.warnings.push(`Link in ${page.relativePath} points outside known sources: ${link}`);
        }
      }
    }
  }

  private async readSingleFile(
    absolutePath: string,
    sourceRoot: string,
    sourceKey: string,
    pages: DocPageRecord[],
    warnings: string[],
  ): Promise<DocTreeNode | null> {
    const fileName = path.basename(absolutePath);
    const relativePath = `${sourceKey}/${fileName}`;
    try {
      const rawMarkdown = await fs.readFile(absolutePath, 'utf8');
      const analysis = analyzeMarkdown(rawMarkdown);
      const label = analysis.firstTitle ?? formatFileLabel(fileName);
      const wordCount = analysis.plainText ? analysis.plainText.split(/\s+/).filter(Boolean).length : 0;
      let lastModified: number | undefined;
      try { lastModified = syncFs.statSync(absolutePath).mtimeMs; } catch { /* ignore */ }
      const page: DocPageRecord = {
        id: `file:${relativePath}`,
        label,
        fileName,
        relativePath,
        absolutePath: path.normalize(absolutePath),
        sourceKey,
        sourceRoot,
        rawMarkdown,
        plainText: analysis.plainText,
        wordCount,
        headings: analysis.headings,
        frontMatter: analysis.frontMatter ?? undefined,
        lastModified,
      };
      pages.push(page);
      return {
        id: page.id,
        type: 'file',
        name: fileName,
        label,
        relativePath,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      warnings.push(`Unable to read ${absolutePath}: ${reason}`);
      return null;
    }
  }

  private async readDirectory(
    currentAbsolutePath: string,
    sourceRoot: string,
    sourceKey: string,
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
      const absolutePath = path.normalize(path.join(currentAbsolutePath, entry.name));
      const innerRelative = path.relative(sourceRoot, absolutePath).split(path.sep).join('/');
      const relativePath = `${sourceKey}/${innerRelative}`;

      if (entry.isDirectory()) {
        const children = await this.readDirectory(absolutePath, sourceRoot, sourceKey, pages, warnings);
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
        const wordCount = analysis.plainText ? analysis.plainText.split(/\s+/).filter(Boolean).length : 0;
        let lastModified: number | undefined;
        try { lastModified = syncFs.statSync(absolutePath).mtimeMs; } catch { /* ignore */ }

        const page: DocPageRecord = {
          id: `file:${relativePath}`,
          label,
          fileName: entry.name,
          relativePath,
          absolutePath,
          sourceKey,
          sourceRoot,
          rawMarkdown,
          plainText: analysis.plainText,
          wordCount,
          headings: analysis.headings,
          frontMatter: analysis.frontMatter ?? undefined,
          lastModified,
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
