import { context } from 'esbuild';

const watch = process.argv.includes('--watch');

const ctx = await context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  logLevel: 'info',
  tsconfig: 'tsconfig.json',
});

if (watch) {
  await ctx.watch();
  console.log('[esbuild] watching...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
