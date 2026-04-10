import MarkdownIt from 'markdown-it';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createSlug } from './slug';
import type { DocHeading } from '@shared/types';

export interface MarkdownAnalysis {
  firstTitle: string | null;
  headings: DocHeading[];
  plainText: string;
}

interface RenderContext {
  currentAbsolutePath: string;
  docsRoot: string;
  resolveDocumentHref: (absolutePath: string) => string;
  resolveAssetHref: (absolutePath: string) => string;
  pathExists: (absolutePath: string) => boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createMarkdownIt(): MarkdownIt {
  return new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: false,
  });
}

export function analyzeMarkdown(markdown: string): MarkdownAnalysis {
  const markdownIt = createMarkdownIt();
  const tokens = markdownIt.parse(markdown, {});
  const headings: DocHeading[] = [];
  const slugCounts = new Map<string, number>();
  let firstTitle: string | null = null;
  let firstTitleDepth = Number.POSITIVE_INFINITY;
  const textParts: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token) {
      continue;
    }

    if (token.type === 'heading_open') {
      const inline = tokens[index + 1];
      const depth = Number(token.tag.replace('h', ''));
      const text = inline?.content?.trim() ?? '';

      if (!text) {
        continue;
      }

      if (depth < firstTitleDepth) {
        firstTitle = text;
        firstTitleDepth = depth;
      }

      const baseSlug = createSlug(text) || 'section';
      const seen = slugCounts.get(baseSlug) ?? 0;
      slugCounts.set(baseSlug, seen + 1);

      headings.push({
        id: seen === 0 ? baseSlug : `${baseSlug}-${seen + 1}`,
        depth,
        text,
      });
    }

    if (token.type === 'inline' && token.content.trim()) {
      textParts.push(token.content);
    }
  }

  return {
    firstTitle,
    headings,
    plainText: textParts.join(' ').replace(/\s+/g, ' ').trim(),
  };
}

export function renderMarkdown(markdown: string, context: RenderContext): { html: string; headings: DocHeading[]; warnings: string[] } {
  const markdownIt = createMarkdownIt();
  const tokens = markdownIt.parse(markdown, {});
  const headings: DocHeading[] = [];
  const slugCounts = new Map<string, number>();
  const warnings: string[] = [];

  markdownIt.renderer.rules.heading_open = (tokensArg: any[], idx: number, _options: unknown, _env: unknown, self: any) => {
    const token = tokensArg[idx];
    const inline = tokensArg[idx + 1];

    if (!token) {
      return '';
    }

    const text = inline?.content?.trim() ?? '';
    const baseSlug = createSlug(text) || 'section';
    const seen = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, seen + 1);
    const id = seen === 0 ? baseSlug : `${baseSlug}-${seen + 1}`;
    const depth = Number(token.tag.replace('h', ''));

    headings.push({ id, depth, text });
    token.attrSet('id', id);

    return self.renderToken(tokensArg, idx, _options);
  };

  markdownIt.renderer.rules.link_open = (tokensArg: any[], idx: number, options: unknown, _env: unknown, self: any) => {
    const token = tokensArg[idx];

    if (!token) {
      return '';
    }

    const href = token.attrGet('href') ?? '';

    if (!href) {
      return self.renderToken(tokensArg, idx, options);
    }

    if (href.startsWith('#')) {
      return self.renderToken(tokensArg, idx, options);
    }

    if (/^[a-z]+:/i.test(href)) {
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noreferrer noopener');
      return self.renderToken(tokensArg, idx, options);
    }

    const [rawTargetPath, rawAnchor] = href.split('#');
    const resolvedPath = path.resolve(path.dirname(context.currentAbsolutePath), rawTargetPath);

    if (!resolvedPath.startsWith(context.docsRoot)) {
      token.attrSet('href', '#');
      token.attrSet('class', 'doc-invalid-link');
      token.attrSet('aria-disabled', 'true');
      token.attrSet('title', 'Link outside /docs was blocked');
      warnings.push(`Blocked relative link outside /docs: ${href}`);
      return self.renderToken(tokensArg, idx, options);
    }

    if (resolvedPath.toLowerCase().endsWith('.md')) {
      if (!context.pathExists(resolvedPath)) {
        token.attrSet('href', '#');
        token.attrSet('class', 'doc-invalid-link');
        token.attrSet('aria-disabled', 'true');
        token.attrSet('title', 'Target document not found');
        warnings.push(`Missing relative document: ${href}`);
        return self.renderToken(tokensArg, idx, options);
      }

      token.attrSet('href', '#');
      token.attrSet('data-doc-path', context.resolveDocumentHref(resolvedPath));
      if (rawAnchor) {
        token.attrSet('data-doc-anchor', rawAnchor);
      }
      return self.renderToken(tokensArg, idx, options);
    }

    if (!context.pathExists(resolvedPath)) {
      token.attrSet('href', '#');
      token.attrSet('class', 'doc-invalid-link');
      token.attrSet('aria-disabled', 'true');
      token.attrSet('title', 'Target asset not found');
      warnings.push(`Missing linked asset: ${href}`);
      return self.renderToken(tokensArg, idx, options);
    }

    token.attrSet('data-original-href', href);
    token.attrSet('href', context.resolveAssetHref(resolvedPath));
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noreferrer noopener');
    return self.renderToken(tokensArg, idx, options);
  };

  markdownIt.renderer.rules.image = (tokensArg: any[], idx: number, options: unknown, _env: unknown, self: any) => {
    const token = tokensArg[idx];

    if (!token) {
      return '';
    }

    const src = token.attrGet('src') ?? '';

    if (!src || /^[a-z]+:/i.test(src) || src.startsWith('data:')) {
      return self.renderToken(tokensArg, idx, options);
    }

    const resolvedPath = path.resolve(path.dirname(context.currentAbsolutePath), src);

    if (!resolvedPath.startsWith(context.docsRoot)) {
      warnings.push(`Blocked image outside /docs: ${src}`);
      return `<div class="doc-asset-warning">Image blocked because it points outside <code>/docs</code>: ${escapeHtml(src)}</div>`;
    }

    if (!context.pathExists(resolvedPath)) {
      warnings.push(`Missing image asset: ${src}`);
      return `<div class="doc-asset-warning">Missing image asset: <code>${escapeHtml(src)}</code></div>`;
    }

    token.attrSet('data-original-src', src);
    token.attrSet('src', context.resolveAssetHref(resolvedPath));
    token.attrSet('loading', 'lazy');
    return self.renderToken(tokensArg, idx, options);
  };

  return {
    html: markdownIt.renderer.render(tokens, markdownIt.options, {}),
    headings,
    warnings,
  };
}
