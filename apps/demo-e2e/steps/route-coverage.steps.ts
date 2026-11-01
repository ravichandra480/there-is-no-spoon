import { expect } from '@playwright/test';
import { perRouteGroups } from '../src/support/per-route-examples';
import { DEMO_ROUTES, MANIFEST_FILE, urlOf } from '../src/support/routes';
import { Then, When } from './fixtures';

const MANIFEST_URLS = DEMO_ROUTES.map(urlOf);

Then('every per-route scenario lists every route in the route manifest', () => {
  const groups = perRouteGroups();
  expect(groups.length, 'no @per-route outlines found').toBeGreaterThan(0);
  const missing = groups.flatMap((g) =>
    MANIFEST_URLS.filter((u) => !g.paths.has(u)).map(
      (u) => `${u} is missing from ${g.label}`,
    ),
  );
  expect(
    missing,
    `Routes in ${MANIFEST_FILE} without per-route scenarios (add them to the Examples)`,
  ).toEqual([]);
});

Then(
  'no per-route scenario lists a path that is not in the route manifest',
  () => {
    const stale = perRouteGroups().flatMap((g) =>
      [...g.paths]
        .filter((p) => !MANIFEST_URLS.includes(p))
        .map((p) => `${p} in ${g.label}`),
    );
    expect(
      stale,
      `Per-route Examples with paths that are not in ${MANIFEST_FILE}`,
    ).toEqual([]);
  },
);

When(
  'the user follows every same-site link, starting from {string}',
  async ({ demo, page, baseURL, world }, start: string) => {
    const origin = new URL(baseURL ?? page.url()).origin;
    const queue = [start];
    const seen = new Set<string>();
    while (queue.length) {
      const path = queue.shift() as string;
      if (seen.has(path)) continue;
      seen.add(path);
      await demo.open(path);
      const hrefs = await page
        .locator('a[href]')
        .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
      for (const href of hrefs) {
        const url = new URL(href);
        if (url.origin !== origin || url.hash) continue;
        if (!seen.has(url.pathname)) queue.push(url.pathname);
      }
    }
    world.visited = [...seen];
  },
);

Then('every page visited has a per-route accessibility scan', ({ world }) => {
  const scanned = new Set(
    perRouteGroups()
      .filter((g) => g.file === 'accessibility.feature')
      .flatMap((g) => [...g.paths]),
  );
  const unscanned = world.visited.filter((p) => !scanned.has(p));
  expect(
    unscanned,
    'Pages linked in the demo without an accessibility scan (add them to routes.manifest.json and the per-route Examples)',
  ).toEqual([]);
});
