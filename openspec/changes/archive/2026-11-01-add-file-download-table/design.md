# Design

## Context

The workspace is an Nx monorepo of framework-agnostic Lit web components (`libs/ui/components`, tags `tins-*`), themed by SCSS design tokens (`libs/ui/tokens`) and showcased in an Angular demo (`apps/demo`) that consumes them only through public entry points. Existing specs (`web-component-library`, `demo-app`, `accessibility-compliance`) already require for every component: a per-component entry point, a Custom Elements Manifest entry, typed tag/event maps, browser-mode unit tests with axe WCAG 2.2 AAA scans per state, 44×44 targets, visible ≥ 2px focus, forced-colors support, a demo page, per-route e2e coverage and an `A11Y.md` review record. `tins-button` and `tins-text-field` are the reference implementations. See proposal.md for motivation and `specs/file-download-table/spec.md` for behavior.

## Goals / Non-Goals

**Goals:**

- One self-contained element, `tins-file-table`, whose only required input is the `files` array.
- Behavior driven by native HTML semantics (`<table>`, `<input type="checkbox">`, `<button>`) so keyboard and screen reader support come mostly from the platform.
- Selection state owned by the component, observable through events and a read-only property; side effects (downloading, dialogs) owned by the host.

**Non-Goals:**

- Sorting, filtering, pagination, column configuration, or virtualization for very large lists.
- A pluggable selectability rule (e.g. an `isSelectable` callback). Selectable is fixed to `status === 'available'`; it can be added later without changing the event contract.
- Controlled selection from the host (setting the selection by property). The selection is read-only from outside in this change.
- Actually transferring files.

## Decisions

### 1. Lit custom element in the existing library, not Ember or an Angular component

The repository is already built around Lit web components consumed by an Angular host; a custom element is the most reusable option (works in plain HTML, Angular, React, Ember). It follows the `tins-button` structure: `src/file-table/{file-table.ts, file-table.styles.scss, index.ts, file-table.spec.ts, A11Y.md}`, with `define('tins-file-table', …)` in `index.ts`, plus `HTMLElementTagNameMap` and `HTMLElementEventMap` augmentations.

### 2. Native table and checkboxes instead of an ARIA `grid`

A `role="grid"` with roving focus would give arrow-key cell navigation but requires re-implementing focus management, and screen reader support for grids is uneven. The content is a read-only data table whose only interactive elements are checkboxes and one button, which is exactly what a native `<table>` with `<th scope="col">` and native checkboxes expresses. Tab order comes for free, disabled checkboxes drop out of the tab order automatically, and `indeterminate` is exposed as "mixed" by browsers without ARIA.

Alternative considered: `role="grid"` per the APG data-grid pattern — rejected for the complexity and risk listed above.

### 3. Selection model

- Internal state is a `Set` of row keys. A row's key is `${device}\u0000${path}` (the sample data has no id field; device + path identifies a file on a host). Using index as key was rejected because replacing `files` would silently move the selection to different files.
- In `willUpdate`, when `files` changes, keys that no longer exist or whose file is no longer `available` are pruned (spec: "Data change drops stale selection"). Derived values (selectable rows, selected rows in display order, select-all state) are computed once per update.
- `selected` getter returns a fresh array of the selected file objects in display order (frozen shallow copy so consumers cannot mutate internal state).
- Selection changes made by the user dispatch `tins-selection-change` `{ selected }`; pruning caused by a data change does not dispatch (it is not user-initiated) but the count still updates.

### 4. Select-all tri-state

Bound with Lit property bindings: `.checked=${all}` and `.indeterminate=${some && !all}` (indeterminate is a property, not an attribute), using `live()` so the DOM is corrected even after a native click toggled it. Activation: if every selectable row is selected → clear; otherwise → select all selectable. Disabled when there are no selectable rows.

### 5. Row click as pointer convenience only

A `click` listener on each selectable `<tr>` toggles the row unless the event came from the checkbox/label itself (prevents double toggle) or the user has a non-empty text selection (lets users copy paths). The `<tr>` gets no `tabindex` or role: keyboard and AT users use the checkbox, which avoids nested-interactive violations and duplicate tab stops. `cursor: pointer` is applied only to selectable rows.

### 6. Accessible names, status messages and disabled reason

- Row checkbox: `aria-label="Select <name>"`. Select-all: `aria-label="Select all available files"`; the visible "Selected N" text is separate.
- Count text lives in a persistent `role="status"` element (polite live region) so changes are announced without moving focus (WCAG 4.1.3). It is rendered from the first paint so later changes are announced reliably.
- Disabled rows: checkboxes are `disabled` with `aria-describedby` pointing at one visually hidden element in the shadow root reading "Not available for download". Shadow-scoped ids make this safe with multiple instances on a page.
- The table is named by `aria-label` from the `label` property (default "Files"), and the horizontal scroll wrapper is `role="region"` `tabindex="0"` with the same name, so it is keyboard-scrollable (axe `scrollable-region-focusable`).
- The status dot is a `<span aria-hidden="true">`; the text carries the meaning (WCAG 1.4.1).

### 7. Download action and events

"Download Selected" is a native `<button type="button">` in the toolbar with an inline decorative SVG icon. It is `disabled` when the selection is empty. On click it dispatches `tins-download` with `{ files: selected }`, `bubbles: true, composed: true`. The component never calls `alert()`, `fetch`, or opens UI; the demo host decides what "download" means.

Alternative considered: composing `tins-button` inside the shadow root. Rejected for now because the design's borderless toolbar button would need a new `tins-button` variant (scope creep in another component) and cross-component styling through parts; a plain native button keeps `tins-file-table` self-contained. Revisit if a "ghost" button variant is added later.

### 8. Styling and tokens

- SCSS `file-table.styles.scss` using `tokens.token(...)` and the shared `_host.scss`, matching the design: light toolbar row, thin row separators, selected/hover rows on `color-surface-raised`, blue checkboxes in `color-primary`.
- Checkboxes use `appearance: none` with a custom box, check and indeterminate dash so they match the design and have a 3:1 boundary; each checkbox sits in a `<label>` sized at least 44×44 so the hit target meets WCAG 2.5.5. Focus uses the existing 3px `color-focus-ring` outline with offset. Forced-colors: boxes `ButtonBorder`, checked `Highlight`, focus `Highlight`, selected row outline so selection stays visible.
- New theme token `color-success` for the dot (light `#2e7d32`, dark `#81c784`, high-contrast `#00ff00`, forced-colors `CanvasText`), added to `_themes.scss` and to the token contrast test with a ≥ 3:1 non-text check against `color-surface` and `color-surface-raised`. The originally sketched light green (~2:1 on white) fails 3:1, so the shade is darkened deliberately.
- Paths use `overflow-wrap: anywhere` so long paths wrap. Rows are at least 44px tall. Transitions are disabled under `prefers-reduced-motion` via the existing `motion-duration` token.

### 9. Narrow screens

The table sits in a horizontally scrollable, focusable region; the toolbar uses `flex-wrap`. WCAG 1.4.10 explicitly allows two-dimensional scrolling for data tables. Alternative considered: re-flowing rows into stacked cards with `display: block` on table elements — rejected because changing `display` on table elements strips table semantics in WebKit, and restoring them needs explicit ARIA roles on every element.

### 10. Packaging

Add `'file-table': 'src/file-table/index.ts'` to `vite.config.mts` entries, a `./file-table` entry in `package.json` `exports` (and `sideEffects`), re-export from `src/index.ts`, and regenerate `custom-elements.json` from the JSDoc (`@tag`, `@fires`, `@csspart`, `@cssprop`). CSS parts: `toolbar`, `count`, `download-button`, `table`, `row`, `status-dot`.

### 11. Demo page and tests

- Demo: `file-table` route in `routes.manifest.json` (element `tins-file-table`), lazy page `file-table.page.ts/html` binding `[files]` to the sample data with `CUSTOM_ELEMENTS_SCHEMA`, a `(tins-download)` handler that fills and `showModal()`s a native `<dialog>` with a heading, a list of "device — path" entries and a Close button. Native modal dialogs trap focus, close on Escape and return focus to the opener.
- Unit (`file-table.spec.ts`, Vitest browser mode): rendering of the sample data, empty state, unknown status, each selection state (none / partial / all / none selectable) with axe AAA scans, target-size and focus checks on checkboxes and the button, select-all transitions, row-click and text-selection guard, disabled rows ignored, event payloads and `composed`, keyboard flow with `userEvent`, stale-selection pruning on data change, `label` property.
- Demo unit: page renders the element with six rows; dialog opens on `tins-download` and lists the files.
- E2E: add `/file-table` to every `@per-route` Examples table (route-coverage fails otherwise); a new `file-table.feature` with a keyboard-only select-and-download scenario that checks the dialog contents, and a 320px reflow check.

## Risks / Trade-offs

- [Live region inside shadow DOM may be announced inconsistently by some screen readers] → Keep the region persistent and text-only; verify with NVDA+Firefox and VoiceOver+Safari in the A11Y record.
- [Custom-drawn checkboxes can lose visibility in forced-colors mode] → Explicit `@media (forced-colors: active)` rules using system colors; covered by the existing forced-colors e2e spec.
- [Device + path key collides if the same file is listed twice for one device] → Acceptable for this data model; documented in the component README. A future optional `id` field can take precedence without breaking the API.
- [Row click toggling may surprise users who click to copy text] → Guarded by the non-empty text-selection check; checkbox remains the primary affordance.
- [Fixed selectability rule limits reuse for other statuses] → Documented non-goal; the event and property contract stays the same if a rule property is added later.

## Migration Plan

Additive only: a new entry point and a new token. No existing API changes; nothing to roll back beyond reverting the change.
