# Design

## Context

- `apps/demo-e2e` currently holds 5 plain Playwright files in `src/`: `smoke`, `a11y`,
  `route-coverage`, `keyboard`, `presentation`. Shared helpers live in `src/support/`:
  - `routes.ts`: reads `apps/demo/src/app/routes.manifest.json` from disk
  - `page.ts`: `openPage`, `tabTo`, `pressTab` (Alt+Tab in WebKit), `focused`, `expectFocusVisible`
  - `scan-targets.ts`
- Locally the suite passes in Chromium and WebKit: 85 passed, 15 skipped by design.
- The current files skip by browser in test bodies (`test.skip(browserName !== 'chromium' …)`). They
  generate route × theme tests in loops over the manifest.
- `playwright.config.mts` uses `nxE2EPreset`, three browser projects, a `webServer` that runs Vite
  directly (dev locally, `vite preview` in CI), and HTML + list/dot reporters under
  `dist/.playwright/apps/demo-e2e`. The `e2e` target `dependsOn: ["^build"]`.
- Nx infers `e2e` (and atomized `e2e-ci--<file>` targets) from `playwright.config.mts` via the
  `@nx/playwright/plugin`. CI runs `nx affected -t … e2e`.
- `playwright-bdd@9.2.1` peers `@playwright/test >=1.44`; the workspace has 1.64.1.
- Module boundaries: `type:e2e` may import only `type:util` (`@tins/testing-a11y`). It reads the
  route manifest from disk, not via import. That stays.

## Goals / Non-Goals

**Goals:**
- One authoring style: every e2e test is a scenario in `features/*.feature`.
- Test count, browsers, themes and failure conditions are the same as today (spec: "Coverage
  preserved through migration").
- Generation is part of the `e2e` target. Missing or ambiguous steps fail before any browser
  starts.

**Non-Goals:**
- Gherkin formatter or Gherkin linter (bddgen already rejects invalid Gherkin; revisit if features grow).
- BDD for unit/component tests (Vitest stays as is).
- Cucumber reporters, living-documentation sites, or Cucumber JSON output (the Playwright HTML
  report already shows feature and scenario names).
- Fixing local Firefox launch (an environment issue tracked in the previous change).

## Decisions

### D1. playwright-bdd on the Playwright runner, not Cucumber.js
`defineBddConfig({ features, steps })` generates ordinary Playwright test files. Those keep:
- the Playwright runner, projects and retries
- `webServer`, the HTML report and `testInfo.attach`
- fixtures and the `@tins/testing-a11y/playwright` helpers

*Alternative:* `@cucumber/cucumber` with Playwright as a library. Rejected. We would have to rebuild
browser projects, parallelism, `webServer` and reporting, and the Nx `@nx/playwright` integration
would be lost.

### D2. Project layout
```
apps/demo-e2e/
  features/            *.feature (smoke, accessibility, route-coverage, keyboard, presentation)
  steps/               fixtures.ts (createBdd + custom fixtures), *.steps.ts grouped by domain
  src/support/         existing helpers (routes.ts, page.ts, scan-targets.ts) — unchanged API
  .features-gen/       generated tests (git-ignored, prettier/eslint-ignored)
```
`playwright.config.mts`: `testDir = defineBddConfig({ features: 'features/**/*.feature', steps:
['steps/**/*.ts'], outputDir: '.features-gen', missingSteps: 'fail-on-gen' })`. Everything else in
the config stays the same.

### D3. Fixtures and step style
`steps/fixtures.ts` extends playwright-bdd's `test` with small fixtures:
- `demo`: wraps `openPage`, `tabTo`, `pressTab`, `focused`, `expectFocusVisible`
- `world`: per-scenario state, such as the last focus path

It exports `Given/When/Then` from `createBdd(test)`. Step text describes behaviour. Selectors stay
inside step code:
- `Given the user opens the {string} page`
- `When the user presses Tab until {string} is focused`
- `Then the page has no accessibility violations`

Parameters use Cucumber expressions. Step files are grouped by domain: `navigation`, `keyboard`,
`accessibility`, `layout`, `components`.

### D4. Route × theme as Scenario Outlines, kept in sync by a coverage scenario
Gherkin Examples are static, but the current suite loops over the manifest. The suite therefore
uses explicit Examples tables:
- `@per-route` outlines list `| path | title |`
- accessibility outlines list `| path | theme |`

Two outlines split by browser scope:
- light theme, untagged, runs in all browsers
- dark and high-contrast, tagged `@chromium-only`

The route-coverage feature parses the feature files with `@cucumber/gherkin`, a playwright-bdd
dependency. It collects every `path` cell from `@per-route` outlines and compares the set with the
manifest in both directions: missing routes and stale examples. Each mismatch is named. The
link-crawl scenario stays.

*Alternative:* one step that loops over all routes ("Then every route passes in the dark theme").
Rejected. It collapses many tests into one, so a failure no longer names its own route and theme in
the report.

*Alternative:* generating feature files from the manifest. Rejected. It is harder to review and
defeats the point of human-readable features.

### D5. Browser selection by tags, in config
- `@chromium-only` (forced-colors emulation, non-light theme scans, route coverage) is excluded from
  Firefox and WebKit with `grepInvert: /@chromium-only/` on those projects.
- No `test.skip` on browser name inside steps.
- playwright-bdd maps Gherkin tags to Playwright test tags, so `--grep @chromium-only` also works
  from the CLI.

### D6. Nx wiring
- `bddgen` target in `apps/demo-e2e/project.json`:
  - `nx:run-commands`, `npx bddgen -c playwright.config.mts`, `cwd: {projectRoot}`
  - `cache: true`
  - inputs: `features/**`, `steps/**`, `src/support/**`, `playwright.config.mts`, and the manifest
    file
  - outputs: `{projectRoot}/.features-gen`
- `e2e.dependsOn: ["^build", "bddgen"]`.
- The `@nx/playwright` plugin infers atomized `e2e-ci--*` targets by scanning `testDir`. It only
  finds files after generation. CI keeps using `e2e`, so the `e2e-ci` targets are left as inferred.
  They are documented as unsupported for this project.

*Alternative:* run `bddgen` inside the `e2e` command (`bddgen && playwright test`). Rejected. That
loses caching of generation and replaces the inferred target.

### D7. Guard against code-only tests
`apps/demo-e2e/eslint.config.mjs` adds a `no-restricted-syntax` rule on `Program` for
`src/**/*.spec.ts` and `steps/**/*.spec.ts`. Its message: "E2E tests are written as features in
features/*.feature".

The generated `.features-gen/` folder is ignored by ESLint, Prettier and git.

### D8. Attachments and report names
- Steps receive `$testInfo` from playwright-bdd and pass it to `scanPage`, which keeps the
  `axe:<path>:<theme>` attachments.
- Generated test titles are scenario names, and Examples rows add their values. The HTML report
  shows `Feature › Scenario (path, theme)`.

## Risks / Trade-offs

- [Static Examples drift from the manifest] → D4 coverage scenario fails in both directions and names the route.
- [Atomized `e2e-ci` targets unavailable before generation] → CI uses `e2e`; documented. Revisit if Nx Cloud task distribution is adopted.
- [Step library sprawl / near-duplicate step texts] → Domain-grouped step files; `missingSteps: 'fail-on-gen'` and playwright-bdd's ambiguous-step error; review checklist item.
- [More indirection when debugging] → Step code stays thin over existing `support/` helpers; generated files are readable and source-mapped in the HTML report.
- [playwright-bdd lagging Playwright releases] → Peer range `>=1.44`; the `verify` target already pins `@nx/*`. Bump `playwright-bdd` together with `@playwright/test`.

## Migration Plan

1. Add dependency, config, fixtures and the `bddgen` target. Convert `smoke` first, keeping the old
   files, and run both to compare test counts.
2. Convert the rest one file at a time, in this order: accessibility, route coverage, keyboard,
   presentation. After each, check the same failure conditions as the original:
   - a temporary heading-order violation
   - an unscanned route
   - the old forced-colors CSS
3. Delete the old `src/*.spec.ts`, enable the D7 lint guard, and update the docs.

Rollback: revert the change's commits. The old spec files return, and nothing outside
`apps/demo-e2e`, the root `package.json`, and the docs is touched.
