import { describe, expect, it } from 'vitest';
import { formatFileLabel } from '../src/core/string-utils';

describe('formatFileLabel', () => {
  it('formats camelCase and snake_case names', () => {
    expect(formatFileLabel('gettingStarted.md')).toBe('Getting Started');
    expect(formatFileLabel('getting_started.md')).toBe('Getting Started');
  });
});
