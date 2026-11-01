/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { playwright } from '@vitest/browser-playwright';
import * as path from 'path';

const workspaceRoot = path.join(import.meta.dirname, '../..');
const tokensScss = path.join(workspaceRoot, 'libs/ui/tokens/src/scss');

/**
 * Angular demo built, served and tested through Vite with the Analog plugin (design D6).
 * Nx infers `build`, `serve`, `preview`, `serve-static` and `test` from this file.
 */
/**
 * `--mode gh-pages` (the `build-gh-pages` target) emits one self-contained `index.html` — all JS,
 * CSS and lazy routes inlined — with relative asset paths, no <base> and hash routing, so it can
 * be dropped onto GitHub Pages (or opened from disk) without server rewrites.
 */
export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  base: mode === 'gh-pages' ? './' : '/',
  cacheDir: '../../node_modules/.vite/apps/demo',
  publicDir: 'public',
  // strictPort only outside tests: Vitest's browser server inherits `server.strictPort`, and with
  // `nx affected --parallel` several projects' Vitest runs race for the default browser port
  // (63315). Without strictPort the loser falls back to the next free port instead of crashing.
  server: {
    port: 4200,
    strictPort: mode !== 'test',
    fs: { allow: [workspaceRoot] },
  },
  preview: { port: 4300, strictPort: true },
  resolve: {
    tsconfigPaths: true,
    // In the monorepo, the tokens package resolves to its SCSS source (the published package ships
    // the compiled `tokens.css` and the same `scss/` folder).
    alias: [
      {
        find: /^@tins\/ui-tokens\/tokens\.css$/,
        replacement: path.join(tokensScss, 'tokens.scss'),
      },
      {
        find: /^@tins\/ui-tokens\/scss$/,
        replacement: path.join(tokensScss, 'index.scss'),
      },
    ],
  },
  // Pre-bundle everything up front: a mid-run re-optimisation would load a second copy of
  // @angular/core in browser-mode tests (NG0203 / "firstCreatePass" errors).
  optimizeDeps: {
    include: [
      '@angular/common',
      '@angular/compiler',
      '@angular/core',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/router',
      'rxjs',
      'lit',
      'lit/directives/live.js',
      ...(mode === 'test'
        ? [
            '@angular/core/testing',
            '@angular/platform-browser/testing',
            '@analogjs/vitest-angular/setup-snapshots',
            '@analogjs/vitest-angular/setup-testbed',
            'axe-core',
          ]
        : []),
    ],
  },
  plugins: [
    angular({
      tsconfig: path.join(
        import.meta.dirname,
        mode === 'test' ? 'tsconfig.spec.json' : 'tsconfig.app.json',
      ),
      inlineStylesExtension: 'scss',
    }),
    ...(mode === 'gh-pages'
      ? [
          viteSingleFile({ removeViteModuleLoader: true }),
          {
            // Hash routing needs no <base>; keeping one makes `#/route` URLs resolve against the
            // folder instead of index.html, which `file://` rejects as cross-origin.
            name: 'demo-strip-base-href',
            transformIndexHtml: (html: string) =>
              html.replace(/\s*<base href="\/" \/>/, ''),
          },
        ]
      : []),
  ],
  build: {
    outDir:
      mode === 'gh-pages'
        ? '../../dist/apps/demo-gh-pages'
        : '../../dist/apps/demo',
    emptyOutDir: true,
    reportCompressedSize: true,
    target: ['es2022'],
  },
  test: {
    name: 'demo',
    watch: false,
    globals: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    // Real browser: axe contrast, focus and layout checks need a real rendering engine (design D7).
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' as const }],
      screenshotFailures: false,
    },
    coverage: {
      reportsDirectory: '../../coverage/apps/demo',
      provider: 'istanbul' as const,
    },
  },
}));
