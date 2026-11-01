# Design

## Context

- Row styling lives in `libs/ui/components/src/file-table/file-table.styles.scss`. Today one rule,
  `tr.selectable:hover, tr.selected { background-color: color-surface-raised }`, styles both states.
  Hover is already limited to `tr.selectable`, so unselectable rows show no hover today. Rows carry
  the `selectable` / `selected` classes and the `row` / `row-selected` parts.
- Colours come only from theme tokens (`libs/ui/tokens`). `COLOR_TOKENS` in `themes.ts` lists them.
  `scss/_themes.scss` holds the `light`, `dark`, `high-contrast` and `forced-colors` maps.
  `contrast.spec.ts` checks every entry in `CONTRAST_PAIRS` against AAA thresholds in each theme.
- In `high-contrast`, `color-surface-raised` is `#000000`, the same as `color-surface`. That is why
  rows show no colour change in that theme.
- Component tests run in real Chromium (Vitest browser mode, `ui-components:browser`), so `:hover`
  and `getComputedStyle` work there. The e2e suite (playwright-bdd) already has hover steps in
  `layout.steps.ts`.

## Goals / Non-Goals

**Goals:**
- Four visually distinct row states: default, hover, selected, and selected while hovered. All are
  driven by tokens, so each theme controls its own values.
- Every new background is checked automatically for AAA contrast.

**Non-Goals:**
- Matching the original design's exact colours, spacing or markup.
- Hover or selection styling for the header row, or a keyboard-focus row highlight. The checkbox
  focus ring already covers focus.
- Changing `--tins-color-surface-raised` or the toolbar.

## Decisions

1. **Dedicated row tokens, not reused ones.** Add `color-row-hover`, `color-row-selected` and
   `color-row-selected-hover` to `COLOR_TOKENS` and all four SCSS maps.
   *Alternative:* derive colours with `color-mix()` from `color-primary` and `color-surface`. That was
   rejected because derived colours can't be listed in the static contrast check, and the
   high-contrast theme needs hand-picked values.
   Starting values, to be confirmed by `contrast.spec.ts`:

   | token                      | light     | dark      | high-contrast | forced-colors |
   | -------------------------- | --------- | --------- | ------------- | ------------- |
   | `color-row-hover`          | `#f3f3f3` | `#1e1e1e` | `#262626`     | `Canvas`      |
   | `color-row-selected`       | `#e3ecfa` | `#1b2a42` | `#00004d`     | `Canvas`      |
   | `color-row-selected-hover` | `#d0def5` | `#243756` | `#000080`     | `Canvas`      |

   Hover is neutral grey and selection is a blue tint tied to the primary colour, so the two read as
   different kinds of state, not just different strengths.

2. **CSS rules.** Replace the shared rule with three rules:
   `tr.selectable:hover` → hover, `tr.selected` → selected, `tr.selected:hover` → selected-hover.
   Selected rows are always selectable, so the last rule wins by specificity and source order.
   `cursor: pointer` stays only on `tr.selectable`. Add a `motion-safe-transition(background-color)`
   to match `.action`. It respects reduced motion.

3. **Contrast pairs.** For each of the three new backgrounds, add pairs for `color-text` (text),
   `color-text-muted` (text), `color-border` (ui, checkbox box), `color-focus-ring` (ui),
   `color-primary` (ui, checked box) and `color-success` (ui, status dot). The existing
   `color-success on color-surface-raised` pair ("raised (selected) rows") gets its usage label
   updated, because rows no longer use that surface.

4. **Forced colors.** Backgrounds are overridden by the system, so outlines carry the state.
   Hover gets `outline: 2px dashed Highlight`. Selected keeps the existing `2px solid Highlight`, and
   that solid outline also applies to selected rows on hover. Both use `outline-offset: -2px`, so the
   layout does not shift.

5. **Testing.**
   - Unit (browser): render the sample data. Use `userEvent.hover` / `unhover` from `vitest/browser`
     and read `getComputedStyle(row).backgroundColor` to check the default, hover, selected and
     selected+hover colours are pairwise distinct. Also check that a scheduled row's colour doesn't
     change on hover.
   - The contrast spec covers the theme requirement automatically, including high-contrast's
     distinct backgrounds via a new assertion that row tokens ≠ `color-surface`.
   - e2e: one scenario in `file-table.feature` (hover a row and check the colour changed, select it,
     hover another row and check the colours differ). Reuse the existing hover step pattern.

## Risks / Trade-offs

- [Three new public CSS custom properties grow the token API] → They are documented in both READMEs
  and in `@cssprop`. Consumers can override them like other tokens.
- [Light-theme hover `#f3f3f3` is subtle against white (~1.1:1)] → WCAG doesn't require a contrast
  ratio between state backgrounds. Selection is also shown by the checked checkbox (1.4.1). The
  value can be darkened later without a spec change.
- [Computed-style tests could be brittle if values change] → Tests check that colours are distinct,
  not exact values.

## Migration Plan

Additive only. Ship tokens and styles together in the same release. To roll back, revert the commit.
No consumer changes are required.
