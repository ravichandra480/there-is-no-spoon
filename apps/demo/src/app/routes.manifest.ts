import manifest from './routes.manifest.json';

/**
 * Single source of truth for demo routes. The router (app.routes.ts), the page titles and the e2e
 * suite (route × theme accessibility scans, route-coverage check) are all driven by
 * `routes.manifest.json`, so a new page cannot ship without e2e coverage.
 */
export type DemoPage = 'file-table';

export interface DemoRoute {
  /** Router path, without a leading slash. The first route is the landing page ('/' redirects to it). */
  path: string;
  page: DemoPage;
  /** Page title (also the `h1`); the document title is "<title> · tins components demo". */
  title: string;
  /** Link text in the main navigation. Describes the destination on its own (WCAG 2.4.9). */
  navLabel: string;
  /** Custom element showcased on the page, if any. */
  element?: string;
}

export const DEMO_ROUTES = manifest as readonly DemoRoute[];
