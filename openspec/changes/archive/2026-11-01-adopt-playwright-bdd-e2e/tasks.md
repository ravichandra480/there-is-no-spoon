# Tasks

## 1. Setup and wiring

- [x] 1.1 Install `playwright-bdd@^9.2.1` as a root devDependency with npm. Verify that `npm ls playwright-bdd @playwright/test` reports no peer-dependency errors and `npx bddgen --version` runs.
- [x] 1.2 Switch `apps/demo-e2e/playwright.config.mts` to `defineBddConfig`, with:
  - `features/**/*.feature`
  - `steps/**/*.ts`
  - `outputDir: .features-gen`
  - `missingSteps: 'fail-on-gen'`

  Keep `webServer`, reporters and projects unchanged. Add `.features-gen` to `.gitignore`, `.prettierignore` and the ESLint ignores. Verify that `npx nx show project demo-e2e` still lists `e2e`.
- [x] 1.3 Add `steps/fixtures.ts`: `createBdd(test)` plus the `demo` fixture wrapping `openPage`, `tabTo`, `pressTab`, `focused` and `expectFocusVisible`. Verify that `npx nx run demo-e2e:tsc:typecheck` passes.
- [x] 1.4 Add the cached `bddgen` target, with D6 inputs and outputs. Set `e2e.dependsOn: ["^build", "bddgen"]`. Verify:
  - `npx nx run demo-e2e:bddgen` generates files
  - a second run is a cache hit
  - a feature with an undefined step makes `bddgen` fail and name the step and its file
- [x] 1.5 Add `grepInvert: /@chromium-only/` to the Firefox and WebKit projects. Verify that `npx playwright test --list --project=webkit` excludes a sample `@chromium-only` scenario and `--project=chromium` includes it.

## 2. Smoke and navigation

- [x] 2.1 Write `features/smoke.feature`:
  - overview loads with its title
  - navigation reaches every component page (Scenario Outline over manifest routes, `@per-route`)
  - custom elements upgrade

  Add the step definitions in `steps/navigation.steps.ts`. Verify that the scenarios pass in Chromium and WebKit with the same test count as `src/smoke.spec.ts`, then delete `src/smoke.spec.ts`.

## 3. Accessibility scans and route coverage

- [x] 3.1 Write `features/accessibility.feature`:
  - light-theme outline over all routes (all browsers)
  - dark/high-contrast outline tagged `@chromium-only`
  - interactive-state scenarios: text-field errors shown, toggle pressed
  - theme-menu-matches-themes scenario

  Steps go in `steps/accessibility.steps.ts`, passing `$testInfo` to `scanPage` so each test keeps its `axe:<path>:<theme>` attachment. Verify:
  - scans pass
  - the HTML report shows scenario names and attachments
  - a temporary heading-order violation on `/button` fails exactly the `/button` scenarios in every theme

  Then delete `src/a11y.spec.ts`.
- [x] 3.2 Write `features/route-coverage.feature` (`@chromium-only`). Steps parse the feature files with `@cucumber/gherkin` and compare `@per-route` Examples paths with `routes.manifest.json` in both directions; the link-crawl scenario stays. Verify both ways:
  - temporarily adding a manifest route fails and names it
  - temporarily adding a stale Example path fails and names it
  - temporarily linking an unscanned page fails and names it

  Then delete `src/route-coverage.spec.ts` and `src/support/scan-targets.ts` if it is unused.

## 4. Keyboard flows

- [x] 4.1 Write `features/keyboard.feature`, covering:
  - skip link
  - navigation with focus moving to the page `h1`
  - theme menu
  - no keyboard trap
  - button Enter/Space and disabled buttons skipped
  - toggle `aria-pressed`
  - icon-only button
  - text-field typing, Enter-submit and inline errors
  - ngModel field
  - external label and read-only/disabled fields

  Steps go in `steps/keyboard.steps.ts` and `steps/components.steps.ts`, using `pressTab` (Option+Tab in WebKit) and `expectFocusVisible`. Verify that every scenario passes in Chromium and WebKit, then delete `src/keyboard.spec.ts`.

## 5. Presentation and preferences

- [x] 5.1 Write `features/presentation.feature`:
  - `@per-route` outlines for 320px reflow, text spacing (default width and 320px), 200% zoom (640px viewport), and 200% text size
  - a reduced-motion scenario (context `reducedMotion: 'reduce'` set by a tag-driven fixture, e.g. `@reduced-motion`)
  - `@chromium-only` forced-colors scenarios for button, text field and current navigation item

  Steps go in `steps/layout.steps.ts`. Verify that all pass, and that restoring the old button forced-colors CSS (unspecific `button[aria-pressed='true']`) makes the pressed-state scenario fail. Then delete `src/presentation.spec.ts`.

## 6. Guards and documentation

- [x] 6.1 Add the D7 lint guard (`no-restricted-syntax` on `Program` for `src/**/*.spec.ts` and `steps/**/*.spec.ts`) to `apps/demo-e2e/eslint.config.mjs`. Verify that a temporary `src/tmp.spec.ts` fails `npx nx lint demo-e2e` with the "write a feature" message, then remove it.
- [x] 6.2 Update the docs:
  - `docs/accessibility.md`: file table and layer 3 description now point to `features/*.feature`
  - `docs/architecture.md`: e2e layout and the `bddgen` target
  - a short `apps/demo-e2e/README.md` on adding a feature, reusing steps, tags (`@chromium-only`, `@per-route`, `@reduced-motion`) and running one scenario

  Verify that every referenced path and command exists. Reuse the path and target checks from the previous change.

## 7. Integration

- [x] 7.1 Run `npx nx run-many -t lint tsc:typecheck` and `npx nx e2e demo-e2e` (local) and `CI=1 npx nx e2e demo-e2e` (preview build) for Chromium and WebKit. Verify that everything passes, and that the test count per browser equals the pre-migration count (Chromium 50, WebKit 35 passed + 15 excluded/skipped) or the difference is explained.
- [x] 7.2 Run `openspec validate adopt-playwright-bdd-e2e --strict` and verify there are no errors or warnings.

## Workflow follow-up

- Run the suite in Firefox on CI (local Firefox launch is broken on this machine; see `setup-nx-monorepo-architecture`).
- Archive after `setup-nx-monorepo-architecture` is archived, so `demo-app` and `accessibility-compliance` exist as main specs.
