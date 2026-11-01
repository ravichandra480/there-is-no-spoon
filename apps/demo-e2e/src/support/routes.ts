import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';

/**
 * The demo's route manifest, read from disk (an e2e project may not import app code; design D10).
 * The route-coverage feature checks every `@per-route` Examples table against it.
 */
export interface DemoRoute {
  path: string;
  page: string;
  title: string;
  navLabel: string;
  element?: string;
}

export const MANIFEST_FILE = join(
  workspaceRoot,
  'apps/demo/src/app/routes.manifest.json',
);
export const DEMO_ROUTES: readonly DemoRoute[] = JSON.parse(
  readFileSync(MANIFEST_FILE, 'utf8'),
);

export const urlOf = (route: DemoRoute) => `/${route.path}`;

/** Shipped themes. The theme-menu scenario in accessibility.feature fails if the app's theme menu differs from this list. */
export const THEMES = ['light', 'dark', 'high-contrast'] as const;
export type Theme = (typeof THEMES)[number];

export const SITE_NAME = 'tins components demo';
export const THEME_STORAGE_KEY = 'tins-demo-theme';
