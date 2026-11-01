# Proposal

## Why

In `<tins-file-table>`, the select-all checkbox must show as checked whenever every selectable file is selected. The "Select-all tri-state" requirement says "checked when all are", but it only has scenarios for reaching that state from a partial selection with select-all itself. Nothing covers the other ways to reach it.

The tests also leave gaps:

- The e2e step `the {string} check box is checked` asserts only `toBeChecked()`. It does not check that the "mixed" state is gone.
- The e2e scenario "Select all chooses every available file and clears them again" checks only the "Selected 2" count after selecting all. It never checks the checkbox.

So a regression could show a dash, or an empty box, next to "Selected 2" with every available file chosen, and no test would fail. This change is the counterpart of the archived `select-all-unchecked-when-none-selected` change.

## What Changes

- Make "checked when all are selected" its own requirement. It pins both states: when every selectable file is selected and at least one file is selectable, select-all is checked and not indeterminate. This holds visually and for assistive technology, which must read "checked", not "mixed".
- "All items" means all *selectable* items, meaning files whose status is available. Files that are not available can never be selected, so they do not count. This matches the existing tri-state rule and is recorded here as an assumption, not a behavior change.
- Add scenarios for every way the selection can become complete:
  - select-all from nothing selected
  - select-all from a partial selection
  - checking the last unselected row with its checkbox
  - clicking that row
  - pressing Space on that row
  - a `files` update that removes, or makes unavailable, the only selectable files that were not selected
- Add the matching inverse scenario: a `files` update that adds a new available file stops select-all from being checked and makes it indeterminate.
- Add unit tests and e2e assertions for each scenario. Make the existing "is checked" e2e step also assert that the checkbox is not indeterminate. Fix the component only if a new test fails.

A code read found no defect in how the state is derived today. On every render, `checked` is `selectable.length > 0 && count === selectable.length` and `indeterminate` is `count > 0 && !all`. Both are bound with `live()`. So this change is mainly a spec clarification plus regression tests.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `file-download-table`: adds a requirement and scenarios that require select-all to be checked and not indeterminate whenever every selectable file is selected, however the selection got there.

## Impact

- `libs/ui/components/src/file-table/file-table.ts`: select-all rendering. Changes only if a new test fails.
- `libs/ui/components/src/file-table/file-table.spec.ts`: new unit tests.
- `apps/demo-e2e/steps/file-table.steps.ts`: the "is checked" step gets stricter.
- `apps/demo-e2e/features/file-table.feature`: new assertions and one new scenario.
- No changes to the public API, events or tokens.
