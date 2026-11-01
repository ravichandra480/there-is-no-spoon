# Proposal

## Why

In `<tins-file-table>`, the select-all checkbox must show as indeterminate (a dash, announced as "mixed") whenever some, but not all, selectable files are selected. The "Select-all tri-state" requirement says "indeterminate when some are", but it has only one scenario for it: one of the two available files selected. The archived `select-all-unchecked-when-none-selected` and `select-all-checked-when-all-selected` changes pinned the other two states for every way of reaching them. The partial state is the last one left without that coverage.

The tests also leave gaps:

- The e2e step `the {string} check box is partly checked` asserts only `indeterminate === true`. It does not check that `checked` is false, so a box that is both checked and indeterminate (a check mark drawn over the dash, since the styles apply both `::after` rules) would pass.
- No e2e scenario reaches the partial state by unchecking one row after select-all, or by clicking a row instead of its checkbox.
- Unit tests reach the partial state only by checking one row from nothing selected. No test covers leaving the full state, larger lists (2 of 3), or a `files` update that leaves a partial selection.

## What Changes

- Make "indeterminate when some but not all are selected" its own requirement. It pins the state both ways: when at least one selectable file is selected and at least one selectable file is not, select-all is indeterminate and not checked. It shows a dash and no check mark, and assistive technology reads it as "mixed", not "checked" or "not checked".
- "All items" means all *selectable* items, meaning files whose status is available. Files that are not available can never be selected, so they count toward neither "some" nor "all". This matches the existing tri-state rule and is recorded here as an assumption, not a behavior change.
- Add scenarios for every way the selection can become partial:
  - checking one row from nothing selected, with its checkbox, by clicking the row, or with Space
  - unchecking one row after select-all, with its checkbox or by clicking the row
  - a list with three available files where two are selected
  - a `files` update that adds a new available file while everything is selected (already in the "checked" requirement, referenced here)
  - a `files` update that removes or makes unavailable some, but not all, selected files while unselected selectable files remain
- Add scenarios that the partial state ends correctly: activating select-all from it selects every selectable file (the existing tri-state rule), and it never shows for scheduled-only differences.
- Add unit tests and e2e assertions for each scenario. Make the existing "is partly checked" e2e step also assert that the checkbox is not checked. Fix the component only if a new test fails.

A code read found no defect in how the state is derived today. On every render, `indeterminate` is `count > 0 && !all` and `checked` is `all`, where `all` is `selectable.length > 0 && count === selectable.length`. Both are bound with `live()`, so the native toggle the browser applies when the user clicks an indeterminate box is overwritten on the next render. So this change is mainly a spec clarification plus regression tests.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `file-download-table`: adds a requirement and scenarios that require select-all to be indeterminate and not checked whenever some, but not all, selectable files are selected, however the selection got there.

## Impact

- `libs/ui/components/src/file-table/file-table.ts`: select-all rendering. Changes only if a new test fails.
- `libs/ui/components/src/file-table/file-table.spec.ts`: new unit tests.
- `apps/demo-e2e/steps/file-table.steps.ts`: the "is partly checked" step gets stricter.
- `apps/demo-e2e/features/file-table.feature`: new assertions and one or two new scenarios.
- No changes to the public API, events or tokens.
