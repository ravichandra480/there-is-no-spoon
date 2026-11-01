# Proposal

## Why

The select-all checkbox in `<tins-file-table>` must never look checked or partly checked when no file is selected. The "Select-all tri-state" requirement already says "unchecked when none are selected", but its only scenario for an empty selection is "Clear all". Nothing pins the state down for the other ways a selection can reach zero, and the e2e scenario "Select all chooses every available file and clears them again" checks only the count text, not the checkbox. A regression could leave the checkbox showing a check mark or a dash next to "None selected" without any test failing.

## What Changes

- Make "unchecked when none are selected" its own requirement, covering both states: when nothing is selected, select-all is neither checked nor indeterminate, visually and as exposed to assistive technology ("not checked", not "mixed").
- Add scenarios for every way the selection can become empty:
  - the initial render
  - unchecking the last selected row with its checkbox
  - unchecking it by clicking the row
  - clearing everything with select-all
  - a `files` update that removes or makes unavailable every selected file
  - an empty selection while select-all is disabled
- Add unit tests and an e2e assertion for each scenario, and fix the component if any of them fails.

Code review found no defect in today's state derivation: `checked` and `indeterminate` both come from the current selection count on every render. So this change is mainly a spec clarification plus regression tests. Any code change is limited to what a failing test shows.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `file-download-table`: adds a requirement and scenarios that pin select-all to unchecked and not indeterminate whenever the selection is empty, whatever made it empty.

## Impact

- `libs/ui/components/src/file-table/file-table.ts`: select-all rendering. Only changes if a new test fails.
- `libs/ui/components/src/file-table/file-table.spec.ts`: new unit tests.
- `apps/demo-e2e/features/file-table.feature` and `apps/demo-e2e/steps/file-table.steps.ts`: assert the checkbox state, adding a "not checked" step.
- No public API, event or token changes.
