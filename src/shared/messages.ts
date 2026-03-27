import type { DocSearchResult, DocTreeNode, RenderedDocPage, ThemeMode } from './types';

export type ExplorerToHostMessage =
  | { type: 'explorer-ready' }
  | { type: 'explorer-search'; query: string }
  | { type: 'open-page'; relativePath: string }
  | { type: 'toggle-theme' }
  | { type: 'refresh-docs' };

export type PanelToHostMessage =
  | { type: 'panel-ready' }
  | { type: 'panel-search'; query: string }
  | { type: 'panel-open-page'; relativePath: string; anchor?: string }
  | { type: 'toggle-theme' }
  | { type: 'refresh-docs' };

export type HostToExplorerMessage =
  | {
      type: 'explorer-state';
      theme: ThemeMode;
      tree: DocTreeNode[];
      selectedPath: string | null;
      query: string;
      hasDocsDirectory: boolean;
      docsRoot: string | null;
      warnings: string[];
    };

export type HostToPanelMessage =
  | {
      type: 'panel-state';
      theme: ThemeMode;
      tree: DocTreeNode[];
      selectedPath: string | null;
      query: string;
      hasDocsDirectory: boolean;
      docsRoot: string | null;
      results: DocSearchResult[];
      warnings: string[];
    }
  | {
      type: 'panel-page';
      page: RenderedDocPage | null;
      anchor?: string;
    };
