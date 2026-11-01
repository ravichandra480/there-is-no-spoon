import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { defineBddConfig } from 'playwright-bdd';

const isCI = !!process.env['CI'];
// Locally: Vite dev server. In CI: `vite preview` of the production build (preview depends on build).
const port = isCI ? 4300 : 4200;
const baseURL = process.env['BASE_URL'] ?? `http://localhost:${port}`;
const outputRoot = `${workspaceRoot}/dist/.playwright/apps/demo-e2e`;

// Tests are written as Gherkin features; `bddgen` (the `bddgen` target) generates Playwright tests
// into .features-gen, which is the test directory Playwright runs.
const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/**/*.ts'],
  outputDir: '.features-gen',
  missingSteps: 'fail-on-gen',
});

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir }),
  outputDir: `${outputRoot}/test-results`,
  reporter: [
    [isCI ? 'dot' : 'list'],
    [
      'html',
      { outputFolder: `${outputRoot}/playwright-report`, open: 'never' },
    ],
  ],
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env['BASE_URL']
    ? undefined
    : {
        // Vite is started directly (not via a nested `nx run`, which blocks inside `nx e2e`).
        // The e2e target depends on `demo:build`, so `vite preview` serves a fresh production build.
        command: isCI
          ? `npx vite preview --port ${port} --strictPort`
          : `npx vite --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !isCI,
        cwd: `${workspaceRoot}/apps/demo`,
        timeout: 180_000,
      },
  // Scenarios tagged @chromium-only (forced-colors emulation, non-light theme scans, route
  // coverage) are excluded from WebKit here, not skipped inside steps.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grepInvert: /@chromium-only/,
    },
  ],
});
