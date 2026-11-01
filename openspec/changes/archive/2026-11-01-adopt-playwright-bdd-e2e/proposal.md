# Proposal

## Why

The demo's end-to-end suite (`apps/demo-e2e`) is plain Playwright TypeScript. Its behaviour (keyboard
flows, accessibility scans per route and theme, layout checks) can only be read by people who read
code. Writing it as Gherkin features with [playwright-bdd](https://github.com/vitalets/playwright-bdd)
lets designers, accessibility reviewers and product owners read, review and propose scenarios in
plain language. The suite still runs on the Playwright runner, so browsers, fixtures, reports and
the existing `@tins/testing-a11y` helpers keep working. The suite is small now (5 spec files), so
migrating all of it is cheap and leaves one consistent style.

## What Changes

- Add `playwright-bdd` to the workspace and configure `apps/demo-e2e` to generate Playwright tests
  from `.feature` files (`defineBddConfig`), with step definitions in TypeScript.
- **BREAKING (test authoring):** migrate every existing e2e spec to Gherkin and remove the `*.spec.ts`
  files. Converted: smoke, accessibility scans (route × theme and interactive states), route
  coverage, keyboard-only flows, and presentation checks (reflow, text spacing, zoom, reduced
  motion, forced colors). Coverage and assertions stay the same.
- Browser-specific scenarios are tagged (for example `@chromium-only`). Playwright projects pick
  scenarios by tag, so test bodies no longer call `test.skip` on browser name.
- Generation runs before the tests: a `bddgen` step in the Nx `e2e` target. It is cached, and it
  fails when a step has no definition or a definition is ambiguous.
- The route-coverage check also fails when a manifest route is missing from the accessibility
  feature's Examples.
- Step files are linted like the rest of the e2e code. A lint rule flags any code-only `*.spec.ts`
  file left in the project, because the generated config would never run it.
- Docs (`docs/accessibility.md`, `docs/architecture.md`, README) describe how to add a feature and
  steps.

## Capabilities

### New Capabilities
- `e2e-test-authoring`: How end-to-end tests are authored and executed: Gherkin feature files with
  shared step definitions, generation into Playwright tests, tag-based browser selection, failure
  on undefined steps, and the rule that every demo route's scenarios stay in sync with the route
  manifest.

### Modified Capabilities
<!-- None. The e2e coverage requirements in `demo-app` and `accessibility-compliance` (introduced by
     the in-flight change `setup-nx-monorepo-architecture`, not yet archived) are unchanged:
     the same browsers, routes, themes, keyboard and presentation checks must keep passing. -->

## Impact

- **Code:** `apps/demo-e2e` restructured into `features/*.feature` and `steps/*.ts` (plus the
  existing `support/` helpers). `playwright.config.mts` uses `defineBddConfig`; generated tests go
  to a git-ignored `.features-gen/` folder. `apps/demo-e2e/project.json` gets a `bddgen` target
  that `e2e` depends on. `eslint.config.mjs` for demo-e2e covers step files.
- **Dependencies:** `playwright-bdd` (dev, `^9.2.1`, peer `@playwright/test >=1.44`; the workspace
  has 1.64.1).
- **Nx:** The `@nx/playwright` plugin's atomized `e2e-ci--*` targets are derived from test files.
  With generated tests these may not be inferable before generation (see design). CI keeps using
  the `e2e` target.
- **CI:** `.github/workflows/ci.yml` is unchanged apart from generation running through the `e2e`
  dependency. The Playwright HTML report shows feature/scenario names.
- **Depends on:** `setup-nx-monorepo-architecture`. That change creates `apps/demo-e2e`, the route
  manifest and `@tins/testing-a11y`. Apply this change after its e2e tasks.
