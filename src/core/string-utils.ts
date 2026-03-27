export function splitIdentifierWords(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleCase(input: string): string {
  return input
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatFileLabel(fileName: string): string {
  const baseName = fileName.replace(/\.md$/i, '');
  const separated = splitIdentifierWords(baseName);
  return titleCase(separated || baseName);
}

export function normalizeSearchText(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildExcerpt(content: string, query: string, radius = 80): string {
  const normalizedContent = normalizeSearchText(content);
  const normalizedQuery = normalizeSearchText(query);
  const index = normalizedContent.indexOf(normalizedQuery);

  if (index === -1) {
    return content.slice(0, radius * 2).trim();
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + query.length + radius);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < content.length ? '…' : '';
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}
