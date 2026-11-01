# Tasks

## 1. Unit coverage and fix

- [x] 1.1 In `libs/ui/components/src/file-table/file-table.spec.ts`, under "tins-file-table select-all and count", add one test per scenario of "Select-all is unchecked when nothing is selected". Each test asserts `selectAll(el).checked === false` and `selectAll(el).indeterminate === false`, plus "None selected" where the scenario says so. Cover the initial render, unchecking the last row's checkbox, a row click, select-all followed by unchecking rows one by one, clearing with select-all, a `files` replacement that drops every selected file, and a replacement with no available files (also assert `disabled`). Verify with `pnpm nx test ui-components`.
- [x] 1.2 If any test from 1.1 fails, fix the select-all rendering in `libs/ui/components/src/file-table/file-table.ts` so that `checked` and `indeterminate` are both false whenever the selection is empty, without changing the partial or all behavior. Verify that `pnpm nx test ui-components` passes, including the existing tri-state tests. If every test already passed, record that in this task and change no code. _Result: all 7 new tests passed against the existing implementation, so no code changed._
- [x] 1.3 If 1.2 changed the code, update `libs/ui/components/src/file-table/A11Y.md` so its select-all note says it reads "not checked" whenever nothing is selected. Verify by reading the file. _Not applicable: 1.2 changed no code, so A11Y.md is unchanged._

## 2. End-to-end coverage

- [x] 2.1 In `apps/demo-e2e/steps/file-table.steps.ts`, add a step `the {string} check box is not checked` that asserts both `not.toBeChecked()` and `indeterminate === false`. Verify that the e2e lint/type-check passes (`pnpm nx lint demo-e2e`).
- [x] 2.2 In `apps/demo-e2e/features/file-table.feature`, add the new step:
  - after "None selected" in "Select all chooses every available file and clears them again"
  - in "Files that are not available cannot be chosen" (initial state)
  - in a new scenario that selects agent.exe with Space, unchecks it with Space, and expects "None selected" with select-all not checked

  Verify with `pnpm nx e2e demo-e2e`.

## 3. Integration check

- [x] 3.1 Run `pnpm nx run-many -t lint test` for `ui-components` and `demo` and confirm that everything passes, and run `openspec validate select-all-unchecked-when-none-selected --strict` and confirm that it passes.
