import { describe, expect, it } from 'vitest';
import { analyzeMarkdown, renderMarkdown } from '../src/core/markdown';

describe('analyzeMarkdown', () => {
  it('prefers the highest-level heading for the page label and extracts headings', () => {
    const analysis = analyzeMarkdown([
      '## Secondary heading',
      '',
      '# Main title',
      '',
      'Some intro text.',
      '',
      '### Details',
    ].join('\n'));

    expect(analysis.firstTitle).toBe('Main title');
    expect(analysis.headings).toEqual([
      { id: 'secondary-heading', depth: 2, text: 'Secondary heading' },
      { id: 'main-title', depth: 1, text: 'Main title' },
      { id: 'details', depth: 3, text: 'Details' },
    ]);
    expect(analysis.plainText).toContain('Some intro text.');
  });

  it('converts relative markdown links into internal document targets', () => {
    const rendered = renderMarkdown('[Read more](guides/setup.md#install)', {
      currentAbsolutePath: '/workspace/docs/index.md',
      docsRoot: '/workspace/docs',
      resolveDocumentHref: (absolutePath) => absolutePath.replace('/workspace/docs/', ''),
      resolveAssetHref: (absolutePath) => `asset://${absolutePath}`,
      pathExists: () => true,
    });

    expect(rendered.html).toContain('href="#"');
    expect(rendered.html).toContain('data-doc-path="guides/setup.md"');
    expect(rendered.html).toContain('data-doc-anchor="install"');
    expect(rendered.warnings).toHaveLength(0);
  });

  it('resolves local images through the asset resolver', () => {
    const rendered = renderMarkdown('![Schema](./images/diagram.png)', {
      currentAbsolutePath: '/workspace/docs/index.md',
      docsRoot: '/workspace/docs',
      resolveDocumentHref: (absolutePath) => absolutePath.replace('/workspace/docs/', ''),
      resolveAssetHref: (absolutePath) => `asset://${absolutePath}`,
      pathExists: () => true,
    });

    expect(rendered.html).toContain('src="asset:///workspace/docs/images/diagram.png"');
    expect(rendered.html).toContain('loading="lazy"');
    expect(rendered.warnings).toHaveLength(0);
  });

  it('adds warnings for blocked and missing relative assets', () => {
    const rendered = renderMarkdown(
      [
        '[Outside](../../README.md)',
        '![Missing](./missing.png)',
        '[Missing doc](./missing.md)',
      ].join('\n\n'),
      {
        currentAbsolutePath: '/workspace/docs/reference/page.md',
        docsRoot: '/workspace/docs',
        resolveDocumentHref: (absolutePath) => absolutePath.replace('/workspace/docs/', ''),
        resolveAssetHref: (absolutePath) => `asset://${absolutePath}`,
        pathExists: () => false,
      },
    );

    expect(rendered.html).toContain('doc-invalid-link');
    expect(rendered.html).toContain('doc-asset-warning');
    expect(rendered.warnings).toEqual([
      'Blocked relative link outside /docs: ../../README.md',
      'Missing image asset: ./missing.png',
      'Missing relative document: ./missing.md',
    ]);
  });
});

describe('mermaid diagram support', () => {
  const ctx = {
    currentAbsolutePath: '/workspace/docs/index.md',
    docsRoot: '/workspace/docs',
    resolveDocumentHref: (absolutePath: string) => absolutePath.replace('/workspace/docs/', ''),
    resolveAssetHref: (absolutePath: string) => `asset://${absolutePath}`,
    pathExists: () => true,
  };

  it('renders mermaid code block as mermaid-block div', () => {
    const md = '```mermaid\ngraph LR\n  A --> B\n```';
    const rendered = renderMarkdown(md, ctx);

    expect(rendered.html).toContain('class="mermaid-block"');
    expect(rendered.html).toContain('data-mermaid-source="');
    expect(rendered.html).toContain('<pre class="mermaid">');
    expect(rendered.html).toContain('graph LR');
    expect(rendered.html).not.toContain('<code class="language-mermaid"');
  });

  it('renders non-mermaid code blocks normally', () => {
    const md = '```javascript\nconsole.log("hello");\n```';
    const rendered = renderMarkdown(md, ctx);

    expect(rendered.html).toContain('class="code-block"');
    expect(rendered.html).toContain('data-lang="javascript"');
    expect(rendered.html).toContain('class="hljs language-javascript"');
    expect(rendered.html).toContain('class="code-copy-btn"');
    expect(rendered.html).not.toContain('mermaid-block');
  });

  it('escapes special characters in mermaid content', () => {
    const md = '```mermaid\nA -->|"yes"| B\n```';
    const rendered = renderMarkdown(md, ctx);

    expect(rendered.html).toContain('data-mermaid-source="');
    expect(rendered.html).toContain('class="mermaid-block"');
    // The double quotes inside the attribute must be escaped as &quot;
    const match = rendered.html.match(/data-mermaid-source="([^"]*)"/);
    expect(match).not.toBeNull();
    expect(match![1]).toContain('&quot;');
    expect(match![1]).toContain('A --&gt;|&quot;yes&quot;| B');
  });
});

describe('GFM extensions', () => {
  const ctx = {
    currentAbsolutePath: '/workspace/docs/index.md',
    docsRoot: '/workspace/docs',
    resolveDocumentHref: (absolutePath: string) => absolutePath.replace('/workspace/docs/', ''),
    resolveAssetHref: (absolutePath: string) => `asset://${absolutePath}`,
    pathExists: () => true,
  };

  it('renders task lists with checkboxes', () => {
    const md = ['- [ ] todo', '- [x] done', '- normal item'].join('\n');
    const rendered = renderMarkdown(md, ctx);

    expect(rendered.html).toContain('class="task-list-item"');
    expect(rendered.html).toContain('<input type="checkbox" class="task-list-checkbox"');
    expect(rendered.html).toContain('checked');
    expect(rendered.html).toContain('todo');
    expect(rendered.html).toContain('done');
    expect(rendered.html).not.toContain('[ ]');
    expect(rendered.html).not.toContain('[x]');
  });

  it('wraps tables in a horizontal-scroll container', () => {
    const md = ['| h1 | h2 |', '| --- | --- |', '| a | b |'].join('\n');
    const rendered = renderMarkdown(md, ctx);

    expect(rendered.html).toContain('<div class="doc-table-wrap"><table>');
    expect(rendered.html).toContain('</table></div>');
    expect(rendered.html).toContain('<th>h1</th>');
  });

  it('strikethrough renders as <s>', () => {
    const rendered = renderMarkdown('Hello ~~world~~', ctx);
    expect(rendered.html).toContain('<s>world</s>');
  });

  it('applies highlight.js tokens for known languages', () => {
    const rendered = renderMarkdown('```js\nconst x = 1;\n```', ctx);
    expect(rendered.html).toContain('hljs-keyword');
  });

  it('falls back to plain text for unknown languages without crashing', () => {
    const rendered = renderMarkdown('```nonsense\nhello world\n```', ctx);
    expect(rendered.html).toContain('class="code-block"');
    expect(rendered.html).toContain('hello world');
  });
});

