import type { DocSearchResult, DocTreeNode, RenderedDocPage, ThemeMode } from './types';

export type ReadingWidth = 'narrow' | 'comfortable' | 'wide' | 'full';

export interface PanelPreferences {
  readingWidth: ReadingWidth;
  zenMode: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
}

export type ExplorerToHostMessage =
  | { type: 'explorer-ready' }
  | { type: 'explorer-search'; query: string }
  | { type: 'open-page'; relativePath: string }
  | { type: 'refresh-docs' };

export type PanelToHostMessage =
  | { type: 'panel-ready' }
  | { type: 'panel-search'; query: string }
  | { type: 'panel-open-page'; relativePath: string; anchor?: string }
  | { type: 'toggle-theme' }
  | { type: 'refresh-docs' }
  | { type: 'panel-enter-edit' }
  | { type: 'panel-save-page'; markdown: string; isAutoSave?: boolean }
  | { type: 'panel-cancel-edit' }
  | { type: 'panel-paste-image'; dataUrl: string }
  | { type: 'panel-open-in-editor'; relativePath: string }
  | { type: 'panel-toggle-zen' }
  | { type: 'panel-create-page' };

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
    preferences: PanelPreferences;
  }
  | {
    type: 'panel-page';
    page: RenderedDocPage | null;
    anchor?: string;
  }
  | {
    type: 'panel-edit-ready';
    editTimestamp: number;
  }
  | {
    type: 'panel-save-result';
    success: boolean;
    error?: string;
    isAutoSave?: boolean;
  }
  | {
    type: 'panel-edit-conflict';
  }
  | {
    type: 'panel-paste-image-result';
    success: boolean;
    relativePath?: string;
    assetUri?: string;
    error?: string;
  };
