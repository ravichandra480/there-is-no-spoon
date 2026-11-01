# Proposal

## Why

In `<tins-file-table>`, activating the select-all checkbox must select every selectable file whenever the selection is empty or partial. It must clear the selection only when every selectable file is already selected. Today this rule is one sentence inside the "Select-all tri-state" requirement. The three archived select-all changes pinned what the checkbox *shows* in each state, but not what *activating* it does from each state.

The tests leave gaps that let a regression through:

- No test proves that activating select-all from a partial selection never removes a file. The partial-state tests only use the two-file sample, where "select all" and "keep agent.exe" look the same.
- Only the nothing-selected case checks the `tins-selection-change` event. The partial case does not.
- Every e2e select-all scenario uses the keyboard. None clicks the checkbox with a pointer, so the browser's own click handling of an indeterminate checkbox is not covered end to end.

So if select-all were changed to toggle on its `checked` value, or to clear on any existing selection, the partial case could clear files or select only some of them, and the current suite might not catch it.

## What Changes

- Add a requirement, "Activating select-all selects every selectable file unless all are selected". It states the rule by the selection's state before activation:
  - none selected → select all
  - some selected → select all, keep the existing selection, never clear
  - all selected → clear
- "All items" means all *selectable* items, meaning files whose status is available. Files that are not available are never selected. This matches the existing rules and is recorded as an assumption, not a behavior change.
- Add scenarios for: none and some selected, activated with a pointer click and with Space; a partial selection of two out of three available files; scheduled files staying unselected; exactly one `tins-selection-change` event listing every available file when activating from a partial selection; and the all-selected case still clearing.
- Add unit tests and e2e scenarios for those cases, including a new pointer-click e2e step. Fix the component only if a new test fails.

A code read found no defect. `#onSelectAll` computes `allSelected` over the selectable files from the current selection, not from the checkbox's `checked` value. It commits the full selectable set unless all are selected. So this change is mainly a spec clarification plus regression tests.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `file-download-table`: adds a requirement and scenarios for what activating select-all does when none or some selectable files are selected, by pointer or keyboard.

## Impact

- `libs/ui/components/src/file-table/file-table.ts`: `#onSelectAll`. Changes only if a new test fails.
- `libs/ui/components/src/file-table/file-table.spec.ts`: new unit tests.
- `apps/demo-e2e/steps/file-table.steps.ts`: a new "the user clicks the {string} check box" step.
- `apps/demo-e2e/features/file-table.feature`: new pointer-click scenarios.
- No changes to the public API, events or tokens.
