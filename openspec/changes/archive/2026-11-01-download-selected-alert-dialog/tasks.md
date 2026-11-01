# Tasks

## 1. Alert dialog markup and behavior (demo page)

- [x] 1.1 In `apps/demo/src/app/pages/file-table.page.html`, add `role="alertdialog"` to the download `<dialog>`, give the summary `<p>` the id `download-dialog-summary`, and set `aria-describedby="download-dialog-summary download-dialog-files"`; verify in `pages.spec.ts` that the open dialog has role `alertdialog`, is labelled "Download requested", and its describedby ids resolve to the summary and the list
- [x] 1.2 Replace each `<li>` body with the labelled `<dl class="download-file">` (`Path:` then `Device:`) from design.md decision 4; update the existing unit test so items read `Path: <path> Device: <device>` for agent.exe and libcore.dll, and the "only available files from a tins-download event" test expects only agent.exe in the new format
- [x] 1.3 Add `autofocus` to the "Close" `tins-button` (fall back to focusing it after `showModal()` in `onDownload` if needed); verify with a unit test that after the download click `document.activeElement` is the Close `tins-button`
- [x] 1.4 Add a unit test in `pages.spec.ts` that selects only libcore.dll, clicks "Download Selected", and expects exactly one item `Path: \srv\share1\apps\bin\libcore.dll Device: Cedar` and the summary "These 1 file(s) would be downloaded:"; run `npx nx test demo` and verify all tests pass, including the existing axe check on the open dialog
- [x] 1.5 Style `.download-dialog .download-file` in `apps/demo/src/styles.scss` (bold `dt`, no `dd` indent, `overflow-wrap: anywhere` on the path); verify the page-level axe theme loop in `pages.spec.ts` still passes and the dialog shows wrapped paths at 320px in the running demo

## 2. End-to-end coverage

- [x] 2.1 Rename the step to `the download alert lists these files:` in `apps/demo-e2e/steps/file-table.steps.ts`, query `getByRole('alertdialog', { name: 'Download requested' })`, and assert items `Path: <path> Device: <device>` (whitespace-normalized); rename `the download dialog is closed` to `the download alert is closed`; update both scenarios in `file-table.feature` to match
- [x] 2.2 Add a step `the "Close" button in the download alert is focused` and use it in the keyboard-only download scenario right after pressing Enter
- [x] 2.3 Add a scenario "Choosing one file and downloading lists its path and device" (Tab to libcore.dll, Space, Shift+Tab to "Download Selected", Enter, alert lists only Cedar / libcore.dll path; Close via Enter on the focused Close button, then "Download Selected" is focused)
- [x] 2.4 Add a scenario that opens the alert at 320×800 and asserts the page has no horizontal scroll and every path is fully visible; run `npx nx e2e demo-e2e` and verify all file-table scenarios pass in Chromium and WebKit

## 3. Documentation

- [x] 3.1 Update `README.md` (demo row and "Key behaviour" paragraph) and the Keyboard / Accessibility notes on `file-table.page.html` to say the demo shows an alert dialog with the path and device of each requested file and focuses "Close"; check `docs/accessibility.md` for any download-dialog mention and align it; verify `npx nx test ui-components` (README node spec) still passes
- [x] 3.2 Run `openspec validate download-selected-alert-dialog --strict` and verify it reports no errors

## Workflow follow-up

- Archive the change after review to fold the `demo-app` delta into `openspec/specs/demo-app/spec.md`.
