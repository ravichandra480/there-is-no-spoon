# Design

## Context

`FileTablePage` (`apps/demo/src/app/pages/file-table.page.ts`) listens for `tins-download` on `#sample-files`, filters `detail.files` with `isDownloadable`, stores the result in the `requested` signal and calls `showModal()` on a native `<dialog class="download-dialog" aria-labelledby="download-dialog-title">`. Each `<li>` renders `<strong>{{device}}</strong> — <code>{{path}}</code>`. The dialog closes with Escape (native) or a `tins-button` "Close" that calls `close()`; the browser returns focus to the previously focused element, which is the "Download Selected" button inside the table's shadow root. The `file-download-table` spec forbids the component from showing dialogs, so all of this stays in the host.

## Goals / Non-Goals

**Goals:**
- Expose the existing modal as an alert dialog with a name, a description and a predictable initial focus.
- Show path and device as labelled values for one or many files.

**Non-Goals:**
- Using `window.alert()` (declined by the user: no styling, no themes, no axe coverage, and it blocks the test runner).
- Any change to `tins-file-table`, its events or its public entry point.
- Real file transfer.

## Decisions

1. **Keep the native `<dialog>` + `showModal()`, add `role="alertdialog"`.** ARIA in HTML allows `alertdialog` on `<dialog>`. `showModal()` already gives top-layer rendering, an inert background, Escape handling and focus return on close, so no focus-trap code is added. *Alternative*: a custom `div` with a focus trap — more code and more risk for no gain.

2. **Accessible description via `aria-describedby="download-dialog-summary download-dialog-files"`.** The summary `<p>` and the `<ul>` get ids; screen readers then read the count and every path/device on open, which is what makes it an "alert". *Alternative*: a live region — would double-announce together with the dialog role.

3. **Initial focus on "Close" with `autofocus`.** `alertdialog` guidance is to focus the least destructive control; "Close" is the only one. Because "Close" is a `tins-button` (focus lives in its shadow `<button>`), put `autofocus` on the host element; `tins-button` attaches its shadow root with `delegatesFocus: true` (`libs/ui/components/src/button/button.ts:38`), so focus lands on the inner `<button>`. If a browser in the e2e matrix ignores `autofocus` on a custom element in a dialog, fall back to calling `focus()` on the `tins-button` right after `showModal()` in `onDownload`.

4. **List item markup: a small definition list per file.**
   ```html
   <li>
     <dl class="download-file">
       <div><dt>Path:</dt><dd><code>{{ file.path }}</code></dd></div>
       <div><dt>Device:</dt><dd>{{ file.device }}</dd></div>
     </dl>
   </li>
   ```
   Labels are visible, path comes first (the request asks for "path and device"), and whitespace-normalized `textContent` is `Path: <path> Device: <device>`. The colon is in the text rather than CSS generated content so tests and screen readers see the same string. *Alternative*: plain "Path: … · Device: …" text in one line — harder to style and wrap at 320px.

5. **Styling.** Reuse `.download-dialog li { overflow-wrap: anywhere }` for the path; lay each `dl > div` out as a row with `dt` in bold and no default `dd` indent. Tokens only; no new theme tokens are needed since only existing text colors are used.

## Risks / Trade-offs

- [Item text format changes break existing unit/e2e assertions] → Update `pages.spec.ts` and the `the download dialog lists these files:` step in the same change; rename the step wording to "download alert".
- [`aria-describedby` reading long paths is verbose] → Acceptable for a demo of two files; the content is exactly what the user asked to be told.
- [axe rule `aria-allowed-role` on `<dialog role="alertdialog">`] → Allowed by ARIA in HTML; the existing axe check on the open dialog will catch it if the axe version disagrees.
- [Focus return target is inside a shadow root] → Already covered by the existing e2e assertion "the Download Selected button is focused"; kept.
