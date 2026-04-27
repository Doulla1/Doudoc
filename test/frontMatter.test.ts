import { describe, expect, it } from 'vitest';
import { parseFrontMatter } from '../src/core/frontMatter';

describe('parseFrontMatter', () => {
  it('returns null when no front matter is present', () => {
    const result = parseFrontMatter('# Hello\n\nbody');
    expect(result.frontMatter).toBeNull();
    expect(result.body).toBe('# Hello\n\nbody');
  });

  it('parses scalar fields and inline arrays', () => {
    const md = '---\ntitle: "Getting started"\ndate: 2026-04-27\ntags: [intro, guide]\ndescription: First steps\n---\n# Title\nbody';
    const result = parseFrontMatter(md);
    expect(result.frontMatter?.title).toBe('Getting started');
    expect(result.frontMatter?.date).toBe('2026-04-27');
    expect(result.frontMatter?.tags).toEqual(['intro', 'guide']);
    expect(result.frontMatter?.description).toBe('First steps');
    expect(result.body).toBe('# Title\nbody');
  });

  it('parses block sequences for tags', () => {
    const md = '---\ntitle: Hello\ntags:\n  - alpha\n  - beta\n---\nbody';
    const result = parseFrontMatter(md);
    expect(result.frontMatter?.tags).toEqual(['alpha', 'beta']);
  });

  it('preserves comma-separated tags written as a string', () => {
    const md = '---\ntags: a, b, c\n---\n';
    const result = parseFrontMatter(md);
    expect(result.frontMatter?.tags).toEqual(['a', 'b', 'c']);
  });
});
