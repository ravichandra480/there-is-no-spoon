# Tasks

## 1. Workspace foundation

- [x] 1.1 Install `@nx/js`, `@nx/vite`, `@nx/angular`, `@nx/playwright`, `@nx/eslint`, `@nx/eslint-plugin`, `@nx/web` at `24.0.3` with npm (via `npx nx add` where available, checking `--help` first); verify `npx nx report` lists all plugins at 24.0.3
- [x] 1.2 Check that `@analogjs/vite-plugin-angular` / `@analogjs/vitest-angular` support the Angular major required by `@nx/angular@24.0.3`; record the result in design.md D6 (keep Analog or switch to the documented fallback) and verify the chosen packages install without peer-dependency errors
- [x] 1.3 Create `tsconfig.base.json` with strict settings and path aliases (`@tins/ui-tokens`, `@tins/ui-components`, `@tins/ui-components/*`, `@tins/testing-a11y`); verify `npx tsc -p tsconfig.base.json --noEmit` succeeds on an empty workspace
- [x] 1.4 Configure `nx.json`: register vite, playwright, and eslint plugins; `targetDefaults` (cache, `dependsOn: ['^build']` for build); `namedInputs.production` excluding specs and `A11Y.md`; verify with `npx nx show projects` (no errors)
- [x] 1.5 Add `tools/scripts/check-nx-versions.mjs` and a root `verify` target; verify it passes now and fails when an `@nx/*` version is temporarily changed
- [x] 1.6 Update `.gitignore` (dist, coverage, test-results, playwright-report, `.nx/cache`) and README with workspace layout and core commands; verify the commands in README run as written

## 2. Accessibility test helpers library (`libs/testing/a11y`)

- [x] 2.1 Generate `libs/testing/a11y` (`type:util`, `scope:testing`) with Vite/Vitest via the nx-generate flow; verify `npx nx test testing-a11y` runs
- [x] 2.2 Implement shared axe config (WCAG 2.2 A/AA/AAA + best-practice tags, `color-contrast-enhanced` on) and `expectNoA11yViolations(el)` for Vitest with readable failure output (rule id, node, WCAG criterion); verify with tests that a known-bad fixture (unlabeled button, low-contrast text) fails and a good fixture passes
- [x] 2.3 Implement `assertTargetSize(el, 44)`, `assertFocusVisible(el)` (≥2px, ≥3:1), and contrast-ratio utility; verify with passing and failing fixtures for each
- [x] 2.4 Implement Playwright helpers: `scanPage(page, testInfo)` using `@axe-core/playwright` with the same tags and report attachment, `applyTextSpacing(page)`, `assertNoReflowOverflow(page)` at 320px; verify with a helper unit test against a static HTML fixture
- [x] 2.5 Implement `excludeRule({ rule, selector, reason, issue })` as the only exclusion path; verify a test that omits `reason` or `issue` throws
- [x] 2.6 Document helper usage in `libs/testing/a11y/README.md`; verify examples match exported API (typecheck passes)

## 3. Linting and module boundaries

- [x] 3.1 Create root flat `eslint.config.mjs` with `@nx/enforce-module-boundaries` depConstraints from design D10 (incl. `bannedExternalImports` for `type:ui`, and rejecting untagged projects); verify `npx nx run-many -t lint` passes
- [x] 3.2 Add `no-restricted-syntax`/`no-restricted-properties` rule banning raw axe `disableRules` outside `@tins/testing-a11y`; verify a temporary offending test file fails lint
- [x] 3.3 Add boundary regression check: temporary files importing an app from a lib, Angular from a `type:ui` lib, and a deep path from the demo each fail lint; remove them and record the check in `docs/architecture.md`

## 4. Design tokens library (`libs/ui/tokens`)

- [x] 4.1 Generate `libs/ui/tokens` (`type:tokens`, `scope:ui`) as a Vite library; verify `npx nx build ui-tokens` emits to `dist/libs/ui/tokens`
- [x] 4.2 Author SCSS palette and themes (light, dark, high-contrast) emitting `tokens.css` with `:root`, `[data-theme]`, `prefers-color-scheme`, and `forced-colors` blocks; verify built CSS contains each block
- [x] 4.3 Author SCSS mixins (`focus-ring`, `reduced-motion`, `forced-colors`, `target-size`) exposed via `@tins/ui-tokens/scss`; verify a sample SCSS file using them compiles in a test
- [x] 4.4 Generate `tokens.json` of text/background and UI/boundary pairs at build; add Vitest test asserting ≥7:1 (normal), ≥4.5:1 (large), ≥3:1 (UI/focus) for every theme; verify it passes and fails when a pair is temporarily lowered
- [x] 4.5 Document tokens, themes, and override usage in `libs/ui/tokens/README.md`; verify listed token names exist in built CSS (test)

## 5. Lit component library (`libs/ui/components`)

- [x] 5.1 Generate `libs/ui/components` (`type:ui`, `scope:ui`) with Vite library mode, multi-entry (`index`, `button`, `text-field`), `lit` and `@tins/ui-tokens` external, and dts output; verify `npx nx build ui-components` emits ESM + `.d.ts` per entry
- [x] 5.2 Configure Vitest browser mode (Playwright provider, Chromium headless) with istanbul coverage thresholds; verify `npx nx test ui-components` runs a placeholder browser test
- [x] 5.3 Add `eslint-plugin-lit` and `eslint-plugin-lit-a11y` to the library lint config; verify `npx nx lint ui-components` passes
- [x] 5.4 Implement guarded `define(tag, ctor)` helper, SCSS `?inline` + `unsafeCSS` style loading, and `HTMLElementTagNameMap` augmentation pattern; verify tests cover double registration (no throw) and typed `querySelector`
- [x] 5.5 Implement `tins-button` (variants, disabled, toggle with `aria-pressed`, icon-only requiring label, 44px min target, focus ring, reduced-motion, forced-colors); verify unit tests for every state, keyboard (Enter/Space), events (bubbles + composed), and `expectNoA11yViolations` + target-size + focus-visible checks pass
- [x] 5.6 Implement `tins-text-field` as form-associated (ElementInternals value/validity/reset, label association, required + error message with suggestion, `aria-describedby` inside shadow root, status messages via live region); verify unit tests for form submit data, reset, `<label for>` naming, error announcement, and a11y checks in every state pass
- [x] 5.7 Add `cem` target (`@custom-elements-manifest/analyzer`) that `build` depends on, and `customElements` field in the library `package.json`; verify `dist/.../custom-elements.json` lists tag, attributes, properties, events, slots, parts, and CSS properties for both components
- [x] 5.8 Add a plain-HTML smoke test (Vitest browser) loading the built bundle without any framework; verify `tins-button` upgrades and is clickable
- [x] 5.9 Create `A11Y.md` for each component (manual review record: NVDA+Firefox, VoiceOver+Safari results, 2.4.9, 2.4.10, 3.1.3, 3.1.5, 3.1.6, N/A criteria with reasons) and a library README documenting each component's API; verify every public API item in the manifest appears in the README (test or script)

## 6. Angular demo app (`apps/demo`)

- [x] 6.1 Generate `apps/demo` (`type:app`, `scope:demo`) with `@nx/angular:application` (standalone, SCSS, routing, Vitest, Playwright e2e → `apps/demo-e2e`), checking generator `--help` first; verify `npx nx serve demo` starts
- [x] 6.2 Switch build/serve/test to Vite per design D6 (Analog plugin or recorded fallback); verify `npx nx build demo` and `npx nx test demo` succeed and Nx infers the targets
- [x] 6.3 Add `@angular-eslint/template` accessibility rules; verify an `<img>` without `alt` in a template fails `npx nx lint demo`, then remove it
- [x] 6.4 Build accessible shell: skip link, landmarks, nav, `TitleStrategy`, focus-to-`h1` on navigation, single `h1` per page; verify component tests assert title update and focus move after navigation
- [x] 6.5 Add theme switcher (light/dark/high-contrast, `data-theme` on `<html>`, persisted in `localStorage`, default follows OS) and load `@tins/ui-tokens` CSS; verify unit test that selection persists across re-bootstrap
- [x] 6.6 Create route manifest and lazily-loaded showcase pages for button and text-field (all variants/states, usage snippet, keyboard + a11y notes) using `CUSTOM_ELEMENTS_SCHEMA` and public entry points only; verify deep-link test renders each page directly
- [x] 6.7 Implement app-local `TinsValueAccessorDirective` for `tins-text-field` with Reactive Forms and `ngModel`; verify unit tests for view→model and model→view updates
- [x] 6.8 Add `expectNoA11yViolations` unit tests for the shell and each showcase page; verify `npx nx test demo` passes

## 7. Demo e2e (`apps/demo-e2e`)

- [x] 7.1 Configure Playwright: chromium/firefox/webkit projects, `webServer` (dev serve locally, built preview in CI), HTML reporter; verify `npx nx e2e demo-e2e` runs a smoke test in all three browsers
- [x] 7.2 Add per-route × per-theme axe scans driven by the route manifest (all themes in Chromium, light theme in Firefox/WebKit) with reports attached; verify they pass and that a temporary heading-order violation fails the route's test
- [x] 7.3 Add route-coverage spec failing when a manifest route has no scan; verify by temporarily adding an unscanned route
- [x] 7.4 Add keyboard-only specs: skip link, nav, route focus management, and each component's documented interactions, plus focus-visible checks; verify they pass in all browsers
- [x] 7.5 Add presentation specs: 320px reflow, text-spacing override, 200% zoom, `reducedMotion: 'reduce'` (no running animations), and Chromium-only `forcedColors: 'active'` visibility checks; verify all pass

## 8. CI and contribution process

- [x] 8.1 Add `tools/scripts/check-a11y-review.mjs` failing when a component's `src/` changed without its `A11Y.md`; verify against a local diff in both directions
- [x] 8.2 Add `.github/pull_request_template.md` with the manual AAA checklist and link to `A11Y.md` records; verify it renders on a draft PR or by preview
- [x] 8.3 Add `.github/workflows/ci.yml` (npm ci, Playwright browsers, `nx-set-shas`, `verify`, a11y-review check, `nx affected -t lint test build e2e`, upload reports); verify the workflow passes on a PR branch
- [x] 8.4 Write `docs/accessibility.md` describing the AAA target, the three test layers, custom checks, exclusion policy, and manual review process; verify all referenced commands and files exist

## 9. Integration verification

- [x] 9.1 From a clean clone, run `npm ci && npx nx run-many -t verify lint test build e2e`; verify everything passes
- [x] 9.2 Change one token value and run `npx nx affected -t test --base=HEAD~1`; verify tokens, components, and demo run while unrelated projects are skipped, and a second `npx nx build ui-components` hits the cache
- [x] 9.3 Run `openspec validate setup-nx-monorepo-architecture --strict`; verify no errors or warnings

## Workflow follow-up

- Complete manual screen reader reviews recorded in each `A11Y.md` before archiving.
- Archive the change after review, then verify the main specs were created under `openspec/specs/`.
