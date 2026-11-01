# Tasks

## 1. Label formatting

- [x] 1.1 Update `statusLabel` in `libs/ui/components/src/file-table/file-table.ts` to format unknown statuses in sentence case (replace `_`/`-` with spaces, collapse whitespace, trim, lower-case, upper-case first code point), keeping the `KNOWN_LABELS` lookup and the non-string → `''` behaviour unchanged
- [x] 1.2 Update the `FileStatus` doc comment (line 6) to describe the new display rule

## 2. Tests

- [x] 2.1 In `libs/ui/components/src/file-table/file-table.spec.ts` ("tins-file-table status"), add cases for `IN_PROGRESS` → "In progress" (no dot, disabled checkbox), `pending-review` → "Pending review", `  failed   VERIFICATION ` → "Failed verification", and `__` / ` - ` → empty text
- [x] 2.2 Add a test that the `files` entry and the `tins-download` / `selected` data keep the original status string (e.g. a host-held `IN_PROGRESS` object is unchanged after render)
- [x] 2.3 Confirm the existing `quarantined` → "Quarantined", known-label, empty and non-string tests still pass unchanged

## 3. Docs

- [x] 3.1 Update the `files` paragraph in `libs/ui/components/README.md` ("other statuses are shown trimmed and capitalized") to describe sentence-case formatting with an example

## 4. Verify

- [x] 4.1 Run `pnpm nx test ui-components` and `pnpm nx lint ui-components` and fix any failures
- [x] 4.2 Run `openspec validate normalize-unknown-status-labels`
