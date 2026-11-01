# Proposal

## Why

When a user activates "Download Selected" on the `/file-table` showcase, they should immediately get an alert that tells them exactly which files were requested: the path and the device of every selected file, whether they chose some of the available files or all of them. The demo already opens a modal `<dialog>` with a "device — path" list, but it is exposed as a plain dialog, it is not announced as an alert, and its spec does not pin down that the path and the device are both shown for the partial-selection case. This change turns that dialog into a proper alert dialog with an explicit, testable content contract.

## What Changes

- The showcase's "Download requested" modal becomes an **alert dialog** (`role="alertdialog"`): it keeps its title as its accessible name, gains an accessible description that covers the summary line and the file list, and moves focus to its "Close" button when it opens.
- Each listed file shows its **path** and its **device**, each with a visible label ("Path", "Device"), in display order. Replaces the current unlabelled "device — path" text. **BREAKING** for the demo's own unit and e2e assertions only (list item text changes); no public library API changes.
- The alert appears for any non-empty selection: one available file (some selected) or every available file (all selected).
- Closing behavior is unchanged: "Close" or Escape closes the alert and focus returns to "Download Selected".
- The file table component is **not** changed. Its spec already forbids it from showing dialogs; it keeps emitting `tins-download` and the demo host shows the alert.
- Unchanged: the host still re-checks files with `isDownloadable` and shows no alert when none pass.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `demo-app`: "Showcase download lists only available files" is replaced by a requirement that the showcase shows an alert dialog listing the path and device of every selected available file for a partial or full selection, with defined accessible name, description, initial focus and dismissal. "End-to-end test coverage" now names Chromium and WebKit only (Firefox was dropped from the Playwright config), and its keyboard-only scenario is reworded to say "closing the download alert".

## Impact

- `apps/demo/src/app/pages/file-table.page.html` / `.ts`: dialog role, ARIA wiring, labelled list item markup, initial focus.
- `apps/demo/src/styles.scss`: styling for the labelled path/device lines in `.download-dialog`.
- `apps/demo/src/app/pages/pages.spec.ts`: updated dialog assertions; new partial-selection case.
- `apps/demo-e2e/features/file-table.feature` and `steps/file-table.steps.ts`: query `alertdialog` by name, new item text format, partial-selection scenario, focus-on-open check.
- `docs/accessibility.md` if it describes the download dialog.
- No change to `libs/ui/components` or its public API.
