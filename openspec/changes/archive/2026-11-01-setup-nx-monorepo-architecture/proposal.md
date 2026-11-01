# Proposal

## Why

The repository is an empty Nx 24 workspace (only `nx` is installed, no projects exist). We need a defined architecture before any component work starts: a set of framework-agnostic Lit web component libraries, an Angular demo app that consumes and showcases them, and a single toolchain (Vite for build and unit test, Playwright for e2e, SCSS for styling) with WCAG 2.2 Level AAA accessibility enforced by automated tests from day one, so accessibility is a build gate rather than a later audit.

## What Changes

- Establish the Nx monorepo layout: `apps/` for the Angular demo and its Playwright e2e project, `libs/` for Lit libraries, with tags and `@nx/enforce-module-boundaries` rules controlling who can depend on whom.
- Add Lit-based web component libraries built with Vite in library mode (ESM output, type declarations, Custom Elements Manifest), styled with SCSS compiled into Lit `css` styles, and themed via CSS custom properties (design tokens).
- Add a shared design-tokens library (SCSS + CSS custom properties) whose default theme meets AAA contrast (7:1 normal text, 4.5:1 large text) and provides high-contrast / forced-colors and reduced-motion support.
- Add an Angular demo application (standalone components, SCSS) built with Vite-based Angular tooling, that registers the Lit custom elements and renders a page per component showing each documented state.
- Add a Playwright e2e project for the demo app covering keyboard interaction, focus management, and per-page axe-core scans at WCAG 2.2 A/AA/AAA rule tags.
- Add Vitest (via Vite) unit testing for every library and the demo app, running component tests in a real browser (Vitest browser mode with Playwright provider) including axe-core assertions per component.
- Wire Nx targets (`build`, `test`, `lint`, `e2e`, `a11y`) with caching so `nx affected` runs the right checks, and add a CI workflow that fails on any accessibility violation.
- Document AAA criteria that cannot be fully automated (e.g. 2.4.9 Link Purpose, 3.1.5 Reading Level, 1.2.x media) as a manual review checklist tied to each component.

## Capabilities

### New Capabilities
- `workspace-architecture`: Nx project layout, naming, tags, module-boundary rules, shared toolchain (Vite, Vitest, Playwright, SCSS, ESLint, TypeScript) and the standard targets every project exposes.
- `web-component-library`: How Lit component libraries are authored, styled with SCSS and design tokens, built, packaged, and documented so any framework (starting with Angular) can consume them.
- `demo-app`: The Angular demo application that consumes the Lit libraries and showcases every component and state, plus its Playwright e2e coverage.
- `accessibility-compliance`: WCAG 2.2 Level AAA conformance requirements for components and the demo app, and the automated (unit + e2e) and manual checks that gate merges.

### Modified Capabilities
<!-- None: no specs exist yet in openspec/specs/. -->

## Impact

- **Code**: New `apps/demo`, `apps/demo-e2e`, `libs/ui/components` (initial Lit library), `libs/ui/tokens`; root `tsconfig.base.json`, `eslint.config.mjs`, `vitest.workspace`/project configs, `playwright.config.ts`, updated `nx.json` (plugins, target defaults, named inputs).
- **Dependencies** (npm, matching existing `package-lock.json`): `@nx/angular`, `@nx/js`, `@nx/vite`, `@nx/playwright`, `@nx/eslint`, `@nx/web`, `@angular/*`, `@analogjs/vite-plugin-angular` (Vite-based Angular build/test), `lit`, `sass`, `vite`, `vitest`, `@vitest/browser`, `@playwright/test`, `axe-core`, `@axe-core/playwright`, `@custom-elements-manifest/analyzer`, `eslint-plugin-lit`, `eslint-plugin-lit-a11y`, `@angular-eslint/*` (template accessibility rules).
- **CI**: New GitHub Actions workflow running `nx affected -t lint test build e2e` with Playwright browsers installed.
- **Process**: PRs touching UI must pass automated AAA checks and complete the manual AAA checklist for affected components.
