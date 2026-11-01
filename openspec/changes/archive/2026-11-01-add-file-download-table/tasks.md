# Tasks

## 1. Design token

- [x] 1.1 Add `color-success` to every theme map in `libs/ui/tokens/src/scss/_themes.scss` (light, dark, high-contrast, forced-colors) and register it as a non-text pair (≥ 3:1) against `color-surface` and `color-surface-raised` in `libs/ui/tokens/src/lib/contrast-pairs.ts`; verify `npx nx test ui-tokens` passes and the generated CSS contains `--tins-color-success` per theme
- [x] 1.2 Document the new token in `libs/ui/tokens/README.md`; verify the tokens readme spec (`readme.spec.ts`) still passes

## 2. Component scaffold and packaging

- [x] 2.1 Create `libs/ui/components/src/file-table/` with `file-table.ts` (empty `TinsFileTable` Lit class with JSDoc `@tag tins-file-table`), `file-table.styles.scss`, and `index.ts` (calls `define`, exports types `FileEntry`, `FileStatus`, `TinsDownloadDetail`, `TinsSelectionChangeDetail`, augments `HTMLElementTagNameMap` and `HTMLElementEventMap`); verify `npx nx run ui-components:lint` passes
- [x] 2.2 Wire the entry point: add `file-table` to `vite.config.mts` entries, `./file-table` to `package.json` `exports` and `sideEffects`, and re-export from `src/index.ts`; verify `npx nx build ui-components` emits `dist/libs/ui/components/file-table.js` and `file-table/index.d.ts`

## 3. Rendering and status display

- [x] 3.1 Implement `files` and `label` properties and render the toolbar, the labelled scrollable region, and the native table (selection column + Name, Device, Path, Status `<th scope="col">`), one row per file, and the "No files" empty state; add unit tests for the sample data (six rows, order, cell text), header semantics, empty list, and plain-script property assignment; verify `npx nx test ui-components` passes
- [x] 3.2 Render status as capitalized text with an `aria-hidden` green dot for `available` only, and treat unknown statuses as not available; add unit tests for available, scheduled and unknown status; verify tests pass
- [x] 3.3 Style per the design in `file-table.styles.scss` with tokens only (toolbar, row separators, ≥ 44px rows, wrapping paths, status dot, forced-colors rules, reduced-motion); verify visually in the demo page from group 6 and by the axe contrast checks in 4.4

## 4. Selection behavior

- [x] 4.1 Implement the selection model (key `device + path`, `Set` state, pruning of stale keys on `files` change, read-only `selected` getter in display order) and row checkboxes that are enabled only for `available` rows, named "Select <name>", with disabled rows described as "Not available for download"; add unit tests for selecting, disabled rows ignored (checkbox and row click), and pruning after data change; verify tests pass
- [x] 4.2 Implement select-all tri-state (`.checked`/`.indeterminate` with `live()`, select-all vs clear rule, disabled when nothing is selectable) and the `role="status"` count ("None selected" / "Selected N"); add unit tests for each transition, the mixed state, the disabled case, and count text; verify tests pass
- [x] 4.3 Implement row-click toggling on selectable rows with the checkbox double-toggle guard and the text-selection guard; add unit tests for clicking a non-checkbox cell and for an active text selection; verify tests pass
- [x] 4.4 Add the accessibility test block: axe WCAG 2.2 A/AA/AAA scans for states none / partial / all selected / empty / nothing selectable, `assertTargetSize` and `assertFocusVisible` on select-all, an enabled row checkbox, and the download button; verify tests pass with no exclusions

## 5. Download action and events

- [x] 5.1 Implement the "Download Selected" native button with decorative SVG, disabled when the selection is empty, dispatching `tins-download` `{ files }` (bubbles, composed), and dispatch `tins-selection-change` `{ selected }` on every user-initiated selection change; add unit tests for payload contents/order, `composed`, no event when disabled, and one event per select-all; verify tests pass
- [x] 5.2 Add a keyboard test with `userEvent`: Tab order skips disabled rows (lands on agent.exe and libcore.dll only), Space toggles, Enter on "Download Selected" emits the event; verify tests pass
- [x] 5.3 Complete JSDoc (`@fires`, `@csspart`, `@cssprop`, property docs), regenerate `custom-elements.json`, add a `tins-file-table` section to `libs/ui/components/README.md` (usage in plain HTML and Angular, data shape, events, parts, key-collision note), and write `src/file-table/A11Y.md` following the button record; verify `npx nx build ui-components` produces a manifest listing the tag, properties, events and parts, and `readme.node.spec.ts` passes

## 6. Demo page

- [x] 6.1 Add the `file-table` route to `apps/demo/src/app/routes.manifest.json` (element `tins-file-table`) and `app.routes.ts`, and create `pages/file-table.page.ts/html` with the sample data bound via `[files]`, usage snippet, keyboard/a11y notes, and a native `<dialog>` opened from `(tins-download)` listing "device — path" for each file with a heading and Close button; verify `npx nx serve demo` shows the page and the dialog
- [x] 6.2 Extend `apps/demo/src/app/pages/pages.spec.ts` for the new page (six rows rendered, dialog opens with the selected files on `tins-download`); verify `npx nx test demo` passes

## 7. End-to-end coverage

- [x] 7.1 Add `/file-table` rows to every `@per-route` Examples table in `apps/demo-e2e/features/*.feature`; verify `npx nx run demo-e2e:bddgen` succeeds and the route-coverage scenario passes
- [x] 7.2 Add `features/file-table.feature` with a keyboard-only scenario (select agent.exe and libcore.dll, activate Download Selected, dialog lists both devices and paths, Escape closes and focus returns) and a 320px reflow scenario, plus any new steps in `steps/file-table.steps.ts`; verify `npx nx e2e demo-e2e` passes in Chromium, Firefox and WebKit

## 8. Documentation and integration

- [x] 8.1 Update the root `README.md` with prerequisites, install, run-demo, unit-test and e2e commands, and a short description of the file table component and where its code and tests live; verify by following the steps from a fresh clone
- [x] 8.2 Run `npm run verify` and `npx nx run-many -t lint test build` and `npx nx e2e demo-e2e`; verify all pass
- [x] 8.3 Verify a fresh clone into a scratch directory with `npm ci && npx nx test ui-components`

## Workflow follow-up

- Complete the manual screen reader review in `src/file-table/A11Y.md` (NVDA + Firefox, VoiceOver + Safari) before archiving, as `accessibility-compliance` requires.
- Archive the change with `/opsx:archive` once implementation and review are complete.
