export interface FrontMatter {
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  raw?: Record<string, unknown>;
}

export interface FrontMatterResult {
  frontMatter: FrontMatter | null;
  body: string;
}

const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null' || trimmed === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return stripQuotes(trimmed);
}

function parseInlineArray(value: string): unknown[] {
  const inner = value.trim().slice(1, -1);
  if (!inner.trim()) return [];
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let inQuote: string | null = null;
  for (const char of inner) {
    if (inQuote) {
      if (char === inQuote) inQuote = null;
      current += char;
      continue;
    }
    if (char === '"' || char === "'") { inQuote = char; current += char; continue; }
    if (char === '[' || char === '{') depth += 1;
    if (char === ']' || char === '}') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts.map((part) => parseScalar(part));
}

/**
 * Minimal YAML-like front matter parser supporting:
 * - scalars (strings, numbers, booleans)
 * - inline arrays: [a, b, c]
 * - block sequences:
 *     tags:
 *       - a
 *       - b
 * Sufficient for documentation metadata; not a full YAML implementation.
 */
export function parseFrontMatter(markdown: string): FrontMatterResult {
  const match = FRONT_MATTER_REGEX.exec(markdown);
  if (!match) {
    return { frontMatter: null, body: markdown };
  }

  const body = markdown.slice(match[0].length);
  const yaml = match[1] ?? '';
  const lines = yaml.split(/\r?\n/);
  const data: Record<string, unknown> = {};

  let currentKey: string | null = null;
  let currentList: unknown[] | null = null;

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) {
      continue;
    }

    // List item under previous key.
    const listMatch = /^\s+-\s+(.*)$/.exec(rawLine);
    if (listMatch && currentKey && currentList) {
      currentList.push(parseScalar(listMatch[1] ?? ''));
      continue;
    }

    const kvMatch = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(rawLine);
    if (!kvMatch) {
      continue;
    }
    const key = kvMatch[1] ?? '';
    const rawValue = (kvMatch[2] ?? '').trim();

    if (rawValue === '') {
      const list: unknown[] = [];
      data[key] = list;
      currentKey = key;
      currentList = list;
      continue;
    }

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      data[key] = parseInlineArray(rawValue);
    } else {
      data[key] = parseScalar(rawValue);
    }
    currentKey = key;
    currentList = null;
  }

  const frontMatter: FrontMatter = { raw: data };
  if (typeof data.title === 'string') frontMatter.title = data.title;
  if (typeof data.description === 'string') frontMatter.description = data.description;
  if (typeof data.date === 'string' || typeof data.date === 'number') {
    frontMatter.date = String(data.date);
  }
  if (Array.isArray(data.tags)) {
    frontMatter.tags = data.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  } else if (typeof data.tags === 'string') {
    frontMatter.tags = data.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  return { frontMatter, body };
}

export function frontMatterToMarkdown(frontMatter: FrontMatter | null | undefined): string {
  if (!frontMatter) return '';
  const lines: string[] = ['---'];
  const data = (frontMatter.raw && typeof frontMatter.raw === 'object') ? { ...frontMatter.raw } : {};
  if (frontMatter.title !== undefined) data.title = frontMatter.title;
  if (frontMatter.description !== undefined) data.description = frontMatter.description;
  if (frontMatter.date !== undefined) data.date = frontMatter.date;
  if (frontMatter.tags !== undefined) data.tags = frontMatter.tags;

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => JSON.stringify(v)).join(', ')}]`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (value === null || value === undefined) {
      lines.push(`${key}: null`);
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}
