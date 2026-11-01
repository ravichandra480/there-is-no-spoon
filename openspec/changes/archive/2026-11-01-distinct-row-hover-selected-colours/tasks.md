# Tasks

## 1. Row colour tokens

- [x] 1.1 Add `color-row-hover`, `color-row-selected` and `color-row-selected-hover` to `COLOR_TOKENS` in `libs/ui/tokens/src/lib/themes.ts`. Add their values to the `$light`, `$dark`, `$high-contrast` and `$forced-colors` maps in `scss/_themes.scss`, using the design's starting values. Verify with `pnpm nx run ui-tokens:test`: the CSS-output and mixins specs pass and the new custom properties appear in each theme.
- [x] 1.2 In `contrast-pairs.ts`, add the pairs from design decision 3 for each new background, and relabel the `color-success on color-surface-raised` usage. Add an assertion to `contrast.spec.ts` that each row token differs from `color-surface` in every theme. Verify that `pnpm nx run ui-tokens:test` passes. If a value fails, adjust it in `_themes.scss` until every pair meets AAA.
- [x] 1.3 List the three new properties in the token list in `libs/ui/tokens/README.md`. Verify that the tokens `readme.spec.ts` passes.

## 2. File table row styling

- [x] 2.1 In `file-table.styles.scss`, replace the shared `tr.selectable:hover, tr.selected` rule with separate rules: hover, selected, and selected+hover. Add `motion-safe-transition(background-color)`. Keep `cursor: pointer` only on `tr.selectable`. Verify in the demo `/file-table` page (light, dark and high-contrast) that hovering, selecting and hovering a selected row each show a different colour, and that the sync.exe row doesn't change on hover.
- [x] 2.2 In the forced-colors block, add `outline: 2px dashed Highlight; outline-offset: -2px` for `tr.selectable:hover`. Keep the solid `Highlight` outline for `tr.selected`, including on hover. Verify with Chromium's forced-colors emulation (DevTools → Rendering) that hover shows a dashed outline and selected rows show a solid one.
- [x] 2.3 Add browser tests to `file-table.spec.ts`. Use `userEvent.hover`/`unhover` and `getComputedStyle(row).backgroundColor` to check that default, hover, selected and selected+hover colours are pairwise distinct. Also check that unhovering and unselecting restore the default, that keyboard selection shows the selected colour, and that a scheduled row keeps the default on hover. Verify that `pnpm nx run ui-components:test` passes.
- [x] 2.4 Update the `@cssprop` docs in `file-table.ts`: `surface-raised` now styles only the toolbar, and add the three row properties. Regenerate `custom-elements.json` and update the CSS property list in `libs/ui/components/README.md`. Update `A11Y.md` (1.4.1 row and forced-colors row) to describe the distinct hover and selected states. Verify that `pnpm nx run ui-components:build` and the components `readme.node.spec.ts` pass.

## 3. End-to-end coverage

- [x] 3.1 Add a scenario to `apps/demo-e2e/features/file-table.feature`: hover agent.exe and check its colour changed, select it, hover libcore.dll and check the two row colours differ, hover sync.exe and check it stays default. Add any new steps to `steps/file-table.steps.ts`, following the hover pattern in `layout.steps.ts`. Verify that `pnpm nx run demo-e2e:e2e` passes, including the existing accessibility scenarios.

## 4. Integration check

- [x] 4.1 Run `pnpm nx run-many -t lint test build` across the affected projects and verify that everything passes.

## Workflow follow-up

- Archive the change after review with `/opsx:archive`.
