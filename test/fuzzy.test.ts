import { describe, expect, it } from 'vitest';
import { searchPages } from '../src/core/search';
import type { DocPageRecord } from '../src/shared/types';

const page: DocPageRecord = {
  id: 'file:authentication.md',
  label: 'Authentication',
  fileName: 'authentication.md',
  relativePath: 'authentication.md',
  absolutePath: '/tmp/authentication.md',
  rawMarkdown: '# Authentication',
  plainText: '',
  sourceKey: 'docs',
  sourceRoot: '/tmp',
  wordCount: 0,
  headings: [{ id: 'sso', depth: 2, text: 'Single Sign-On' }],
};

describe('searchPages fuzzy', () => {
  it('matches title with one typo when fuzzy is enabled', () => {
    const results = searchPages([page], 'authetication');
    expect(results).toHaveLength(1);
    expect(results[0]?.matchType).toBe('title');
  });

  it('does not match when fuzzy is disabled', () => {
    const results = searchPages([page], 'authetication', { fuzzy: false });
    expect(results).toHaveLength(0);
  });

  it('still prioritises exact matches over fuzzy ones', () => {
    const results = searchPages([page], 'authentication');
    expect(results[0]?.score).toBeGreaterThan(900);
  });
});
