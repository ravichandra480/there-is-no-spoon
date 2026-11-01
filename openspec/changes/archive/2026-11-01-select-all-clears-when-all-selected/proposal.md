# Proposal

## Why

In `<tins-file-table>`, activating the select-all checkbox while every selectable file is selected must clear the selection. Today this is only the tail of one sentence in "Select-all tri-state" and the last clause of "Activating select-all selects every selectable file unless all are selected". The sibling changes pinned the none and some cases in detail. The all-selected case has only thin coverage:

- Every unit test for clearing uses the two-file sample and a pointer `click()`. No unit test clears with Space.
- No test checks the `tins-selection-change` event when select-all clears. A regression could clear the selection silently or fire the event with stale detail.
- No test reaches the all-selected state through something other than select-all or row checkboxes (for example a row click or a host data change) and then clears.
- The only e2e clear scenario uses the keyboard. No e2e scenario clears with a pointer click on a checked select-all box.

So a regression where the full state is detected only after select-all itself was used, or where a click on a checked box re-selects instead of clearing, might not be caught.

## What Changes

- Add a requirement, "Activating select-all clears the selection when every selectable file is selected". It states:
  - when at least one file is selectable and every selectable file is selected, activating select-all (pointer click or Space) unselects every file;
  - this holds however the full selection came about (select-all, row checkboxes, row clicks, keyboard, or a host data change);
  - afterwards select-all is unchecked and not indeterminate, the toolbar reads "None Selected", and "Download Selected" is disabled;
  - exactly one `tins-selection-change` event is dispatched with an empty selection;
  - activating select-all again selects every selectable file (the toggle round-trips).
- "All items" means all *selectable* items (status available). Files that are not available never count and are never selected, which matches the existing spec. This is recorded as an assumption, not a behavior change.
- Add unit tests and e2e scenarios for these cases, including a pointer-click clear in e2e using the existing "the user clicks the {string} check box" step. Fix the component only if a new test fails.

A code read found no defect. `#onSelectAll` derives "all selected" from the selectable files and the current selection, and commits an empty set in that case. So this change is a spec clarification plus regression tests.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `file-download-table`: adds a requirement and scenarios for what activating select-all does when every selectable file is already selected.

## Impact

- `libs/ui/components/src/file-table/file-table.ts`: `#onSelectAll`. Changes only if a new test fails.
- `libs/ui/components/src/file-table/file-table.spec.ts`: new unit tests.
- `apps/demo-e2e/features/file-table.feature`: new pointer-click clear scenarios (no new steps expected).
- No changes to the public API, events or tokens.
