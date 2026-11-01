# Tasks

## 1. Unit coverage and fix

- [x] 1.1 In `libs/ui/components/src/file-table/file-table.spec.ts`, add a `describe('tins-file-table select-all is checked when every selectable file is selected')` block right after the "unchecked when nothing is selected" block. Give it an `expectChecked` helper that asserts `selectAll(el).checked === true` and `selectAll(el).indeterminate === false`. Add one test per scenario of "Select-all is checked when every selectable file is selected":
  - select-all from nothing selected (also assert the selection names and "Selected 2")
  - select-all from agent.exe only
  - checking libcore.dll's checkbox
  - clicking a non-checkbox cell of the libcore.dll row
  - pressing Space on the focused libcore.dll checkbox, reusing the existing keyboard-test helper
  - replacing `files` so libcore.dll is removed, and separately so it becomes `scheduled` (assert "Selected 1")
  - adding a new available file after select-all (assert indeterminate, not checked, and the earlier selection kept)
  - checked state with scheduled files present

  Verify with `pnpm nx test ui-components`.
- [x] 1.2 If any test from 1.1 fails, fix the select-all rendering in `libs/ui/components/src/file-table/file-table.ts`. When every selectable file is selected and at least one exists, `checked` must be true and `indeterminate` false, with the unchecked and partial behavior unchanged. Verify that `pnpm nx test ui-components` passes, including the existing tri-state tests and the "unchecked when nothing is selected" tests. If every test already passed, record that result in this task and change no code. _Result: all 9 new tests passed against the existing implementation, so no code changed._
- [x] 1.3 If 1.2 changed the code, update the select-all note in `libs/ui/components/src/file-table/A11Y.md` to say it reads "checked" whenever every available file is selected. Verify by reading the file. Otherwise mark this task not applicable. _Not applicable: 1.2 changed no code, so A11Y.md is unchanged._

## 2. End-to-end coverage

- [x] 2.1 In `apps/demo-e2e/steps/file-table.steps.ts`, make the step `the {string} check box is checked` also assert `toHaveJSProperty('indeterminate', false)`, the same way the "not checked" step does. Verify with `pnpm nx lint demo-e2e`.
- [x] 2.2 In `apps/demo-e2e/features/file-table.feature`:
  - add `And the "Select all available files" check box is checked` after "Selected 2" in "Select all chooses every available file and clears them again"
  - add the same step after "Selected 2" in "Select all then download lists only the available files", before tabbing away
  - "Choosing files and downloading them with the keyboard only" already asserts "checked" after the last row is chosen with Space, and the stricter step from 2.1 now covers it

  Verify with `pnpm nx e2e demo-e2e`.

## 3. Integration check

- [x] 3.1 Run `pnpm nx run-many -t lint test -p ui-components demo` and confirm that everything passes. Then run `openspec validate select-all-checked-when-all-selected --strict` and confirm that it passes.
