import { buildExcerpt, normalizeSearchText } from './string-utils';
import type { DocPageRecord, DocSearchResult } from '@shared/types';

function levenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > max) return max + 1;
  if (!lenA) return lenB;
  if (!lenB) return lenA;
  let prev = new Array(lenB + 1);
  let curr = new Array(lenB + 1);
  for (let j = 0; j <= lenB; j += 1) prev[j] = j;
  for (let i = 1; i <= lenA; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= lenB; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[lenB];
}

function fuzzyScore(candidate: string, query: string): number {
  const normalizedCandidate = normalizeSearchText(candidate);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedCandidate || !normalizedQuery) return 0;
  if (normalizedQuery.length < 4) return 0;
  const max = normalizedQuery.length <= 6 ? 1 : 2;
  const tokens = normalizedCandidate.split(/\s+/);
  let best = max + 1;
  for (const token of tokens) {
    if (Math.abs(token.length - normalizedQuery.length) > max) continue;
    const distance = levenshtein(token, normalizedQuery, max);
    if (distance < best) best = distance;
    if (best === 0) break;
  }
  if (best > max) return 0;
  // Closer matches score higher; never overtakes exact/prefix scoring.
  return Math.max(80, 220 - best * 80);
}

function scoreField(candidate: string, query: string, exact: number, prefix: number, partial: number): number {
  const normalizedCandidate = normalizeSearchText(candidate);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedCandidate || !normalizedQuery) {
    return 0;
  }

  if (normalizedCandidate === normalizedQuery) {
    return exact;
  }

  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return prefix;
  }

  if (normalizedCandidate.includes(normalizedQuery)) {
    return partial;
  }

  return 0;
}

function countOccurrences(candidate: string, query: string): number {
  const normalizedCandidate = normalizeSearchText(candidate);
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedCandidate || !normalizedQuery) {
    return 0;
  }

  let count = 0;
  let fromIndex = 0;

  while (fromIndex < normalizedCandidate.length) {
    const index = normalizedCandidate.indexOf(normalizedQuery, fromIndex);
    if (index === -1) {
      break;
    }
    count += 1;
    fromIndex = index + normalizedQuery.length;
  }

  return count;
}

export interface SearchOptions {
  fuzzy?: boolean;
}

export function searchPages(pages: DocPageRecord[], query: string, options: SearchOptions = {}): DocSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const results: DocSearchResult[] = [];

  for (const page of pages) {
    let score = 0;
    let matchType: DocSearchResult['matchType'] = 'content';

    const titleScore = scoreField(page.label, normalizedQuery, 1200, 900, 650);
    if (titleScore > score) {
      score = titleScore;
      matchType = 'title';
    }

    if (page.frontMatter?.tags?.length) {
      for (const tag of page.frontMatter.tags) {
        const tagScore = scoreField(tag, normalizedQuery, 950, 720, 500);
        if (tagScore > score) {
          score = tagScore;
          matchType = 'title';
        }
      }
    }

    if (page.frontMatter?.description) {
      const descScore = scoreField(page.frontMatter.description, normalizedQuery, 600, 420, 280);
      if (descScore > score) {
        score = descScore;
        matchType = 'content';
      }
    }

    for (const heading of page.headings) {
      const headingScore = scoreField(heading.text, normalizedQuery, 700, 520, 360);
      if (headingScore > score) {
        score = headingScore;
        matchType = 'heading';
      }
    }

    const occurrenceCount = countOccurrences(page.plainText, normalizedQuery);
    if (occurrenceCount > 0) {
      const contentScore = Math.min(320, 120 + occurrenceCount * 25);
      if (contentScore > score) {
        score = contentScore;
        matchType = 'content';
      }
    }

    if (score === 0) {
      const fuzzyTitle = options.fuzzy === false ? 0 : fuzzyScore(page.label, normalizedQuery);
      if (fuzzyTitle > score) {
        score = fuzzyTitle;
        matchType = 'title';
      }
      for (const heading of page.headings) {
        const fuzzyHeading = options.fuzzy === false ? 0 : fuzzyScore(heading.text, normalizedQuery);
        if (fuzzyHeading > score) {
          score = fuzzyHeading;
          matchType = 'heading';
        }
      }
    }

    if (score > 0) {
      results.push({
        id: page.id,
        relativePath: page.relativePath,
        label: page.label,
        score,
        matchType,
        excerpt: buildExcerpt(page.plainText, normalizedQuery),
      });
    }
  }

  return results.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
}
