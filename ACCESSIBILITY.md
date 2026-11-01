# Accessibility

## Target

Every component and every demo page targets **WCAG 2.2 Levels A, AA and AAA**. A criterion that
does not apply is recorded as not applicable, with the reason, in the component's `A11Y.md`.

Automated checks catch a lot, but not everything. Passing CI is **not** a claim of AAA conformance.
That needs the manual review described below as well.

## Three test layers

| Layer                         | When it runs                                                                      | What it checks                                                                                                                                                                                                                | Command                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1. Lint (static)              | `nx lint`                                                                         | `eslint-plugin-lit-a11y` on component templates, `@angular-eslint/template` accessibility rules on demo templates (e.g. `<img>` without `alt` fails)                                                                          | `npx nx run-many -t lint`                                                |
| 2. Unit (per component state) | `nx test`, Vitest in headless Chromium                                            | axe-core with the AAA rule set on **every documented state** of every component, plus target size and focus appearance; design-token contrast for every theme; demo shell and pages in every theme                            | `npx nx test ui-components`, `npx nx test ui-tokens`, `npx nx test demo` |
| 3. End-to-end (per page)      | `nx e2e`, Playwright (Gherkin features via playwright-bdd) in Chromium and WebKit | axe on **every route × every theme** (all themes in Chromium, light theme in WebKit); keyboard-only flows; focus visibility; reflow at 320px; text spacing; 200% zoom and text size; reduced motion; forced colors (Chromium) | `npx nx e2e demo-e2e`                                                    |

All three layers use the same rule set from `@tins/testing-a11y` (`libs/testing/a11y`):

- axe-core tags `wcag2a`, `wcag2aa`, `wcag2aaa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`
- plus rules axe turns off by default: `color-contrast-enhanced` (1.4.6),
  `identical-links-same-purpose` (2.4.9), `meta-refresh-no-exceptions`, `target-size`.

Failures name the rule, the element and the WCAG criterion. The e2e suite attaches the full axe
result (`axe:<path>:<theme>`) to each scenario in the Playwright HTML report. In CI, the report is uploaded as the
`playwright-report` artifact.

### Where each layer lives

| What                             | File                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Shared rule set and helpers      | `libs/testing/a11y/src/lib/config.ts`, `libs/testing/a11y/src/vitest.ts`, `libs/testing/a11y/src/playwright.ts` |
| Component tests                  | `libs/ui/components/src/button/button.spec.ts`, `libs/ui/components/src/file-table/file-table.spec.ts`          |
| Token contrast test              | `libs/ui/tokens/src/lib/contrast.spec.ts`                                                                       |
| Demo unit tests                  | `apps/demo/src/app/app.spec.ts`, `apps/demo/src/app/pages/pages.spec.ts`                                        |
| E2E scans and route coverage     | `apps/demo-e2e/features/accessibility.feature`, `apps/demo-e2e/features/route-coverage.feature`                 |
| E2E keyboard and presentation    | `apps/demo-e2e/features/keyboard.feature`, `apps/demo-e2e/features/presentation.feature`                        |
| E2E step definitions             | `apps/demo-e2e/steps/*.steps.ts` (see `apps/demo-e2e/README.md`)                                                |
| Route list driving the e2e suite | `apps/demo/src/app/routes.manifest.json`                                                                        |

A new demo page goes into `routes.manifest.json`, which the router and the navigation read. The
e2e features list routes in explicit Examples tables (`@per-route` Scenario Outlines), so the page
also needs a row in each of them. `route-coverage.feature` fails and names the route when a manifest
route is missing from any `@per-route` outline (per theme for the accessibility scans), when an
outline lists a path that is not in the manifest, or when a page reachable by a link has no
accessibility scan.

## Custom checks (beyond axe)

axe-core automates only a few AAA criteria. These checks fill gaps that can still be measured:

| Check                                                                                 | WCAG                         | Helper / test                                                                                      |
| ------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Pointer targets at least 44×44 CSS px                                                 | 2.5.5                        | `assertTargetSize(el)`                                                                             |
| Focus indicator present, ≥ 2px, ≥ 3:1, not hidden by other content                    | 2.4.7, 2.4.11–2.4.13, 1.4.11 | `assertFocusVisible(el)`; `expectFocusVisible(page)` in e2e                                        |
| Every token text pair ≥ 7:1 (≥ 4.5:1 large), UI and focus pairs ≥ 3:1, in every theme | 1.4.6, 1.4.11                | `libs/ui/tokens/src/lib/contrast.spec.ts`                                                          |
| No horizontal scrolling or clipped text at 320px                                      | 1.4.10                       | `assertNoReflowOverflow(page, 320)`                                                                |
| Text spacing override (line height 1.5, spacing 0.12/0.16/2em) keeps content intact   | 1.4.12                       | `assertTextSpacingSafe(page)`                                                                      |
| 200% zoom and 200% text size keep content intact                                      | 1.4.4                        | `apps/demo-e2e/features/presentation.feature`                                                      |
| No animations or transitions with `prefers-reduced-motion: reduce`                    | 2.3.3                        | `apps/demo-e2e/features/presentation.feature`                                                      |
| Boundaries, focus and pressed state visible in forced colors                          | 1.4.11                       | `apps/demo-e2e/features/presentation.feature` (Chromium only; WebKit cannot emulate forced colors) |

## Exclusion policy

Never switch an axe rule off globally. To exclude one rule for specific nodes, use `excludeRule`:

```ts
import { excludeRule } from '@tins/testing-a11y';

const exclusions = [
  excludeRule({
    rule: 'color-contrast-enhanced',
    selector: 'tins-chart .axis-label',
    reason:
      'Decorative axis tick labels; the values are repeated in the data table.',
    issue: 'https://github.com/example/repo/issues/42',
  }),
];
await expectNoA11yViolations(el, { exclusions });
```

- `rule` and a specific `selector` are required (`*` is rejected).
- `reason` must explain why, in at least 15 characters.
- `issue` must be a tracking reference (`#123`, `ABC-123` or an https URL).
- Lint blocks every other route: `disableRules` and `{ enabled: false }` in axe options fail with
  `no-restricted-properties` / `no-restricted-syntax`.

Exclusions are temporary. Remove one when its issue is fixed.

## Manual review

Some criteria need a person, so each component has a review record next to its source:
`libs/ui/components/src/<component>/A11Y.md`. It records:

- **Screen reader testing** with at least two pairings: **NVDA + Firefox** (Windows) and
  **VoiceOver + Safari** (macOS). Use the demo page for the component. Record what is announced
  for its name, role, states and errors.
- **2.4.9 Link purpose**, **2.4.10 Section headings**, **3.1.3 Unusual words**, **3.1.5 Reading
  level**, **3.1.6 Pronunciation**: an assessment for each.
- **Forced colors**: confirmed in Windows High Contrast.
- **Not-applicable criteria** (for example 1.2.x time-based media), each with a reason.

Rules:

1. A pull request that changes a component's source must update that component's `A11Y.md`.
   CI enforces this with `node tools/scripts/check-a11y-review.mjs` (changes to `*.spec.ts` files
   alone do not count as source changes).
2. A new component ships with an `A11Y.md`. The same check fails if the file is missing.
3. Reviewers go through the accessibility checklist in `.github/pull_request_template.md`.
4. A record marked **Pending** is a known gap. It must be listed under "Known accessibility gaps"
   in `README.md` until the review is done.

Run the check locally against `main`:

```sh
node tools/scripts/check-a11y-review.mjs
```

## Running everything

```sh
npm run verify                                   # Nx versions + module boundaries
npx nx run-many -t lint test build               # layers 1 and 2
npx nx e2e demo-e2e                              # layer 3 (starts the demo dev server)
```
