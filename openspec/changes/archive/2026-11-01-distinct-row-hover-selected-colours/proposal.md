# Proposal

## Why

File table rows should change colour when the pointer is over them and when they are selected. Today
both states use the same `color-surface-raised` background. Users cannot tell a hovered row from a
selected one, and hovering a selected row shows no change. In the `high-contrast` theme,
`color-surface-raised` equals `color-surface` (`#000000`), so rows show no colour change at all. The goal is clear,
distinct colour feedback rather than any particular pixel-exact styling.

## What Changes

- Selectable rows change background colour on pointer hover.
- Selected rows get a background colour that differs from both the default and the hover colour.
- Hovering a selected row changes its colour again (a "selected + hover" colour), so hover feedback
  never disappears.
- Rows that cannot be selected (not `available`) do not show hover feedback, because clicking them
  does nothing.
- Three new theme colour tokens: `color-row-hover`, `color-row-selected` and
  `color-row-selected-hover`. Each gets a value in the `light`, `dark`, `high-contrast` and
  forced-colors maps. They are added to the AAA contrast-pair checks against every foreground drawn
  on a row.
- In forced colors (Windows High Contrast), backgrounds are replaced by the system. Hover gets an
  outline, and selection keeps its existing solid `Highlight` outline.
- Non-goal: pixel-exact or markup-exact matching of the original design.

No breaking changes. `--tins-color-surface-raised` stays and still styles the toolbar. Rows stop using
it.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `file-download-table`: adds a requirement for distinct row colours for hover, selected and
  selected+hover, and none on unselectable rows. The existing "visually highlighted" wording becomes
  testable.

## Impact

- `libs/ui/tokens`: `themes.ts` (`COLOR_TOKENS`), `scss/_themes.scss` (four theme maps),
  `contrast-pairs.ts` (new pairs), `README.md` (token list).
- `libs/ui/components/src/file-table`: `file-table.styles.scss` (row rules and forced colors),
  `file-table.ts` (`@cssprop` docs), `file-table.spec.ts` (computed-style tests in the browser
  project), `A11Y.md` (1.4.1 / forced colors notes).
- `libs/ui/components/README.md` and `custom-elements.json` (regenerated CSS-property docs).
- `apps/demo-e2e`: a file-table scenario that checks hover and selection colours.
