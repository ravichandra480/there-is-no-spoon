/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { playwright } from '@vitest/browser-playwright';
import * as path from 'path';

const tokensScss = path.join(
  import.meta.dirname,
  '../tokens/src/scss/index.scss',
);

/** Public entry points. Each component is importable on its own: `@tins/ui-components/button`. */
const entries = {
  index: 'src/index.ts',
  button: 'src/button/index.ts',
  'file-table': 'src/file-table/index.ts',
};

export default defineConfig(({ command, mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/ui/components',
  // This lib has its own package.json, so Vite would treat it as the fs root and refuse to serve
  // files from the workspace node_modules (e.g. the coverage runtime) in browser tests.
  server: { fs: { allow: [path.join(import.meta.dirname, '../../..')] } },
  resolve: {
    tsconfigPaths: true,
    // SCSS `@use '@tins/ui-tokens/scss'` resolves to the tokens source in the monorepo.
    alias: [{ find: /^@tins\/ui-tokens\/scss$/, replacement: tokensScss }],
  },
  // Packaging plugins only run for library builds, never in the test/dev server.
  plugins:
    command !== 'build' || mode === 'test'
      ? []
      : [
          import('vite-plugin-static-copy').then(({ viteStaticCopy }) =>
            viteStaticCopy({
              targets: [
                { src: '*.md', dest: '.' },
                { src: 'package.json', dest: '.', overwrite: false },
                { src: 'custom-elements.json', dest: '.' },
              ],
              silent: true,
            }),
          ),
          dts({
            entryRoot: 'src',
            // Test-only helpers are not part of the published API.
            exclude: ['src/**/*.spec.ts', 'src/testing/**'],
            tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
            pathsToAliases: false,
          }),
        ],
  build: {
    outDir: '../../../dist/libs/ui/components',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: entries,
      formats: ['es' as const],
      fileName: (_format: string, name: string) => `${name}.js`,
    },
    rolldownOptions: {
      // Consumers dedupe Lit and tokens.
      external: [/^lit($|\/)/, /^@lit\//, /^@tins\/ui-tokens/],
    },
  },
  test: {
    watch: false,
    reporters: ['default'],
    coverage: {
      enabled: false,
      reportsDirectory: '../../../coverage/libs/ui/components',
      provider: 'istanbul' as const,
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.d.ts', 'src/testing/**'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
    projects: [
      {
        extends: true,
        // Absolute path of the built bundle, for the plain-HTML smoke test (test target depends on build).
        define: {
          __TINS_DIST__: JSON.stringify(
            path.join(import.meta.dirname, '../../../dist/libs/ui/components'),
          ),
        },
        test: {
          name: 'ui-components:browser',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/**/*.node.spec.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' as const }],
            screenshotFailures: false,
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'ui-components:node',
          environment: 'node',
          include: ['src/**/*.node.spec.ts'],
        },
      },
    ],
  },
}));
