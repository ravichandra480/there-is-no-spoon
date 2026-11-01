# Tasks

## 1. Unit coverage and fix

- [x] 1.1 In `libs/ui/components/src/file-table/file-table.spec.ts`, add a `describe('tins-file-table activating select-all clears the selection when every selectable file is selected')` block after the "activating select-all selects every selectable file unless all are selected" block. Add one test per scenario of the new requirement:
  - all selected via row checkboxes, then `selectAll(el).click()`: assert `el.selected` is empty, unchecked and not indeterminate, "None Selected", and `download(el).disabled`
  - all selected, then focus plus `userEvent.keyboard(' ')`: same assertions
  - all selected by clicking the agent.exe and libcore.dll rows (a non-checkbox cell), then activate: cleared, unchecked and not indeterminate
  - only agent.exe selected, set `el.files` so libcore.dll is `scheduled`, await update, assert select-all is checked, then activate: cleared and "None Selected"
  - three available plus one scheduled (local fixture like `THREE`), check all three, activate: `el.selected` empty, scheduled row unchecked, "None Selected"
  - spy on `tins-selection-change` after reaching full selection, activate: exactly one call, `detail.selected` is `[]` and equals `el.selected`
  - activate twice from full selection: empty after the first, `['agent.exe', 'libcore.dll']` and checked after the second
  - Space clear keeps focus: after pressing Space, `el.shadowRoot.activeElement` is the select-all input

  Verify with `pnpm nx test ui-components`.
- [x] 1.2 If any test from 1.1 fails, fix `#onSelectAll` in `libs/ui/components/src/file-table/file-table.ts` so it commits an empty selection whenever at least one file is selectable and all selectable files are selected, deciding from the current selection rather than the input's `checked` value. Verify that `pnpm nx test ui-components` passes, including all existing select-all tests. If every test already passed, record that here and change no code. _Result: all 8 new tests passed against the existing implementation, so no code changed._
- [x] 1.3 If 1.2 changed the code, update the select-all note in `libs/ui/components/src/file-table/A11Y.md` and verify by reading the file. Otherwise mark this task not applicable. _Not applicable: 1.2 changed no code, so A11Y.md is unchanged._

## 2. End-to-end coverage

- [x] 2.1 In `apps/demo-e2e/features/file-table.feature`, add two scenarios using existing steps:
  - "Clicking select all when every file is chosen clears them": click "Select all available files", assert "Selected 2" and checked, click it again, then assert "None Selected", that it is not checked, and that "Download Selected" is disabled.
  - "Clicking select all after choosing every file one by one clears them": click "Select agent.exe" and "Select libcore.dll", assert select-all is checked, click "Select all available files", then assert "None Selected", that it is not checked, and that "Select agent.exe" is not checked.

  Verify with `pnpm nx e2e demo-e2e`.

## 3. Integration check

- [x] 3.1 Run `pnpm nx run-many -t lint test -p ui-components demo` and confirm that everything passes. Then run `openspec validate select-all-clears-when-all-selected --strict` and confirm that it passes.
