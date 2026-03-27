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
        id: 'dir:guides',
        type: 'directory',
        name: 'guides',
        label: 'Guides',
        relativePath: 'guides',
        children: [
          {
            id: 'file:guides/getting-started.md',
            type: 'file',
            name: 'getting-started.md',
            label: 'Getting Started',
            relativePath: 'guides/getting-started.md',
          },
        ],
      },
    ]);
  });
});
