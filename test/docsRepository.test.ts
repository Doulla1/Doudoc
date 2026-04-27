import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DocsRepository } from '../src/services/docsRepository';

const temporaryRoots: string[] = [];

async function createWorkspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'doudoc-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('DocsRepository.refresh', () => {
  it('excludes directories that do not contain markdown pages', async () => {
    const workspaceRoot = await createWorkspace();
    await fs.mkdir(path.join(workspaceRoot, 'docs', 'assets'), { recursive: true });
    await fs.mkdir(path.join(workspaceRoot, 'docs', 'guides'), { recursive: true });
    await fs.writeFile(path.join(workspaceRoot, 'docs', 'assets', 'diagram.png'), 'binary');
    await fs.writeFile(path.join(workspaceRoot, 'docs', 'guides', 'getting-started.md'), '# Getting Started');

    const repository = new DocsRepository(workspaceRoot);
    const snapshot = await repository.refresh();

    expect(snapshot.tree).toEqual([
      {
        id: 'dir:docs/guides',
        type: 'directory',
        name: 'guides',
        label: 'Guides',
        relativePath: 'docs/guides',
        children: [
          {
            id: 'file:docs/guides/getting-started.md',
            type: 'file',
            name: 'getting-started.md',
            label: 'Getting Started',
            relativePath: 'docs/guides/getting-started.md',
          },
        ],
      },
    ]);
  });

  it('groups multiple configured sources at the top level', async () => {
    const workspaceRoot = await createWorkspace();
    await fs.mkdir(path.join(workspaceRoot, 'docs'), { recursive: true });
    await fs.mkdir(path.join(workspaceRoot, 'api-docs'), { recursive: true });
    await fs.writeFile(path.join(workspaceRoot, 'docs', 'index.md'), '# Index');
    await fs.writeFile(path.join(workspaceRoot, 'api-docs', 'reference.md'), '# Reference');

    const repository = new DocsRepository(workspaceRoot);
    repository.setConfiguredPaths(['docs', 'api-docs']);
    const snapshot = await repository.refresh();

    expect(snapshot.sources.map((source) => source.key)).toEqual(['docs', 'api-docs']);
    expect(snapshot.tree).toHaveLength(2);
    expect(snapshot.tree[0]?.relativePath).toBe('docs');
    expect(snapshot.tree[1]?.relativePath).toBe('api-docs');
    expect(snapshot.pages.map((page) => page.relativePath).sort()).toEqual([
      'api-docs/reference.md',
      'docs/index.md',
    ]);
  });

  it('detects broken relative links and reports them as warnings', async () => {
    const workspaceRoot = await createWorkspace();
    await fs.mkdir(path.join(workspaceRoot, 'docs'), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, 'docs', 'home.md'),
      '# Home\n\nSee [missing](./missing.md) and [valid](./other.md).',
    );
    await fs.writeFile(path.join(workspaceRoot, 'docs', 'other.md'), '# Other');

    const repository = new DocsRepository(workspaceRoot);
    const snapshot = await repository.refresh();

    expect(snapshot.warnings.some((warning) => warning.includes('Broken link in docs/home.md'))).toBe(true);
    expect(snapshot.warnings.some((warning) => warning.includes('./other.md'))).toBe(false);
  });

  it('adds external markdown files as a dedicated source', async () => {
    const workspaceRoot = await createWorkspace();
    const externalDir = await createWorkspace();
    const externalFile = path.join(externalDir, 'notes.md');
    await fs.writeFile(externalFile, '# External Notes\n\nSome content here.');

    const repository = new DocsRepository(workspaceRoot);
    repository.addExternalFile(externalFile);
    const snapshot = await repository.refresh();

    expect(snapshot.pages).toHaveLength(1);
    expect(snapshot.pages[0]?.label).toBe('External Notes');
    expect(snapshot.pages[0]?.sourceKey.startsWith('__ext')).toBe(true);
  });

  it('computes word count for reading time estimation', async () => {
    const workspaceRoot = await createWorkspace();
    await fs.mkdir(path.join(workspaceRoot, 'docs'), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, 'docs', 'page.md'),
      '# Page\n\n' + 'word '.repeat(150).trim(),
    );

    const repository = new DocsRepository(workspaceRoot);
    const snapshot = await repository.refresh();

    expect(snapshot.pages[0]?.wordCount).toBeGreaterThanOrEqual(150);
  });
});
