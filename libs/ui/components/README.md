# @tins/ui-components

Framework-agnostic, accessible web components built with [Lit](https://lit.dev), styled with SCSS and
themed through the CSS custom properties of [`@tins/ui-tokens`](../tokens/README.md). Target:
WCAG 2.2 Level AAA (see each component's `A11Y.md`).

## Usage

With a bundler (Vite, Angular CLI, webpack, …), which resolves the package names and `lit`:

```js
import '@tins/ui-tokens/tokens.css'; // optional: themes; without it the light theme values apply
```

```html
<script type="module">
  import '@tins/ui-components/button'; // registers <tins-button> only
  import '@tins/ui-components/file-table'; // registers <tins-file-table> only
  // or: import '@tins/ui-components'; // everything
</script>

<tins-button>Save</tins-button>
```

- **Entry points:** `@tins/ui-components` (all), `@tins/ui-components/button`,
  `@tins/ui-components/file-table`.
  Import only what you use; each entry registers its element.
- **Registration is idempotent:** importing an entry twice (or two copies of the library) never throws.
  `define(tag, ctor)` is exported for custom registries.
- **Types:** each entry augments `HTMLElementTagNameMap`, so `document.querySelector('tins-button')` is typed as `TinsButton`.
- **Manifest:** `custom-elements.json` (Custom Elements Manifest), referenced from `package.json#customElements`.
- **Peer dependency:** `lit` ^3. `@tins/ui-tokens` is external too; without its CSS, components fall back to the default (light) theme values.
- **Angular:** add `CUSTOM_ELEMENTS_SCHEMA` and import the entry point.

### Plain HTML with an import map

The built files keep `lit` external (consumers share one copy), so they import it by its bare name.
A browser cannot resolve a bare name on its own: loading `file-table.js` from a static page with no
import map fails with `Failed to resolve module specifier "lit"`. Without a bundler, add an import
map. The example below assumes the server has:

- `/ui-components/`: the contents of `dist/libs/ui/components`
- `/ui-tokens/`: the contents of `dist/libs/ui/tokens`
- `/node_modules/`: the `lit`, `lit-html`, `lit-element` and `@lit/reactive-element` packages

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Files</title>
    <link rel="stylesheet" href="/ui-tokens/tokens.css" />
    <script type="importmap">
      {
        "imports": {
          "@tins/ui-components": "/ui-components/index.js",
          "@tins/ui-components/button": "/ui-components/button.js",
          "@tins/ui-components/file-table": "/ui-components/file-table.js",
          "lit": "/node_modules/lit/index.js",
          "lit/": "/node_modules/lit/",
          "lit-html": "/node_modules/lit-html/lit-html.js",
          "lit-html/": "/node_modules/lit-html/",
          "lit-element/": "/node_modules/lit-element/",
          "@lit/reactive-element": "/node_modules/@lit/reactive-element/reactive-element.js",
          "@lit/reactive-element/": "/node_modules/@lit/reactive-element/"
        }
      }
    </script>
    <script type="module">
      import '@tins/ui-components/file-table';
    </script>
  </head>
  <body>
    <tins-file-table
      files='[
        {"name":"agent.exe","device":"Birch","path":"\\\\srv\\share2\\agent.exe","status":"available"},
        {"name":"sync.exe","device":"Atlas","path":"\\\\srv\\share2\\sync.exe","status":"scheduled"}
      ]'
    ></tins-file-table>
  </body>
</html>
```

The import map must come before any module script. `src/plain-html.static.node.spec.ts` serves
exactly this layout from a plain Node HTTP server (not Vite), using the import map above, and checks
that `tins-file-table` registers, renders its rows and selects a file.

## Theming

Every color, space and size is a `--tins-*` custom property. Set one on any ancestor to restyle the
components beneath it, or switch the whole theme with `data-theme="light|dark|high-contrast"` on `<html>`:

```css
.brand-area {
  --tins-color-primary: #00376b;
}
```

Keep overrides at ≥7:1 contrast for text (≥4.5:1 large text) and ≥3:1 for borders and focus rings.

## `tins-button`

Renders a native `<button>` in its shadow root (focus is delegated to it). Takes part in forms via
`type="submit|reset"`, and becomes a toggle button with `toggle`.

```html
<tins-button>Save</tins-button>
<tins-button variant="secondary">Cancel</tins-button>
<tins-button toggle pressed>Bold</tins-button>
<tins-button label="Close"
  ><svg slot="icon" aria-hidden="true">…</svg></tins-button
>
<form>
  <tins-button type="submit" name="action" value="publish">Publish</tins-button>
</form>
```

### Attributes / properties

| Attribute  | Property   | Type                              | Default     | Description                                                        |
| ---------- | ---------- | --------------------------------- | ----------- | ------------------------------------------------------------------ |
| `variant`  | `variant`  | `'primary' \| 'secondary'`        | `'primary'` | Visual style.                                                      |
| `type`     | `type`     | `'button' \| 'submit' \| 'reset'` | `'button'`  | Form behaviour, as on a native button.                             |
| `disabled` | `disabled` | `boolean`                         | `false`     | Disables the button; skipped by Tab, ignores activation. Reflects. |
| `toggle`   | `toggle`   | `boolean`                         | `false`     | Makes it a toggle button exposing `aria-pressed`.                  |
| `pressed`  | `pressed`  | `boolean`                         | `false`     | Pressed state of a toggle button. Reflects.                        |
| `label`    | `label`    | `string`                          | –           | Accessible name. **Required** for icon-only buttons.               |
| `name`     | `name`     | `string`                          | –           | Name submitted with the form when this button submits it.          |
| `value`    | `value`    | `string`                          | `''`        | Value submitted with the form when this button submits it.         |

Read-only: `form` (owning `HTMLFormElement` or `null`).

### Methods

- `focus(options?)` – focuses the inner button.
- `click()` – activates the button (no-op while `disabled`).

### Events

| Event         | Detail                 | Description                                                                            |
| ------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `tins-change` | `{ pressed: boolean }` | Toggle buttons only, after `pressed` changes from user interaction. Bubbles, composed. |
| `click`       | –                      | Native click, re-targeted to the host. Not fired while disabled.                       |

### Slots

| Slot      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| (default) | Visible label.                                                  |
| `icon`    | Decorative icon before the label. Mark it `aria-hidden="true"`. |

### CSS parts

`button` (the native button), `label` (wrapper around the default slot).

### CSS custom properties

`--tins-color-primary`, `--tins-color-primary-hover`, `--tins-color-on-primary`, `--tins-color-surface`,
`--tins-color-focus-ring`, `--tins-target-size` (default 44px).

### Keyboard

| Key             | Action                                          |
| --------------- | ----------------------------------------------- |
| Tab / Shift+Tab | Move focus to / away from the button.           |
| Enter, Space    | Activate (toggle `pressed` for toggle buttons). |

## `tins-file-table`

A table of files from which the user selects the **available** ones and asks to download them.
The toolbar has a tri-state select-all checkbox, a live "Selected N" count and action buttons
("Download Selected" by default). The column headers and the actions are configurable. The component
owns the selection; what an action does is up to the host, which listens for `tins-action` (or
`tins-download` for the `download` action). The component never fetches, opens dialogs or calls `alert()`.

```html
<tins-file-table id="files" label="Collected files"></tins-file-table>
<script type="module">
  import { isDownloadable } from '@tins/ui-components/file-table';
  const table = document.getElementById('files');
  table.files = [
    {
      name: 'agent.exe',
      device: 'Birch',
      path: '\\srv\\share2\\apps\\bin\\agent.exe',
      status: 'available',
    },
    {
      name: 'sync.exe',
      device: 'Atlas',
      path: '\\srv\\share2\\apps\\bin\\sync.exe',
      status: 'scheduled',
    },
  ];
  table.addEventListener('tins-download', (e) => {
    // The component only sends available files; re-checking guards against stale or hand-made events.
    const files = e.detail.files.filter(isDownloadable);
    if (files.length) startDownload(files);
  });
</script>
```

Custom column names and actions:

```js
table.columns = [
  { key: 'device', label: 'Host' },
  { key: 'name', label: 'File' },
  { key: 'status', label: 'State' },
];
table.actions = [
  { id: 'download', label: 'Download', icon: 'download' },
  { id: 'quarantine', label: 'Quarantine' },
  { id: 'refresh', label: 'Refresh', requiresSelection: false },
];
table.addEventListener('tins-action', (e) => {
  if (e.detail.action === 'quarantine') quarantine(e.detail.files);
});
```

Angular: `<tins-file-table [files]="files" (tins-download)="onDownload($event)"></tins-file-table>` with
`CUSTOM_ELEMENTS_SCHEMA`.

### Data

`files` is an array of `FileEntry` objects: `{ name: string; device: string; path: string; status: string }`.

- Only **available** files can be selected and downloaded. A status is available when, trimmed and ignoring
  case, it is `available` (so `'Available'` and `' AVAILABLE '` count; `'unavailable'` does not). Any other
  status (`scheduled`, anything else, or a missing / non-string value) shows a disabled checkbox described as
  "Not available for download". `available` and `scheduled` are shown as "Available" and "Scheduled" in any
  case; other statuses are shown in sentence case, with `_` and `-` read as spaces (`IN_PROGRESS` →
  "In progress", `pending-review` → "Pending review"). Only the label is formatted: the objects you pass
  are never modified.
- `tins-download` and `selected` only ever contain files that are available when they are read, even if
  `files` changed after the user selected them.
- A file is identified by **device + path**. The selection follows the file when `files` is replaced, and is
  dropped for files that disappear or stop being available. List the same device + path only once.

### Attributes / properties

| Attribute | Property   | Type                   | Default                    | Description                                                                                                                                                                                                 |
| --------- | ---------- | ---------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `files`   | `files`    | `FileEntry[]`          | `[]`                       | Files to list, in display order. Set the property, or a JSON string attribute.                                                                                                                              |
| `label`   | `label`    | `string`               | `'Files'`                  | Accessible name of the table. Reflects.                                                                                                                                                                     |
| `columns` | `columns`  | `FileTableColumn[]`    | Name, Device, Path, Status | Columns after the selection column: `{ key, label }`. `key` is a file field (extra fields allowed); `status` gets the status label and dot. Empty or invalid → defaults. JSON attribute or property.        |
| `actions` | `actions`  | `FileTableAction[]`    | Download Selected          | Toolbar buttons: `{ id, label, icon?: 'download', requiresSelection?: boolean }` (`requiresSelection` defaults to `true`: disabled while nothing is selected). `[]` shows none. JSON attribute or property. |
| –         | `selected` | `readonly FileEntry[]` | `[]`                       | Read-only. Selected files in display order; a new frozen array on every read.                                                                                                                               |

### Events

| Event                   | Detail                                            | Description                                                                                                                            |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `tins-action`           | `{ action: string; files: readonly FileEntry[] }` | An action button was activated; `action` is its `id`. `files` is empty only for `requiresSelection: false` actions. Bubbles, composed. |
| `tins-download`         | `{ files: readonly FileEntry[] }`                 | The `download` action was activated, right after its `tins-action` (never while nothing is selected). Bubbles, composed.               |
| `tins-selection-change` | `{ selected: readonly FileEntry[] }`              | After every user change to the selection (not after `files` changes). Bubbles, composed.                                               |

### Functions and constants

| Export                 | Signature                                      | Description                                                                                                                  |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `isDownloadable(file)` | `(file: Pick<FileEntry, 'status'>) => boolean` | The component's availability rule (trimmed, case-insensitive `available`). Never throws. Use it to re-check `tins-download`. |
| `DEFAULT_COLUMNS`      | `readonly FileTableColumn[]`                   | The default columns, e.g. to extend: `[...DEFAULT_COLUMNS, { key: 'size', label: 'Size' }]`.                                 |
| `DEFAULT_ACTIONS`      | `readonly FileTableAction[]`                   | The default actions (`download`, "Download Selected").                                                                       |

### Slots

None.

### CSS parts

`toolbar`, `count` (the live "Selected N" text), `action-button` (every action button), `download-button`
(the `download` action), `table`, `row` (each data row),
`row-selected` (selected data rows), `status-dot` (the dot before "Available").

### CSS custom properties

`--tins-color-text`, `--tins-color-text-muted`, `--tins-color-surface`, `--tins-color-surface-raised`
(toolbar button hover), `--tins-color-row-hover` (hovered file rows), `--tins-color-row-selected`
(selected rows), `--tins-color-row-selected-hover` (selected rows while hovered), `--tins-color-border`, `--tins-color-primary`,
`--tins-color-on-primary`, `--tins-color-success` (status dot), `--tins-color-focus-ring`,
`--tins-target-size` (checkbox and button hit area, default 44px).

### Keyboard

| Key             | Action                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tab / Shift+Tab | Select-all → each enabled action button → table region (scrolls with arrows) → each available row's checkbox. Disabled rows are skipped. |
| Space, Enter    | Toggle the focused checkbox (select-all selects every available file, or clears when all are selected).                                  |
| Enter, Space    | Activate the focused action button.                                                                                                      |

Clicking anywhere on an available row also toggles it (unless you are selecting text in it).

## Development

| Command                      | What it does                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `npx nx build ui-components` | Custom Elements Manifest + Vite library build to `dist/libs/ui/components`        |
| `npx nx test ui-components`  | Vitest in headless Chromium, with axe (WCAG 2.2 A/AA/AAA) and coverage thresholds |
| `npx nx lint ui-components`  | ESLint incl. `eslint-plugin-lit` and `eslint-plugin-lit-a11y`                     |

Every component needs a `*.spec.ts` (enforced by `src/coverage.spec.ts` and coverage thresholds),
an `A11Y.md` manual review record, and a section in this README for every item in its manifest
entry (enforced by `src/readme.node.spec.ts`).
