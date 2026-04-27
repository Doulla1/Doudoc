import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import markdownLang from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import ini from 'highlight.js/lib/languages/ini';
import diff from 'highlight.js/lib/languages/diff';
import plaintext from 'highlight.js/lib/languages/plaintext';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import shell from 'highlight.js/lib/languages/shell';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createSlug } from './slug';
import { parseFrontMatter } from './frontMatter';
import type { DocFrontMatter, DocHeading } from '@shared/types';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('zsh', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('svg', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('sass', scss);
hljs.registerLanguage('markdown', markdownLang);
hljs.registerLanguage('md', markdownLang);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('java', java);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('docker', dockerfile);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('toml', ini);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);

export interface MarkdownAnalysis {
  firstTitle: string | null;
  headings: DocHeading[];
  plainText: string;
  frontMatter: DocFrontMatter | null;
  body: string;
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
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    breaks: false,
  });
  md.core.ruler.after('inline', 'doudoc-task-lists', (state) => {
    const tokens = state.tokens;
    for (let index = 0; index < tokens.length - 2; index += 1) {
      const itemOpen = tokens[index];
      const paragraphOpen = tokens[index + 1];
      const inline = tokens[index + 2];
      if (
        !itemOpen ||
        !paragraphOpen ||
        !inline ||
        itemOpen.type !== 'list_item_open' ||
        paragraphOpen.type !== 'paragraph_open' ||
        inline.type !== 'inline'
      ) {
        continue;
      }
      const match = /^\[([ xX])\]\s+/.exec(inline.content);
      if (!match) {
        continue;
      }
      const checked = match[1]?.toLowerCase() === 'x';
      itemOpen.attrJoin('class', 'task-list-item');
      inline.content = inline.content.slice(match[0].length);
      const firstChild = inline.children?.[0];
      if (firstChild && firstChild.type === 'text') {
        firstChild.content = firstChild.content.replace(/^\[([ xX])\]\s+/, '');
      }
      const checkbox = new state.Token('html_inline', '', 0);
      checkbox.content = `<input type="checkbox" class="task-list-checkbox"${checked ? ' checked' : ''}> `;
      inline.children?.unshift(checkbox);
    }
    return false;
  });
  return md;
}

export function extractRelativeLinks(markdown: string): string[] {
  const links: string[] = [];
  const linkRegex = /\[(?:[^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const href = match[1];
    if (!href) continue;
    if (href.startsWith('#')) continue;
    if (/^[a-z]+:/i.test(href)) continue;
    if (href.startsWith('data:')) continue;
    const cleanHref = href.split('#')[0];
    if (cleanHref) {
      links.push(cleanHref);
    }
  }
  return links;
}

export function analyzeMarkdown(markdown: string): MarkdownAnalysis {
  const { frontMatter, body } = parseFrontMatter(markdown);
  const markdownIt = createMarkdownIt();
  const tokens = markdownIt.parse(body, {});
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

  const fmTitle = frontMatter && typeof frontMatter.title === 'string' ? frontMatter.title.trim() : '';
  return {
    firstTitle: fmTitle || firstTitle,
    headings,
    plainText: textParts.join(' ').replace(/\s+/g, ' ').trim(),
    frontMatter: frontMatter ?? null,
    body,
  };
}

export function renderMarkdown(markdown: string, context: RenderContext): { html: string; headings: DocHeading[]; warnings: string[] } {
  const { body } = parseFrontMatter(markdown);
  const markdownIt = createMarkdownIt();
  const tokens = markdownIt.parse(body, {});
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

  const defaultFence = markdownIt.renderer.rules.fence;

  markdownIt.renderer.rules.table_open = () => '<div class="doc-table-wrap"><table>';
  markdownIt.renderer.rules.table_close = () => '</table></div>';

  markdownIt.renderer.rules.fence = (tokensArg: any[], idx: number, options: any, env: unknown, self: any) => {
    const token = tokensArg[idx];
    if (token?.info?.trim().toLowerCase() === 'mermaid') {
      const content = token.content;
      const escaped = escapeHtml(content.trimEnd());
      return `<div class="mermaid-block" data-mermaid-source="${escaped}"><pre class="mermaid">${escaped}</pre></div>\n`;
    }
    if (token) {
      const lang = (token.info || '').trim().split(/\s+/)[0]?.toLowerCase() ?? '';
      const raw = token.content ?? '';
      let highlighted: string;
      let resolvedLang = lang;
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(raw, { language: lang, ignoreIllegals: true }).value;
        } catch {
          highlighted = escapeHtml(raw);
        }
      } else {
        highlighted = escapeHtml(raw);
        if (!lang) {
          resolvedLang = 'text';
        }
      }
      const langAttr = resolvedLang ? ` data-lang="${escapeHtml(resolvedLang)}"` : '';
      const codeClass = resolvedLang && resolvedLang !== 'text' ? ` class="hljs language-${escapeHtml(resolvedLang)}"` : ' class="hljs"';
      const langLabel = resolvedLang && resolvedLang !== 'text' ? `<span class="code-block-lang">${escapeHtml(resolvedLang)}</span>` : '';
      return `<div class="code-block"${langAttr}>${langLabel}<button class="code-copy-btn" type="button" aria-label="Copy code">Copy</button><pre><code${codeClass}>${highlighted}</code></pre></div>\n`;
    }
    if (defaultFence) {
      return defaultFence(tokensArg, idx, options, env, self);
    }
    return self.renderToken(tokensArg, idx, options);
  };

  return {
    html: markdownIt.renderer.render(tokens, markdownIt.options, {}),
    headings,
    warnings,
  };
}
