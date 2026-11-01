# demo-e2e

End-to-end tests for the demo app, written as Gherkin scenarios and run by Playwright through
[playwright-bdd](https://github.com/vitalets/playwright-bdd). Every test is a scenario in
`features/*.feature`. A code-only `*.spec.ts` would never run, and lint rejects it.

```
features/         *.feature: smoke, accessibility, route-coverage, keyboard, presentation, file-table
steps/            fixtures.ts (Given/When/Then + fixtures), *.steps.ts by domain
src/support/      helpers used by steps (page.ts, routes.ts, per-route-examples.ts)
.features-gen/    generated Playwright tests (git-ignored; do not edit)
```

## Running

```sh
npx nx e2e demo-e2e                         # generates (bddgen) and runs all browsers
npx nx run demo-e2e:bddgen                  # only generate; fails on undefined or ambiguous steps
```

To run one scenario or one browser, generate first and then call Playwright from this folder:

```sh
cd apps/demo-e2e
npx bddgen -c playwright.config.mts
npx playwright test --project=chromium -g "Select all chooses"
npx playwright test --grep @per-route       # by tag
```

## Adding a scenario

1. Write the scenario in the feature file for its area (or a new `features/<area>.feature`). Use
   plain-language steps that describe what the user does and sees, not selectors.
2. Reuse existing steps where you can. The step texts are in `steps/*.steps.ts`, grouped by domain:
   `navigation`, `keyboard`, `file-table`, `accessibility`, `layout`, `route-coverage`.
3. Run `npx nx run demo-e2e:bddgen`. A step with no definition fails and prints a snippet to paste
   into the right `steps/*.steps.ts`. Import `Given`, `When` and `Then` from `./fixtures`.
4. Keep step code thin: use the `demo` fixture (`open`, `tabTo`, `pressTab`, `focused`,
   `expectFocusVisible`) and the `@tins/testing-a11y/playwright` helpers. Keep state shared between
   steps in the `world` fixture. Pass `$testInfo` to `scanPage` so the report gets its attachment.

A step text must match exactly one definition. Two matching definitions fail generation.

## Tags

| Tag               | Effect                                                                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@chromium-only`  | Not run in WebKit (`grepInvert` in `playwright.config.mts`). For forced-colors emulation, non-light theme scans and browser-independent checks. Can be set on a feature, rule, scenario or `Examples` block.           |
| `@per-route`      | The Scenario Outline must list every route in `apps/demo/src/app/routes.manifest.json` in a `path` column, and no other paths (one set per theme when there is a `theme` column). Checked by `route-coverage.feature`. |
| `@reduced-motion` | The scenario's browser context prefers reduced motion (fixture in `steps/fixtures.ts`).                                                                                                                                |

## Adding a demo page

Add the route to `routes.manifest.json`, then add a row to every `@per-route` Examples table (the
accessibility scans need one row per theme). Until then, the route-coverage scenario fails and names
the missing route and outline.
