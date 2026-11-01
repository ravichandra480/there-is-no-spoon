/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { tokensPlugin } from './build/tokens-plugin.mjs';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/ui/tokens',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    import('vite-plugin-static-copy').then(({ viteStaticCopy }) =>
      viteStaticCopy({
        targets: [
          { src: '*.md', dest: '.' },
          { src: 'package.json', dest: '.', overwrite: false },
        ],
        silent: true,
      }),
    ),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
    tokensPlugin(),
  ],
  build: {
    outDir: '../../../dist/libs/ui/tokens',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'ui-tokens',
      fileName: 'index',
      formats: ['es' as const],
    },
  },
  test: {
    name: 'ui-tokens',
    watch: false,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/ui/tokens',
      provider: 'istanbul' as const,
    },
  },
}));
