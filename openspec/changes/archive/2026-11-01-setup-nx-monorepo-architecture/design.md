# Design

## Context

- Greenfield: the repo contains only `nx@24.0.3` (npm, `package-lock.json`), an `nx.json` with analytics off, and OpenSpec/agent tooling. There are no projects, no TypeScript config, and no existing specs.
- Requirements live in `specs/` (workspace-architecture, web-component-library, demo-app, accessibility-compliance). Motivation is in proposal.md.
- Hard constraints from the request: Nx monorepo, Angular demo app, Lit libraries, Playwright e2e, Vite for build and test, SCSS, WCAG 2.2 AAA with automated testing.

## Goals / Non-Goals

**Goals:**
- A working skeleton where `nx run-many -t lint test build e2e` passes on a clean checkout with two real components, proving every requirement end-to-end.
- Accessibility checks that fail fast at three layers: lint (static), Vitest (per component state), Playwright (per page, per theme, per browser).
- Shared accessibility test helpers so Vitest and Playwright apply the same rule set and AAA extensions.

**Non-Goals:**
- Publishing packages to an npm registry, versioning/changelog tooling (release flow comes later).
- An Angular adapter library (typed wrappers / generated directives). The demo uses custom elements directly, as specified.
- Server-side rendering or hydration of Lit components.
- Nx Cloud / remote caching (local cache only; can be added without spec changes).
- A full component catalog. Initial components are `tins-button` (incl. toggle and icon-only variants) and `tins-text-field` — the minimum that exercises naming, states, form participation, and error messaging.

## Decisions

### D1. Workspace layout and project names
```
apps/
  demo/                 type:app    scope:demo      Angular demo
  demo-e2e/             type:e2e    scope:demo      Playwright
libs/
  ui/tokens/            type:tokens scope:ui        SCSS tokens → CSS custom properties + JSON
  ui/components/        type:ui     scope:ui        Lit components (per-component entry points)
  testing/a11y/         type:util   scope:testing   axe config + AAA helpers for Vitest & Playwright
tools/scripts/          version check, a11y-review check
```
Import paths: `@tins/ui-tokens`, `@tins/ui-components`, `@tins/ui-components/button`, `@tins/testing-a11y`. Element prefix `tins-` ("there is no spoon") is an assumption; changing it is a find/replace before first release.

*Alternative:* one library per component. Rejected for now — more project overhead with only two components; per-component entry points give the same consumer-side tree-shaking. Split later when release cadence diverges.

### D2. Nx plugins and inferred targets
Install `@nx/js`, `@nx/vite`, `@nx/angular`, `@nx/playwright`, `@nx/eslint`, `@nx/web` pinned to `24.0.3`. Register `@nx/vite/plugin`, `@nx/playwright/plugin`, `@nx/eslint/plugin` in `nx.json` so `build`/`test`/`lint`/`e2e` are inferred from config files rather than hand-written in `project.json`. `targetDefaults` mark `build`, `test`, `lint` cacheable; `namedInputs.production` excludes spec files, stories, and `A11Y.md`. Generators are run through the `nx-generate` skill flow during apply; flags are verified with `--help` before use.

### D3. Lit libraries built with Vite library mode
- `@nx/js:library --bundler=vite` producing ESM only, `build.lib.entry` as a map (`index`, `button`, `text-field`) and `rollupOptions.external` for `lit` and `@tins/ui-tokens` so consumers dedupe them.
- Type declarations via `vite-plugin-dts` (what `@nx/vite` configures).
- Custom Elements Manifest via `@custom-elements-manifest/analyzer` run as a dependent `cem` target that `build` depends on; `package.json` declares `"customElements": "custom-elements.json"`.
- Elements are registered through a guarded `define` helper (`customElements.get(tag) ?? customElements.define(...)`) instead of the `@customElement` decorator, satisfying the duplicate-registration scenario.
- `HTMLElementTagNameMap` augmentation in each component module for typed lookup.
- Form controls use `static formAssociated = true` + `ElementInternals` (value, validity, `formResetCallback`, labels). Accessible name across shadow DOM comes from ElementInternals ARIA (`internals.role`, `ariaLabel`, etc.) plus delegatesFocus where the inner control is native.

*Alternative:* `@nx/web` Rollup. Rejected — request mandates Vite and it unifies with Vitest config.

### D4. SCSS inside Lit components
Component styles are `button.styles.scss`, imported with Vite's `?inline` suffix (returns compiled CSS as a string) and wrapped with `unsafeCSS()` into `static styles`. SCSS uses `@use '@tins/ui-tokens/scss' as tokens;` for mixins (focus ring, reduced-motion, forced-colors) while all colors/spacing resolve to `var(--tins-*)` custom properties at runtime, so theming needs no rebuild.

*Alternatives:* `rollup-plugin-lit-css` / `vite-plugin-lit-css` (extra dependency for little gain); plain CSS in `css` tagged templates (loses SCSS mixins required by the request).

### D5. Design tokens
`libs/ui/tokens` holds a single source map in SCSS (`_palette.scss`, `_themes.scss`) emitting:
- `tokens.css`: `:root` (light), `[data-theme="dark"]`, `[data-theme="high-contrast"]`, plus `@media (prefers-color-scheme: dark)` default and `@media (forced-colors: active)` system-color fallbacks.
- `tokens.json`: the same foreground/background pairs, generated at build, consumed by a Vitest test that computes WCAG contrast for every declared text/background pair (≥7:1 normal, ≥4.5:1 large) and every UI-boundary/focus pair (≥3:1). This makes 1.4.6 a unit-test failure, not a scan finding.

Themes shipped: light, dark, high-contrast (all AAA). Default follows `prefers-color-scheme`.

### D6. Angular demo built and tested with Vite (Analog plugin)
Use `@analogjs/vite-plugin-angular` with `@analogjs/vitest-angular` so the demo's `build`, `serve`, and `test` all run through Vite/Vitest, satisfying "Vite for building and testing" literally and letting the Vite plugin infer targets uniformly.
- Generate with `@nx/angular:application` (standalone, SCSS, routing, `--unitTestRunner=vitest`, `--e2eTestRunner=playwright`), then switch the build to a `vite.config.ts` using the Analog plugin.
- `CUSTOM_ELEMENTS_SCHEMA` on pages using `tins-*` elements; components registered by importing `@tins/ui-components/<name>` in each page (lazy-loaded with the route).
- A small app-local `TinsValueAccessorDirective` (ControlValueAccessor on `tins-text-field[formControlName], [ngModel]`) provides two-way binding — this is what any external Angular consumer would write.
- Route manifest `apps/demo/src/app/routes.manifest.ts` (path, title, component name) drives both the router and e2e route coverage.
- Shell: skip link, `header/nav/main/footer` landmarks, `TitleStrategy` for route titles, a router-events listener that focuses the page `h1` (`tabindex="-1"`) after navigation, theme switcher persisting to `localStorage` and setting `data-theme` on `<html>`.

*Compatibility check (task 1.2, 2026-11-01):* `@nx/angular@24.0.3` scaffolds Angular `~22.2.0`, Vite `^8`, Vitest `^4`. `@analogjs/vite-plugin-angular@2.9.4` peers `@angular/build ^22` and `vite ^8`; `@analogjs/vitest-angular@2.9.4` peers `vitest ^4`. Installed without Analog peer conflicts → **keep Analog**. The generator is run with `--bundler=esbuild --unitTestRunner=vitest-analog`, then build/serve move to a Vite config.

*Alternative:* Angular's official `@angular/build:application` (esbuild build, Vite only for the dev server) with `@angular/build:unit-test` (Vitest). Lower risk and better long-term Angular support, but build is esbuild not Vite. Kept as the fallback if the Analog plugin lags the Angular version supported by `@nx/angular@24` (see Risks).

### D7. Unit tests: Vitest browser mode
Libraries and the demo run Vitest with `browser.enabled: true`, `provider: 'playwright'`, Chromium headless (real layout needed for focus, target size, and contrast). Coverage via `@vitest/coverage-istanbul` with thresholds (statements/branches ≥ 90% for `libs/ui/*`) to enforce the "component without tests" scenario. Each component test file renders every documented state and calls `expectNoA11yViolations(el)` from `@tins/testing-a11y`.

### D8. Shared accessibility rule set (`@tins/testing-a11y`)
- axe-core `runOnly` tags: `wcag2a, wcag2aa, wcag2aaa, wcag21a, wcag21aa, wcag22aa, best-practice` (axe-core has no `wcag21aaa`/`wcag22aaa` tags; AAA rules carry `wcag2aaa`). `color-contrast-enhanced`, `identical-links-same-purpose`, `meta-refresh-no-exceptions`, `target-size` are disabled by default in axe and explicitly enabled. Exclusion selectors are matched against the live element (shadow-aware), not axe target strings.
- axe covers only a few AAA rules, so the library adds custom checks used in both runners:
  - `assertTargetSize(el, 44)` — measures bounding boxes of interactive descendants (2.5.5).
  - `assertFocusVisible(el)` — focuses, compares computed outline/box-shadow against unfocused, checks ≥2px and ≥3:1 (2.4.13).
  - `applyTextSpacing(page)` / reflow at 320px, overflow/clipping detection (1.4.10, 1.4.12).
- Exclusions only through `excludeRule({ rule, selector, reason, issue })`; a lint rule (`no-restricted-properties`/`no-restricted-syntax`) bans raw `disableRules` / `.disableRules()` calls outside this helper.
- Playwright side uses `@axe-core/playwright` `AxeBuilder` configured from the same exported tag list; reports attached via `testInfo.attach`.

### D9. Playwright e2e
`@nx/playwright` project `demo-e2e` with `webServer` running `nx run demo:serve` (or preview of the built app in CI). Projects: chromium, firefox, webkit. Test matrix per route from the manifest × themes (light/dark/high-contrast) for axe scans; keyboard-flow specs per component; Chromium-only specs for `forcedColors: 'active'` emulation; `reducedMotion: 'reduce'` emulation asserting no running animations (`document.getAnimations()`). A coverage spec fails if any manifest route lacks a scan.

### D10. Linting
Flat `eslint.config.mjs`: `@nx/eslint-plugin` with `enforce-module-boundaries` depConstraints:
- `type:app` → `type:ui|tokens|util`
- `type:e2e` → `type:util` (+ app route manifest via implicit dependency)
- `type:ui` → `type:tokens|util`, `bannedExternalImports: ['@angular/*', 'react', 'vue']`
- `type:tokens|util` → `type:util`
- `scope:testing` only from test files (`*.spec.ts`, e2e).
Plus `eslint-plugin-lit`, `eslint-plugin-lit-a11y` for `libs/ui/*`, and `@angular-eslint/template` `accessibility` config for the demo. Untagged projects fail via a `notDependOnLibsWithTags`/`allow` setup where `*` is not permitted.

### D11. Repo checks and CI
- `tools/scripts/check-nx-versions.mjs`: fails if any `@nx/*` in `package.json` differs from `nx` (root `verify` target).
- `tools/scripts/check-a11y-review.mjs`: in CI, if a component's `src/` changed in the PR diff but its `A11Y.md` (manual review record: SR pairings NVDA+Firefox, VoiceOver+Safari, plus 2.4.9, 2.4.10, 3.1.3, 3.1.5, 3.1.6 notes and N/A criteria) did not, fail.
- `.github/pull_request_template.md` with the manual AAA checklist.
- `.github/workflows/ci.yml`: `npm ci` → `npx playwright install --with-deps` → `nrwl/nx-set-shas` → `npx nx run-many -t verify` → `npx nx affected -t lint test build e2e`; upload Playwright HTML report and axe attachments as artifacts.

## Risks / Trade-offs

- [Analog Vite plugin lags the Angular version required by `@nx/angular@24.0.3`] → Check compatibility in the first apply task; if incompatible, fall back to D6 alternative (official builder + Vitest via `@angular/build:unit-test`) and record the deviation. Specs are unaffected.
- [axe-core automates only a fraction of AAA] → Custom checks (D8), token contrast unit test (D5), and mandatory manual review record (D11). "Passes CI" is never claimed as full AAA conformance.
- [Shadow DOM hides elements from page-level scans/ARIA relationships] → axe traverses open shadow roots; components use open shadow roots and ElementInternals ARIA rather than cross-root `aria-labelledby`.
- [Firefox/WebKit lack forced-colors emulation in Playwright] → Forced-colors specs run in Chromium only; documented in test titles.
- [Vitest browser mode is slower than jsdom] → Accepted; real layout is required for target-size, focus, and contrast checks. Nx caching limits reruns to affected projects.
- [Test matrix growth: routes × themes × 3 browsers] → axe scans run per theme in Chromium; Firefox/WebKit run the light theme plus keyboard specs. Revisit if runtime exceeds ~10 min.
- [Light/dark/high-contrast all at 7:1 constrains brand palette] → Intentional per AAA target; token test makes violations visible immediately.

## Migration Plan

Greenfield; no migration. Rollback is reverting the change's commits. Apply in the order of tasks.md so each step leaves `nx run-many -t lint test build` green.

## Open Questions

- Final package scope/element prefix (`@tins/`, `tins-`) before first publish — a rename does not change specs.
- Whether to enable Nx Cloud remote caching for CI.
- Exact coverage threshold numbers may be tuned after the first two components land.
