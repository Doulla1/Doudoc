import { describe, expect, it } from 'vitest';
import { searchPages } from '../src/core/search';
import type { DocPageRecord } from '../src/shared/types';

const pages: DocPageRecord[] = [
  {
    id: 'file:introduction.md',
    label: 'Introduction',
    fileName: 'introduction.md',
    relativePath: 'introduction.md',
    absolutePath: '/tmp/introduction.md',
    rawMarkdown: '# Introduction',
    plainText: 'This page explains the project setup and first steps.',
    headings: [{ id: 'setup', depth: 2, text: 'Setup' }],
  },
  {
    id: 'file:api.md',
    label: 'API Reference',
    fileName: 'api.md',
    relativePath: 'api.md',
    absolutePath: '/tmp/api.md',
    rawMarkdown: '# API Reference',
    plainText: 'Methods, payloads and authentication details.',
    headings: [{ id: 'authentication', depth: 2, text: 'Authentication' }],
  },
  {
    id: 'file:cafe-guide.md',
    label: 'Café Guide',
    fileName: 'cafe-guide.md',
    relativePath: 'cafe-guide.md',
    absolutePath: '/tmp/cafe-guide.md',
    rawMarkdown: '# Café Guide',
    plainText: 'Déploiement et résumé des étapes.',
    headings: [{ id: 'demarrage', depth: 2, text: 'Démarrage rapide' }],
  },
];

describe('searchPages', () => {
  it('ranks title matches above content matches', () => {
    const results = searchPages(pages, 'api');

    expect(results[0]?.label).toBe('API Reference');
    expect(results[0]?.matchType).toBe('title');
  });

  it('finds content matches when the title does not match', () => {
    const results = searchPages(pages, 'payloads');

    expect(results).toHaveLength(1);
    expect(results[0]?.label).toBe('API Reference');
    expect(results[0]?.matchType).toBe('content');
  });

  it('matches accented text without requiring accents in the query', () => {
    expect(searchPages(pages, 'cafe')[0]?.label).toBe('Café Guide');
    expect(searchPages(pages, 'demarrage')[0]?.matchType).toBe('heading');
    expect(searchPages(pages, 'deploiement')[0]?.matchType).toBe('content');
  });
});
