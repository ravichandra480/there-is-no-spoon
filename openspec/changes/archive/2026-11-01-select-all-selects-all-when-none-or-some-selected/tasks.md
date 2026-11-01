# Tasks

## 1. Unit coverage and fix

- [x] 1.1 In `libs/ui/components/src/file-table/file-table.spec.ts`, add a `describe('tins-file-table activating select-all selects every selectable file unless all are selected')` block after the "indeterminate when some but not all" block. Add one test per scenario of the new requirement:
  - none selected, `click()` (assert `selected` is agent.exe and libcore.dll, checked and not indeterminate, "Selected 2")
  - none selected, focus plus `userEvent.keyboard(' ')`
  - agent.exe only, `click()` (assert agent.exe is still selected and libcore.dll is added)
  - libcore.dll only, Space
  - three available files plus one scheduled, two selected, then activate (assert all three are selected, the scheduled file is not, and "Selected 3")
  - partial activation never clears: record the selection before activating and assert each of those files is still in `selected`
  - partial activation event: spy on `tins-selection-change` and assert exactly one call, whose detail names equal `['agent.exe', 'libcore.dll']` and equal `el.selected`
  - all selected still clears (unchecked, not indeterminate, "None Selected")

  Verify with `pnpm nx test ui-components`.
- [x] 1.2 If any test from 1.1 fails, fix `#onSelectAll` in `libs/ui/components/src/file-table/file-table.ts`. It must commit the full selectable set unless every selectable file is already selected, and decide from the current selection, not from the input's `checked` value. Verify that `pnpm nx test ui-components` passes, including all existing select-all tests. If every test already passed, record that here and change no code. _Result: all 8 new tests passed against the existing implementation, so no code changed._
- [x] 1.3 If 1.2 changed the code, update the select-all note in `libs/ui/components/src/file-table/A11Y.md` and verify by reading the file. Otherwise mark this task not applicable. _Not applicable: 1.2 changed no code, so A11Y.md is unchanged._

## 2. End-to-end coverage

- [x] 2.1 In `apps/demo-e2e/steps/file-table.steps.ts`, add `When('the user clicks the {string} check box', …)`, which calls `checkbox(page, name).click()` (not `check()`). Verify with `pnpm nx lint demo-e2e`.
- [x] 2.2 In `apps/demo-e2e/features/file-table.feature`, add two scenarios:
  - "Clicking select all with nothing chosen chooses every available file": click "Select all available files", then assert "Selected 2" and that it is checked.
  - "Clicking select all with some files chosen chooses the rest": click "Select agent.exe", assert that select-all is partly checked, click "Select all available files", then assert "Selected 2", that it is checked, and that "Select agent.exe" is checked.

  Verify with `pnpm nx e2e demo-e2e`.

## 3. Integration check

- [x] 3.1 Run `pnpm nx run-many -t lint test -p ui-components demo` and confirm that everything passes. Then run `openspec validate select-all-selects-all-when-none-or-some-selected --strict` and confirm that it passes.
