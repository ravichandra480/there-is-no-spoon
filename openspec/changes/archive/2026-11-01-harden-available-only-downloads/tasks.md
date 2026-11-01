# Tasks

## 1. Shared availability predicate in the component

- [x] 1.1 In `libs/ui/components/src/file-table/file-table.ts`, add `normalizeStatus` and an exported `isDownloadable(file)` (trimmed, case-insensitive match on `available`; non-strings → `false`). Replace every use of the private `isSelectable` with it. Verify that `pnpm nx test ui-components` passes unchanged.
- [x] 1.2 Re-export `isDownloadable` from `libs/ui/components/src/file-table/index.ts`. Verify that `import { isDownloadable } from '@tins/ui-components/file-table'` type-checks in the demo (`pnpm nx run demo:build` or its typecheck target).
- [x] 1.3 Add unit tests to `file-table.spec.ts` for the "Status variants count as available" and "Look-alike statuses do not count" scenarios (`unavailable`, `available-soon`, `''`), plus "Malformed entry" and "Predicate matches the component" (`isDownloadable` agrees with the enabled checkboxes). Verify with `pnpm nx test ui-components`.
- [x] 1.4 Add a unit test for "Case-only status change keeps the selection" (`available` → `Available` keeps the row selected, emits no event). Verify with `pnpm nx test ui-components`.

## 2. Status labels

- [x] 2.1 Update `statusLabel` to use canonical labels for `available`/`scheduled`, keep trimmed-and-capitalized display for other strings, and return an empty label for non-strings. Show the dot based on `isDownloadable`. Add tests for "Known status in another case" (`AVAILABLE`, ` Scheduled `) and "Missing or non-string status" (`undefined`, `null`, `42` render without throwing, no dot). Verify that `pnpm nx test ui-components` passes, including the existing "capitalizes an unknown status" test.

## 3. Download never includes unavailable files

- [x] 3.1 Add unit tests for "Status changes just before download": select agent.exe and libcore.dll, assign new `files` with agent.exe `scheduled`, click "Download Selected" synchronously without awaiting `updateComplete`, and assert the `tins-download` detail is only libcore.dll. Also test "Every selected file became unavailable" (no event dispatched). Fix the code only if a test fails. Verify with `pnpm nx test ui-components`.

## 4. Library documentation

- [x] 4.1 Update the `tins-file-table` section of `libs/ui/components/README.md`. Describe the trimmed, case-insensitive matching rule, document `isDownloadable(file)`, and update the usage example so the `tins-download` listener filters with `isDownloadable`. Verify that `pnpm nx test ui-components` (including `readme.node.spec.ts`) and `pnpm nx lint ui-components` pass.

## 5. Demo host-side guard

- [x] 5.1 In `apps/demo/src/app/pages/file-table.page.ts`, filter `detail.files` with `isDownloadable` in `onDownload`, and return without opening the dialog when nothing is left. Update the `usage` snippet to show the same guard. Verify with `pnpm nx lint demo`.
- [x] 5.2 In `apps/demo/src/app/pages/pages.spec.ts`, add tests that dispatch a hand-built `tins-download` event: one with sync.exe and agent.exe (the dialog lists only agent.exe) and one with only scheduled files (no dialog opens). Verify with `pnpm nx test demo`.
- [x] 5.3 In `apps/demo-e2e/features/file-table.feature`, add a scenario for "Select all then download". Select all with the keyboard, activate "Download Selected", and assert the dialog lists exactly Birch/agent.exe and Cedar/libcore.dll. Reuse existing steps, so no new step definitions are expected. Verify with `pnpm nx e2e demo-e2e`.

## 6. Integration check

- [ ] 6.1 Run `npx nx run-many -t lint test build` and `npx nx e2e demo-e2e`. Then run `openspec validate harden-available-only-downloads --strict`. All of them must pass.
