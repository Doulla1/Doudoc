import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      vscode: fileURLToPath(new URL('./test/stubs/vscode.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
  },
});
