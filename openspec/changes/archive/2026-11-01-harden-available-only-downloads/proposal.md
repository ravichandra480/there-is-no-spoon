# Proposal

## Why

Only files whose status is "available" can be downloaded. `<tins-file-table>` already applies this rule, but only to the exact lowercase string `available`. If a backend sends `"Available"` or `" available "`, every row becomes unselectable and nothing can be downloaded. The rule also lives only inside the component. Hosts receiving `tins-download` have no shared way to check it again, and the demo trusts the event detail without checking. Some guarantees in the spec (for example, that an unavailable file never appears in `tins-download`, even right after a status change) are not pinned down by tests.

## What Changes

- Statuses are compared with surrounding whitespace removed and case ignored. `available`, `Available`, `AVAILABLE` and ` available ` all count as available. Non-string or missing statuses never count as available and never throw.
- Known statuses are displayed with their canonical label ("Available", "Scheduled") whatever case they arrive in. Unknown statuses are still displayed trimmed and capitalized.
- The `@tins/ui-components/file-table` entry point exports a new pure helper, `isDownloadable(file)`. It is the same predicate the component uses, so hosts can apply the identical rule.
- The demo's download handler filters the event's files with `isDownloadable` as a second check and does not open the dialog if no file is left. The README usage example shows the same pattern.
- New spec scenarios and unit/e2e tests cover status variants, the stale-status race at download time, and the host guard. The existing behavior for exact `available`/`scheduled` data is unchanged.

Out of scope: an "N of M available" toolbar count, programmatic selection APIs, and any real file transfer.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `file-download-table`: "Only available files are selectable" now defines status matching as trimmed and case-insensitive, and adds the exported `isDownloadable` predicate. "Status display" uses canonical labels for known statuses. "Download selected action" guarantees that the event never carries a non-available file, even when the status changed just before activation.
- `demo-app`: the showcase's download handling re-checks availability before listing files in the dialog.

## Impact

- `libs/ui/components/src/file-table/file-table.ts`: the `isSelectable`/`statusLabel` logic, plus the new `isDownloadable` export.
- `libs/ui/components/src/file-table/index.ts`: re-exports `isDownloadable`. This is an additive public API change, so no breaking change.
- `libs/ui/components/src/file-table/file-table.spec.ts`: new tests.
- `libs/ui/components/README.md`: documents the matching rule, `isDownloadable` and the host guard.
- `apps/demo/src/app/pages/file-table.page.ts`, `apps/demo/src/app/pages/pages.spec.ts`: host-side guard and its test.
- `apps/demo-e2e/features/file-table.feature`: an assertion that the dialog lists only available files after Select all.
