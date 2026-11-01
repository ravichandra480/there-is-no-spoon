import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/testing/a11y',
  resolve: { tsconfigPaths: true },
  test: {
    watch: false,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/testing/a11y',
      provider: 'istanbul' as const,
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'testing-a11y:unit',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/**/*.browser.spec.ts', 'src/**/*.pw.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'testing-a11y:browser',
          include: ['src/**/*.browser.spec.ts'],
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
          name: 'testing-a11y:playwright',
          environment: 'node',
          include: ['src/**/*.pw.spec.ts'],
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
}));
