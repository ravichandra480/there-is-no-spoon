# Tasks

## 1. Unit coverage and fix

- [x] 1.1 In `libs/ui/components/src/file-table/file-table.spec.ts`, add a `describe('tins-file-table select-all is indeterminate when some but not all selectable files are selected')` block right after the "checked when every selectable file is selected" block. Give it an `expectPartial` helper that asserts `selectAll(el).indeterminate === true` and `selectAll(el).checked === false`, and a local three-available fixture (for example `alpha.exe`, `beta.exe`, `gamma.exe` as `available` plus one `scheduled` file). Add one test per scenario of the new requirement, awaiting `el.updateComplete` before each assertion:
  - agent.exe checked with its checkbox (also assert "Selected 1")
  - a non-checkbox cell of the libcore.dll row clicked
  - Space on the focused agent.exe checkbox, using `userEvent.keyboard(' ')` as the existing keyboard tests do (also assert "Selected 1")
  - select-all, then agent.exe unchecked with its checkbox (also assert "Selected 1")
  - select-all, then the libcore.dll row clicked
  - three-file fixture with two selected (assert "Selected 2")
  - three-file fixture with two selected, then `files` replaced so one selected file is removed, and separately so it becomes `scheduled` (assert "Selected 1")
  - sample data with every available file selected is checked, not partial (scheduled files do not count)
  - from a partial selection, select-all activated by `click()` and, separately, by Space, ends checked and not indeterminate with both available files selected

  Verify with `pnpm nx test ui-components`.
- [x] 1.2 If any test from 1.1 fails, fix the select-all rendering in `libs/ui/components/src/file-table/file-table.ts`. When some but not all selectable files are selected, `indeterminate` must be true and `checked` false, with the unchecked and checked behavior unchanged. Verify that `pnpm nx test ui-components` passes, including the existing tri-state, "unchecked when nothing is selected" and "checked when every selectable file is selected" tests. If every test already passed, record that result in this task and change no code. _Result: all 11 new tests passed against the existing implementation (192/192 in the suite), so no code changed._
- [x] 1.3 If 1.2 changed the code, update the select-all note in `libs/ui/components/src/file-table/A11Y.md` to say it reads "mixed" whenever some but not all available files are selected. Verify by reading the file. Otherwise mark this task not applicable. _Not applicable: 1.2 changed no code, so A11Y.md is unchanged._

## 2. End-to-end coverage

- [x] 2.1 In `apps/demo-e2e/steps/file-table.steps.ts`, make the step `the {string} check box is partly checked` also assert `toHaveJSProperty('checked', false)`, alongside its existing `indeterminate` check. Verify with `pnpm nx lint demo-e2e`.
- [x] 2.2 In `apps/demo-e2e/features/file-table.feature`, add a scenario "Unchecking one file after select all leaves select all partly checked": Tab to "Select all available files", press Space, assert "Selected 2" and checked, Tab to "Select agent.exe", press Space, then assert "Selected 1" and that select-all is partly checked. Then press Shift+Tab back to select-all, press Space, and assert "Selected 2" and checked. The existing scenarios "Unchecking the only chosen file…" and "Choosing files and downloading them with the keyboard only" already reach the partial state with Space, and the stricter step from 2.1 now covers them. Verify with `pnpm nx e2e demo-e2e`. _Added the step `the user presses Shift+Tab until the {string} check box is focused` (mirrors the Tab variant) to move back to select-all. 37/37 e2e tests pass._

## 3. Integration check

- [x] 3.1 Run `pnpm nx run-many -t lint test -p ui-components demo` and confirm that everything passes. Then run `openspec validate select-all-indeterminate-when-partially-selected --strict` and confirm that it passes.
