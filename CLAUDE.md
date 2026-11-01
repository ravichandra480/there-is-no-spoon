# there-is-no-spoon

Nx monorepo: framework-agnostic Lit web components (`libs/ui/components`), design tokens
(`libs/ui/tokens`), shared axe helpers (`libs/testing/a11y`), and an Angular demo with Playwright
e2e (`apps/demo`, `apps/demo-e2e`). Target: WCAG 2.2 AAA. See `ARCHITECTURE.md` and `ACCESSIBILITY.md`.

## Rules

- **Behaviour changes start with `/opsx:propose`.** Write the spec change in `openspec/changes/`
  first, implement with `/opsx:apply`, then `/opsx:archive`. Name unit `describe` blocks and
  Gherkin scenarios after the OpenSpec requirement they cover.
- **Components never import a framework.** `type:ui` libs may not import Angular, RxJS, zone.js,
  React, Vue or Svelte (`bannedExternalImports` in `eslint.config.mjs`). Only Lit.
- **UI tests run in a real browser.** Component specs run in Vitest browser mode (Chromium);
  `*.node.spec.ts` drives Playwright itself. e2e runs in Chromium and WebKit. No jsdom.
- **Axe rules are only excluded through `excludeRule`** from `@tins/testing-a11y`, scoped to a
  selector, with a reason and an issue link. Never switch a rule off globally.
- **A component change updates its `A11Y.md`** in the same folder (spec files excepted).
  `tools/scripts/check-a11y-review.mjs` fails CI otherwise.

## Before finishing

```sh
npx nx run workspace:verify                  # Nx version policy + module boundaries
node tools/scripts/check-a11y-review.mjs     # A11Y.md updated for changed components
npx nx affected -t lint test build e2e       # what CI runs
openspec validate --all --strict             # when openspec/ changed
```

## Nx

- Run tasks through Nx (`npx nx run`, `npx nx affected`), not the underlying tool. npm is the
  package manager, so use `npx nx`, never a global `nx`.
- Never guess CLI flags: check `--help` or the Nx docs first.
- Plugin best practices, where present: `node_modules/@nx/<plugin>/PLUGIN.md`.
