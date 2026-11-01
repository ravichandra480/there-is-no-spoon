import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { live } from 'lit/directives/live.js';
import { scss } from '../shared/styles.js';
import styles from './file-table.styles.scss?inline';

/**
 * Known statuses. Any other string is shown in sentence case (`IN_PROGRESS` → "In progress") and
 * treated as not available.
 */
export type FileStatus = 'available' | 'scheduled' | (string & {});

/** One row of the table. */
export interface FileEntry {
  name: string;
  device: string;
  path: string;
  status: FileStatus;
}

export interface TinsDownloadDetail {
  /** The selected files, in display order. */
  files: readonly FileEntry[];
}

/** A column of the table: which file field it shows and its header text. */
export interface FileTableColumn {
  /** Field of each file shown in this column. `status` gets the status label and dot. */
  key: keyof FileEntry | (string & {});
  /** Header text (also how screen readers name the column's cells). */
  label: string;
}

/** A button in the toolbar that acts on the selected files. */
export interface FileTableAction {
  /** Identifier sent in `tins-action` (`detail.action`). Use `download` to also fire `tins-download`. */
  id: string;
  /** Visible text and accessible name of the button. */
  label: string;
  /** Built-in icon shown before the label. */
  icon?: 'download';
  /** Whether the button needs at least one selected file (default `true`). */
  requiresSelection?: boolean;
}

export interface TinsActionDetail {
  /** The `id` of the activated action. */
  action: string;
  /** The selected files, in display order (may be empty when `requiresSelection` is `false`). */
  files: readonly FileEntry[];
}

export interface TinsSelectionChangeDetail {
  /** The selected files after the change, in display order. */
  selected: readonly FileEntry[];
}

/** Columns shown when `columns` is not set: Name, Device, Path, Status. */
export const DEFAULT_COLUMNS: readonly FileTableColumn[] = Object.freeze([
  { key: 'name', label: 'Name' },
  { key: 'device', label: 'Device' },
  { key: 'path', label: 'Path' },
  { key: 'status', label: 'Status' },
]);

/** Actions shown when `actions` is not set: a single "Download Selected" button. */
export const DEFAULT_ACTIONS: readonly FileTableAction[] = Object.freeze([
  { id: 'download', label: 'Download Selected', icon: 'download' },
]);

/** The action id that also dispatches `tins-download`. */
const DOWNLOAD_ACTION = 'download';

/** Only files with this status (compared trimmed and case-insensitively) can be selected and downloaded. */
const DOWNLOADABLE = 'available';

/** Canonical display labels for known statuses, keyed by normalized status. */
const KNOWN_LABELS: Readonly<Record<string, string>> = {
  available: 'Available',
  scheduled: 'Scheduled',
};

/** Trimmed, lower-cased status; anything that is not a string normalizes to ''. */
const normalizeStatus = (status: unknown): string =>
  typeof status === 'string' ? status.trim().toLowerCase() : '';

/**
 * Whether a file can be selected and downloaded: its status is `available`, ignoring case and
 * surrounding whitespace. The same rule `<tins-file-table>` applies, exported so hosts can re-check
 * the files they receive in `tins-download`. Never throws, whatever the status value.
 */
export function isDownloadable(file: Pick<FileEntry, 'status'>): boolean {
  return normalizeStatus(file?.status) === DOWNLOADABLE;
}

/** A file is identified by device + path; the separator cannot appear in either. */
const keyOf = (file: FileEntry): string => `${file.device}\u0000${file.path}`;
/** A file field as display text; non-scalar values render as ''. */
const cellText = (file: FileEntry, key: string): string => {
  const value = (file as unknown as Record<string, unknown>)?.[key];
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
    ? String(value)
    : '';
};

const statusLabel = (status: unknown): string => {
  if (typeof status !== 'string') return '';
  const known = KNOWN_LABELS[normalizeStatus(status)];
  if (known) return known;
  // Sentence case: separators to spaces, collapse whitespace, lower-case, capitalize the first
  // code point. Locale-independent so the label does not vary with the user's locale.
  const words = status.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const [first = ''] = words;
  return first.toUpperCase() + words.slice(first.length);
};

/**
 * A table of files from which the user selects the available ones and requests a bulk download.
 * Selection is owned by the component; acting on it is left to the host, which listens for
 * `tins-action` (any toolbar button) or `tins-download` (the `download` action).
 *
 * The column headers (`columns`) and the toolbar buttons (`actions`) are configurable; by default
 * the table shows Name, Device, Path and Status with a single "Download Selected" button.
 *
 * @tag tins-file-table
 * @summary Selectable file list with tri-state select-all, live selection count and configurable columns and actions.
 *
 * @csspart toolbar - Bar above the table holding select-all, the count and the action buttons.
 * @csspart count - The "Selected N" / "None Selected" text (a polite live region).
 * @csspart action-button - Each native action button in the toolbar.
 * @csspart download-button - The action button whose id is `download`.
 * @csspart table - The native table element.
 * @csspart row - Each data row (`tr`). Selected rows also have the `row-selected` part.
 * @csspart row-selected - Data rows that are currently selected.
 * @csspart status-dot - The indicator dot shown before "Available".
 *
 * @cssprop [--tins-color-text] - Text color.
 * @cssprop [--tins-color-text-muted] - Column header text color.
 * @cssprop [--tins-color-surface] - Table background.
 * @cssprop [--tins-color-surface-raised] - Toolbar action button hover background.
 * @cssprop [--tins-color-row-hover] - Background of a hovered file row.
 * @cssprop [--tins-color-row-selected] - Background of a selected row.
 * @cssprop [--tins-color-row-selected-hover] - Background of a selected row while hovered.
 * @cssprop [--tins-color-border] - Checkbox boundaries and row separators.
 * @cssprop [--tins-color-primary] - Checked checkbox fill and action button text.
 * @cssprop [--tins-color-on-primary] - Check mark color.
 * @cssprop [--tins-color-success] - Status dot of available files.
 * @cssprop [--tins-color-focus-ring] - Focus indicator color.
 * @cssprop [--tins-target-size] - Minimum checkbox and button size (default 44px).
 *
 * @fires {CustomEvent<TinsActionDetail>} tins-action - An action button was activated. Bubbles and is composed.
 * @fires {CustomEvent<TinsDownloadDetail>} tins-download - The `download` action was activated (after `tins-action`). Bubbles and is composed.
 * @fires {CustomEvent<TinsSelectionChangeDetail>} tins-selection-change - The user changed the selection. Bubbles and is composed.
 */
export class TinsFileTable extends LitElement {
  static override styles = scss(styles);

  static override properties = {
    files: { type: Array },
    label: { type: String, reflect: true },
    columns: { type: Array },
    actions: { type: Array },
    _selected: { state: true },
  };

  /** Files to list, one row each, in display order. Also settable as a JSON `files` attribute. @attr files */
  declare files: FileEntry[];
  /** Accessible name of the table. @attr label */
  declare label: string;
  /**
   * Columns after the selection column, in display order: the file field each shows and its header.
   * Defaults to Name, Device, Path, Status. Also settable as a JSON `columns` attribute. @attr columns
   */
  declare columns: FileTableColumn[];
  /**
   * Toolbar buttons that act on the selection. Each fires `tins-action`; `download` also fires
   * `tins-download`. Defaults to "Download Selected"; `[]` shows none. Also settable as a JSON
   * `actions` attribute. @attr actions
   */
  declare actions: FileTableAction[];

  /** Keys of the selected files. Replaced, never mutated, so Lit sees every change. */
  declare private _selected: ReadonlySet<string>;

  constructor() {
    super();
    this.files = [];
    this.label = 'Files';
    this.columns = [...DEFAULT_COLUMNS];
    this.actions = [...DEFAULT_ACTIONS];
    this._selected = new Set();
  }

  /** The selected files, in display order. A new frozen array on every read. */
  get selected(): readonly FileEntry[] {
    return Object.freeze(
      this.#rows.filter(
        (f) => isDownloadable(f) && this._selected.has(keyOf(f)),
      ),
    );
  }

  get #rows(): FileEntry[] {
    return Array.isArray(this.files) ? this.files : [];
  }

  get #columns(): readonly FileTableColumn[] {
    const cols = Array.isArray(this.columns)
      ? this.columns.filter(
          (c) => c && typeof c.key === 'string' && typeof c.label === 'string',
        )
      : [];
    return cols.length ? cols : DEFAULT_COLUMNS;
  }

  get #actions(): readonly FileTableAction[] {
    return Array.isArray(this.actions)
      ? this.actions.filter(
          (a) => a && typeof a.id === 'string' && typeof a.label === 'string',
        )
      : DEFAULT_ACTIONS;
  }

  get #selectable(): FileEntry[] {
    return this.#rows.filter(isDownloadable);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // Drop selections whose file disappeared or stopped being available (spec: stale selection).
    if (changed.has('files') && this._selected.size) {
      const valid = new Set(this.#selectable.map(keyOf));
      const kept = [...this._selected].filter((k) => valid.has(k));
      if (kept.length !== this._selected.size) this._selected = new Set(kept);
    }
  }

  protected override firstUpdated(): void {
    // Pointer convenience: clicking anywhere on a selectable row toggles it. Keyboard and assistive
    // technology users use the row checkbox, so rows stay non-interactive (no tabindex, no role).
    this.renderRoot.addEventListener('click', this.#onRowClick);
  }

  #commit(next: ReadonlySet<string>): void {
    this._selected = next;
    this.dispatchEvent(
      new CustomEvent<TinsSelectionChangeDetail>('tins-selection-change', {
        bubbles: true,
        composed: true,
        detail: { selected: this.selected },
      }),
    );
  }

  #toggle(file: FileEntry, on: boolean): void {
    if (!isDownloadable(file)) return;
    const key = keyOf(file);
    if (this._selected.has(key) === on) return;
    const next = new Set(this._selected);
    if (on) next.add(key);
    else next.delete(key);
    this.#commit(next);
  }

  #onSelectAll = (): void => {
    const selectable = this.#selectable;
    const allSelected =
      selectable.length > 0 &&
      selectable.every((f) => this._selected.has(keyOf(f)));
    this.#commit(allSelected ? new Set() : new Set(selectable.map(keyOf)));
  };

  /**
   * Enter toggles a checkbox like Space does (native checkboxes only react to Space). Clicking the
   * input reuses the native path: `checked` flips and `change` fires, so pointer, Space and Enter
   * share one code path. Held keys do not auto-repeat the toggle.
   */
  #onCheckboxKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || event.isComposing) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const input = event.currentTarget as HTMLInputElement;
    event.preventDefault(); // never submit an enclosing form
    if (event.repeat || input.disabled) return;
    input.click();
  };

  #onRowClick = (event: Event): void => {
    const path = event.composedPath();
    // Clicks on the checkbox or its label are handled by the checkbox's own change event.
    if (
      path.some(
        (n) => n instanceof HTMLLabelElement || n instanceof HTMLInputElement,
      )
    )
      return;
    const row = path.find(
      (n): n is HTMLTableRowElement =>
        n instanceof HTMLTableRowElement && n.dataset['index'] !== undefined,
    );
    if (!row) return;
    // Let users select text (e.g. copy a path) without toggling the row.
    const root = this.renderRoot as ShadowRoot & {
      getSelection?: () => Selection | null;
    };
    const selection = root.getSelection?.() ?? document.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim())
      return;
    const file = this.#rows[Number(row.dataset['index'])];
    if (file) this.#toggle(file, !this._selected.has(keyOf(file)));
  };

  #onAction(action: FileTableAction): void {
    const files = this.selected;
    if (action.requiresSelection !== false && !files.length) return;
    this.dispatchEvent(
      new CustomEvent<TinsActionDetail>('tins-action', {
        bubbles: true,
        composed: true,
        detail: { action: action.id, files },
      }),
    );
    if (action.id === DOWNLOAD_ACTION && files.length) {
      this.dispatchEvent(
        new CustomEvent<TinsDownloadDetail>('tins-download', {
          bubbles: true,
          composed: true,
          detail: { files },
        }),
      );
    }
  }

  protected override render() {
    const rows = this.#rows;
    const selectable = this.#selectable;
    const count = this.selected.length;
    const all = selectable.length > 0 && count === selectable.length;
    const some = count > 0 && !all;
    const columns = this.#columns;

    return html`
      <div class="toolbar" part="toolbar">
        <label class="check">
          <input
            type="checkbox"
            aria-label="Select all available files"
            .checked=${live(all)}
            .indeterminate=${live(some)}
            ?disabled=${selectable.length === 0}
            @change=${this.#onSelectAll}
            @keydown=${this.#onCheckboxKeydown}
          />
        </label>
        <span class="count" part="count" role="status"
          >${count ? `Selected ${count}` : 'None Selected'}</span
        >
        ${this.#actions.map((action) => this.#renderAction(action, count))}
      </div>
      <div class="scroll" role="region" tabindex="0" aria-labelledby="caption">
        <table part="table">
          <caption id="caption" class="visually-hidden">
            ${this.label}
          </caption>
          <thead>
            <tr>
              <th scope="col" class="select-col">
                <span class="visually-hidden">Select</span>
              </th>
              ${columns.map((col) => html`<th scope="col">${col.label}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${rows.length
              ? rows.map((file, index) => this.#renderRow(file, index))
              : html`<tr>
                  <td class="empty" colspan=${columns.length + 1}>No files</td>
                </tr>`}
          </tbody>
        </table>
      </div>
      <span id="unavailable" class="visually-hidden"
        >Not available for download</span
      >
    `;
  }

  #renderAction(action: FileTableAction, count: number) {
    const isDownload = action.id === DOWNLOAD_ACTION;
    return html`<button
      class="action"
      part=${isDownload ? 'action-button download-button' : 'action-button'}
      type="button"
      data-action=${action.id}
      ?disabled=${action.requiresSelection !== false && count === 0}
      @click=${() => this.#onAction(action)}
    >
      ${action.icon === 'download'
        ? html`<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path
              d="M12 3v12m0 0-5-5m5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
            />
          </svg>`
        : nothing}
      ${action.label}
    </button>`;
  }

  #renderCell(file: FileEntry, column: FileTableColumn, selectable: boolean) {
    if (column.key === 'status') {
      return html`<td class="status">
        ${selectable
          ? html`<span class="dot" part="status-dot" aria-hidden="true"></span>`
          : nothing}${statusLabel(file.status)}
      </td>`;
    }
    const cls = column.key === 'path' ? 'path' : nothing;
    // No whitespace around the value: hosts read cell text as-is.
    // prettier-ignore
    return html`<td class=${cls}>${cellText(file, column.key)}</td>`;
  }

  #renderRow(file: FileEntry, index: number) {
    const selectable = isDownloadable(file);
    const selected = selectable && this._selected.has(keyOf(file));
    return html`<tr
      data-index=${index}
      part=${selected ? 'row row-selected' : 'row'}
      class=${selectable
        ? selected
          ? 'selectable selected'
          : 'selectable'
        : ''}
    >
      <td class="select-col">
        <label class="check">
          <input
            type="checkbox"
            aria-label=${`Select ${file.name}`}
            aria-describedby=${selectable ? nothing : 'unavailable'}
            .checked=${live(selected)}
            ?disabled=${!selectable}
            @change=${(e: Event) =>
              this.#toggle(file, (e.target as HTMLInputElement).checked)}
            @keydown=${this.#onCheckboxKeydown}
          />
        </label>
      </td>
      ${this.#columns.map((col) => this.#renderCell(file, col, selectable))}
    </tr>`;
  }
}
