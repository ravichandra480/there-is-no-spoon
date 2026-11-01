import { Route } from '@angular/router';
import { DEMO_ROUTES, type DemoPage } from './routes.manifest';

/** Every page in the manifest must have a lazily-loaded component (enforced by the Record type). */
const PAGES: Record<DemoPage, Route['loadComponent']> = {
  'file-table': () =>
    import('./pages/file-table.page').then((m) => m.FileTablePage),
};

/** The first page in the manifest is the landing page. */
const LANDING = DEMO_ROUTES[0].path;

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: LANDING },
  ...DEMO_ROUTES.map(
    (r): Route => ({
      path: r.path,
      title: r.title,
      pathMatch: 'full',
      loadComponent: PAGES[r.page],
    }),
  ),
  { path: '**', redirectTo: LANDING },
];
