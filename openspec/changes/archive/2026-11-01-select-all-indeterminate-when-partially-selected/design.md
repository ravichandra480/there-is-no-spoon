# Design

## Context

See proposal.md - Why. Select-all in `libs/ui/components/src/file-table/file-table.ts` is a native `<input type="checkbox">`. Its state is derived on every render from the current selection: `all = selectable.length > 0 && count === selectable.length`, `some = count > 0 && !all`, bound as `.checked=${live(all)}` and `.indeterminate=${live(some)}`. When a user clicks an indeterminate native checkbox, the browser clears `indeterminate` and toggles `checked` before `change` fires. `#onSelectAll` then commits "select all" (because not all were selected), and the re-render sets the final state through `live()`.

The styles in `file-table.styles.scss` draw the dash with `:indeterminate::after` and the check mark with `:checked::after`. If both pseudo-classes matched at once, the two rules would fight over the same `::after` box. So "indeterminate and not checked" is a visual requirement, not only an accessibility one.

## Goals / Non-Goals

**Goals:**
- Lock the partial state with tests that assert both properties (`indeterminate === true` and `checked === false`) for every path in the spec delta.
- Keep e2e assertions using the existing Gherkin step vocabulary.

**Non-Goals:**
- Changing the select-all activation rule (partial → select all) or the styles.
- Adding `aria-checked` or other ARIA state. The native `indeterminate` property already exposes "mixed", as recorded in `A11Y.md`.
- Screenshot or visual-diff tests of the dash.

## Decisions

- **Assert the DOM properties, not the accessibility tree.** Unit tests (Vitest browser mode, Chromium) read `selectAll(el).indeterminate` and `.checked`. The e2e step reads them with `toHaveJSProperty`. Chromium maps `indeterminate` to `aria-checked="mixed"` itself. Alternative: Playwright's `toBeChecked({ indeterminate: true })`, which checks the accessible state directly. Rejected as the main check so the step stays consistent with the "checked" and "not checked" steps, which already use `toHaveJSProperty('indeterminate', …)`. It can be added later without changing the spec.
- **Strengthen the step, don't add a new one.** `the {string} check box is partly checked` also asserts `checked === false`. Every existing use of the step expects that, so no scenario changes meaning.
- **Use a three-file fixture for the "several but not all" and data-change cases.** The sample data has only two available files, so "partial" there always means exactly one. A local fixture with three available files (plus one scheduled) covers 2-of-3. The demo page data stays unchanged.
- **Fix only on failure.** As in the sibling changes, the component is touched only if a new test fails. That keeps this change mostly about tests if the current derivation is correct, which the code read suggests.

## Risks / Trade-offs

- [The native click on an indeterminate box toggles `checked` before Lit re-renders, so a test that reads state synchronously could see an in-between value] → Await `el.updateComplete` (unit) and rely on Playwright's auto-retrying assertions (e2e) before asserting.
- [Duplicate coverage with the existing tri-state test "is indeterminate (mixed) for a partial selection"] → Keep it. The new block is organized by requirement like its sibling blocks, and a little overlap is cheaper than reworking existing tests.
