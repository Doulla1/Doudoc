import { buildExcerpt, normalizeSearchText } from './string-utils';
import type { DocPageRecord, DocSearchResult } from '@shared/types';

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

export function searchPages(pages: DocPageRecord[], query: string): DocSearchResult[] {
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
