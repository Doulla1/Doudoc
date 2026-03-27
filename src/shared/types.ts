export type ThemeMode = 'dark' | 'light';

export type DocNodeType = 'directory' | 'file';

export interface DocHeading {
  id: string;
  depth: number;
  text: string;
}

export interface DocTreeNode {
  id: string;
  type: DocNodeType;
  name: string;
  label: string;
  relativePath: string;
  children?: DocTreeNode[];
}

export interface DocPageRecord {
  id: string;
  label: string;
  fileName: string;
  relativePath: string;
  absolutePath: string;
  rawMarkdown: string;
  plainText: string;
  headings: DocHeading[];
}

export interface RenderedDocPage {
  id: string;
  label: string;
  relativePath: string;
  html: string;
  headings: DocHeading[];
  warnings: string[];
}

export interface DocSearchResult {
  id: string;
  relativePath: string;
  label: string;
  score: number;
  matchType: 'title' | 'heading' | 'content';
  excerpt: string;
}

export interface DocsSnapshot {
  docsRoot: string | null;
  hasDocsDirectory: boolean;
  tree: DocTreeNode[];
  pages: DocPageRecord[];
  warnings: string[];
}

export interface DocsStatePayload {
  theme: ThemeMode;
  docsRoot: string | null;
  hasDocsDirectory: boolean;
  tree: DocTreeNode[];
  selectedPath: string | null;
  searchQuery: string;
  searchResults: DocSearchResult[];
}
