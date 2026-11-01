# Proposal

## Why

The library has form primitives (`tins-button`, `tins-text-field`) but no data-display component. A common need is a list of files the user can pick from and download in bulk: a table with per-row checkboxes, a select-all control with an indeterminate state, a live "Selected N" count and a "Download Selected" action. Building it as a reusable, framework-agnostic custom element lets any host (the Angular demo, plain HTML, other frameworks) drop it in with nothing but data.

## What Changes

- Add a new Lit custom element, `tins-file-table`, to `@tins/ui-components`, published as its own entry point `@tins/ui-components/file-table`.
  - Accepts a `files` array of `{ name, device, path, status }` objects (property only; also settable from JSON for plain-HTML use).
  - Renders a native, accessible data table with columns **Name**, **Device**, **Path**, **Status**, plus a leading selection column.
  - Toolbar above the table: a select-all checkbox (unchecked / indeterminate / checked), a "Selected N" / "None selected" count announced politely to assistive technology, and a "Download Selected" button.
  - Only files whose `status` is `available` can be selected. Rows with any other status (e.g. `scheduled`) show a disabled checkbox with an accessible explanation. Select-all acts on the selectable rows only.
  - Available files show a green status dot as a supplementary cue next to the "Available" text (color is never the only signal).
  - Selected rows are visually highlighted; clicking anywhere on a selectable row toggles it (pointer convenience on top of the checkbox).
  - "Download Selected" is disabled when nothing is selected. When activated it fires a bubbling, composed `tins-download` event carrying the selected files; the component performs no I/O itself. A `tins-selection-change` event fires whenever the selection changes.
- Add a "File table" showcase page to the Angular demo with the sample data, which listens for `tins-download` and shows an accessible modal dialog listing the device and path of each selected file.
- Add unit tests (browser mode, axe AAA scans per state, keyboard, events), e2e coverage for the new route, and an A11Y review record, as the existing specs require for every component.
- Update the root README with prerequisites and run/test instructions for new contributors.

## Capabilities

### New Capabilities

- `file-download-table`: the `tins-file-table` component's behavior — data input, rendering of columns and status, selection rules (available-only, select-all tri-state, count), the download action and its events, and component-specific accessibility behavior.

### Modified Capabilities

<!-- None. The existing `web-component-library`, `demo-app` and `accessibility-compliance` requirements already apply to every component and showcase page generically; this change satisfies them without changing them. -->

## Impact

- **Code**: new `libs/ui/components/src/file-table/` (component, styles, tests, `A11Y.md`); `src/index.ts`, `package.json` `exports`/`sideEffects`, and `vite.config.mts` entries for the new entry point; regenerated `custom-elements.json`.
- **Tokens**: likely one new theme token for the "success/available" indicator color (must meet ≥ 3:1 non-text contrast in every theme), plus a selected-row background if `color-surface-raised` is not sufficient.
- **Demo**: new route in `routes.manifest.json`, `app.routes.ts`, and a `file-table.page.*`.
- **E2E**: new route automatically picked up by `@per-route` outlines; examples tables updated; keyboard scenario for selecting and downloading.
- **Dependencies**: none added (Lit is already a peer dependency).
- **Docs**: root README, `libs/ui/components/README.md`.
