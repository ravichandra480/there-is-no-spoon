import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  assertFocusVisible,
  assertTargetSize,
  expectNoA11yViolations,
} from '@tins/testing-a11y/vitest';
import { cleanup, fixture } from '../testing/fixture.js';
import { isDownloadable } from './index.js';
import type { FileEntry, TinsFileTable } from './file-table.js';

afterEach(() => {
  document.getSelection()?.removeAllRanges();
  cleanup();
});

/** The sample data from the design. */
const FILES: FileEntry[] = [
  {
    name: 'sync.exe',
    device: 'Atlas',
    path: '\\srv\\share2\\apps\\bin\\sync.exe',
    status: 'scheduled',
  },
  {
    name: 'agent.exe',
    device: 'Birch',
    path: '\\srv\\share2\\apps\\bin\\agent.exe',
    status: 'available',
  },
  {
    name: 'libcore.dll',
    device: 'Cedar',
    path: '\\srv\\share1\\apps\\bin\\libcore.dll',
    status: 'available',
  },
  {
    name: 'audio.sys',
    device: 'Delta',
    path: '\\srv\\share1\\apps\\bin\\audio.sys',
    status: 'scheduled',
  },
  {
    name: 'telemetry.dll',
    device: 'Ember',
    path: '\\srv\\share1\\apps\\bin\\telemetry.dll',
    status: 'scheduled',
  },
  {
    name: 'zip.exe',
    device: 'Fern',
    path: '\\srv\\share1\\tmp\\zip.exe',
    status: 'scheduled',
  },
];

async function mount(
  files: FileEntry[] = FILES,
  attrs = '',
): Promise<TinsFileTable> {
  const el = await fixture<TinsFileTable>(
    `<tins-file-table ${attrs}></tins-file-table>`,
  );
  el.files = files;
  await el.updateComplete;
  return el;
}

const q = <T extends Element>(el: TinsFileTable, sel: string) =>
  el.shadowRoot!.querySelector<T>(sel)!;
const qa = <T extends Element>(el: TinsFileTable, sel: string) => [
  ...el.shadowRoot!.querySelectorAll<T>(sel),
];
const bodyRows = (el: TinsFileTable) => qa<HTMLTableRowElement>(el, 'tbody tr');
const selectAll = (el: TinsFileTable) =>
  q<HTMLInputElement>(el, '.toolbar input');
const rowBox = (el: TinsFileTable, name: string) =>
  q<HTMLInputElement>(el, `tbody input[aria-label="Select ${name}"]`);
const download = (el: TinsFileTable) =>
  q<HTMLButtonElement>(el, 'button[data-action="download"]');
const count = (el: TinsFileTable) =>
  q<HTMLElement>(el, '[role="status"]').textContent!.trim();
const names = (files: readonly FileEntry[]) => files.map((f) => f.name);

async function check(el: TinsFileTable, name: string) {
  rowBox(el, name).click();
  await el.updateComplete;
}

describe('tins-file-table rendering', () => {
  it('renders one row per file, in order, with name, device, path and status', async () => {
    const el = await mount();
    const rows = bodyRows(el);
    expect(rows).toHaveLength(6);
    const cells = rows.map((r) =>
      [...r.cells].slice(1).map((c) => c.textContent!.trim()),
    );
    expect(cells[0]).toEqual(['sync.exe', 'Atlas', FILES[0].path, 'Scheduled']);
    expect(cells[1]).toEqual([
      'agent.exe',
      'Birch',
      FILES[1].path,
      'Available',
    ]);
    expect(cells.map((c) => c[0])).toEqual(names(FILES));
  });

  it('exposes Name, Device, Path and Status as column headers after the selection column', async () => {
    const el = await mount();
    const headers = qa<HTMLTableCellElement>(el, 'thead th');
    expect(headers.map((h) => h.getAttribute('scope'))).toEqual(
      Array(5).fill('col'),
    );
    expect(headers.map((h) => h.textContent!.trim())).toEqual([
      'Select',
      'Name',
      'Device',
      'Path',
      'Status',
    ]);
  });

  it('shows the headers and an empty-state message for an empty list', async () => {
    const el = await mount([]);
    expect(qa(el, 'thead th')).toHaveLength(5);
    expect(bodyRows(el)).toHaveLength(1);
    expect(q(el, 'td.empty').textContent!.trim()).toBe('No files');
    expect(selectAll(el).disabled).toBe(true);
    expect(download(el).disabled).toBe(true);
  });

  it('treats a missing files value as an empty list', async () => {
    const el = await mount(undefined as unknown as FileEntry[]);
    el.files = null as unknown as FileEntry[];
    await el.updateComplete;
    expect(q(el, 'td.empty')).not.toBeNull();
    expect(el.selected).toEqual([]);
  });

  it('accepts files as a JSON attribute (plain HTML, no script)', async () => {
    const json = JSON.stringify(FILES.slice(0, 2)).replace(/"/g, '&quot;');
    const el = await fixture<TinsFileTable>(
      `<tins-file-table files="${json}"></tins-file-table>`,
    );
    expect(bodyRows(el)).toHaveLength(2);
  });

  it('re-renders when the list is replaced', async () => {
    const el = await mount();
    el.files = FILES.slice(0, 3);
    await el.updateComplete;
    expect(bodyRows(el)).toHaveLength(3);
  });

  it('names the table with label (default "Files") via its caption', async () => {
    const el = await mount();
    expect(q(el, 'caption').textContent!.trim()).toBe('Files');
    el.label = 'Quarantined files';
    await el.updateComplete;
    expect(q(el, 'caption').textContent!.trim()).toBe('Quarantined files');
    expect(el.getAttribute('label')).toBe('Quarantined files');
    expect(q(el, '.scroll').getAttribute('aria-labelledby')).toBe('caption');
  });
});

describe('tins-file-table status', () => {
  it('shows a decorative dot before "Available" only', async () => {
    const el = await mount();
    const [scheduled, available] = bodyRows(el).map(
      (r) => r.querySelector('td.status')!,
    );
    expect(available.querySelector('.dot')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(available.textContent!.trim()).toBe('Available');
    expect(scheduled.querySelector('.dot')).toBeNull();
    expect(scheduled.textContent!.trim()).toBe('Scheduled');
  });

  it('capitalizes an unknown status and treats it as not available', async () => {
    const el = await mount([
      { name: 'a', device: 'd', path: 'p', status: 'quarantined' },
    ]);
    expect(q(el, 'td.status').textContent!.trim()).toBe('Quarantined');
    expect(q(el, 'td.status .dot')).toBeNull();
    expect(rowBox(el, 'a').disabled).toBe(true);
  });

  it('shows unknown statuses in sentence case, as not available', async () => {
    const el = await mount([
      { name: 'a', device: 'd', path: 'p1', status: 'IN_PROGRESS' },
      { name: 'b', device: 'd', path: 'p2', status: 'pending-review' },
      { name: 'c', device: 'd', path: 'p3', status: '  failed   VERIFICATION ' },
    ]);
    const cells = qa(el, 'td.status');
    expect(cells.map((c) => c.textContent!.trim())).toEqual([
      'In progress',
      'Pending review',
      'Failed verification',
    ]);
    for (const cell of cells) expect(cell.querySelector('.dot')).toBeNull();
    for (const name of ['a', 'b', 'c']) expect(rowBox(el, name).disabled).toBe(true);
  });

  it('shows empty text for a status made only of separators', async () => {
    const el = await mount([
      { name: 'a', device: 'd', path: 'p1', status: '__' },
      { name: 'b', device: 'd', path: 'p2', status: ' - ' },
    ]);
    for (const cell of qa(el, 'td.status')) {
      expect(cell.textContent!.trim()).toBe('');
      expect(cell.querySelector('.dot')).toBeNull();
    }
    expect(rowBox(el, 'a').disabled).toBe(true);
    expect(rowBox(el, 'b').disabled).toBe(true);
  });

  it('formats only the label, keeping the status values the host supplied', async () => {
    const pending = { name: 'a', device: 'd', path: 'p1', status: 'IN_PROGRESS' };
    const ready = { name: 'b', device: 'd', path: 'p2', status: ' AVAILABLE ' };
    const el = await mount([pending, ready]);
    await check(el, 'b');
    expect(pending.status).toBe('IN_PROGRESS');
    expect(el.files.map((f) => f.status)).toEqual(['IN_PROGRESS', ' AVAILABLE ']);
    expect(el.selected.map((f) => f.status)).toEqual([' AVAILABLE ']);
    const spy = vi.fn();
    el.addEventListener('tins-download', spy);
    download(el).click();
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.files.map((f: FileEntry) => f.status)).toEqual([' AVAILABLE ']);
  });

  it('renders an empty status without failing', async () => {
    const el = await mount([{ name: 'a', device: 'd', path: 'p', status: '' }]);
    expect(q(el, 'td.status').textContent!.trim()).toBe('');
  });

  it('shows canonical labels for known statuses in any case', async () => {
    const el = await mount([
      { name: 'a', device: 'd', path: 'p1', status: 'AVAILABLE' },
      { name: 'b', device: 'd', path: 'p2', status: ' Scheduled ' },
    ]);
    const [available, scheduled] = bodyRows(el).map(
      (r) => r.querySelector('td.status')!,
    );
    expect(available.textContent!.trim()).toBe('Available');
    expect(available.querySelector('.dot')).not.toBeNull();
    expect(scheduled.textContent!.trim()).toBe('Scheduled');
    expect(scheduled.querySelector('.dot')).toBeNull();
  });

  it('renders missing or non-string statuses without failing, as not available', async () => {
    const odd = [undefined, null, 42].map(
      (status, i) =>
        ({
          name: `f${i}`,
          device: 'd',
          path: `p${i}`,
          status,
        }) as unknown as FileEntry,
    );
    const el = await mount(odd);
    for (const cell of qa(el, 'td.status')) {
      expect(cell.textContent!.trim()).toBe('');
      expect(cell.querySelector('.dot')).toBeNull();
    }
    for (const f of odd) expect(rowBox(el, f.name).disabled).toBe(true);
  });
});

describe('tins-file-table selection', () => {
  it('selects an available file from its checkbox and highlights the row', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    expect(rowBox(el, 'agent.exe').checked).toBe(true);
    expect(names(el.selected)).toEqual(['agent.exe']);
    const row = bodyRows(el)[1];
    expect(row.classList.contains('selected')).toBe(true);
    expect(row.getAttribute('part')).toBe('row row-selected');
  });

  it('unchecking a selected file deselects it', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'agent.exe');
    expect(el.selected).toEqual([]);
  });

  it('disables checkboxes of non-available files and explains why', async () => {
    const el = await mount();
    const box = rowBox(el, 'sync.exe');
    expect(box.disabled).toBe(true);
    const reason = q(el, `#${box.getAttribute('aria-describedby')}`);
    expect(reason.textContent!.trim()).toBe('Not available for download');
    expect(rowBox(el, 'agent.exe').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('never selects a scheduled file from its checkbox or row', async () => {
    const el = await mount();
    rowBox(el, 'sync.exe').click();
    bodyRows(el)[0].cells[2].click();
    await el.updateComplete;
    expect(el.selected).toEqual([]);
    expect(rowBox(el, 'sync.exe').checked).toBe(false);
  });

  it('returns selected files in display order regardless of selection order', async () => {
    const el = await mount();
    await check(el, 'libcore.dll');
    await check(el, 'agent.exe');
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(Object.isFrozen(el.selected)).toBe(true);
  });

  it('drops a selected file that is removed from the list, without an event', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'libcore.dll');
    const spy = vi.fn();
    el.addEventListener('tins-selection-change', spy);
    el.files = FILES.filter((f) => f.name !== 'agent.exe');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['libcore.dll']);
    expect(count(el)).toBe('Selected 1');
    expect(spy).not.toHaveBeenCalled();
  });

  it('drops a selected file whose status changes away from available', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    el.files = FILES.map((f) =>
      f.name === 'agent.exe' ? { ...f, status: 'scheduled' } : f,
    );
    await el.updateComplete;
    expect(el.selected).toEqual([]);
    expect(count(el)).toBe('None Selected');
  });

  it('keeps the selection when the list is replaced with equal entries', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    el.files = FILES.map((f) => ({ ...f }));
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe']);
  });

  it('treats status variants of "available" as available', async () => {
    const el = await mount([
      { name: 'a', device: 'd', path: 'p1', status: 'Available' },
      { name: 'b', device: 'd', path: 'p2', status: 'AVAILABLE' },
      { name: 'c', device: 'd', path: 'p3', status: ' available ' },
    ]);
    for (const n of ['a', 'b', 'c']) expect(rowBox(el, n).disabled).toBe(false);
    selectAll(el).click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['a', 'b', 'c']);
  });

  it('does not treat look-alike statuses as available', async () => {
    const el = await mount([
      { name: 'a', device: 'd', path: 'p1', status: 'unavailable' },
      { name: 'b', device: 'd', path: 'p2', status: 'available-soon' },
      { name: 'c', device: 'd', path: 'p3', status: '' },
    ]);
    for (const n of ['a', 'b', 'c']) {
      expect(rowBox(el, n).disabled).toBe(true);
      rowBox(el, n).click();
    }
    await el.updateComplete;
    expect(el.selected).toEqual([]);
    expect(selectAll(el).disabled).toBe(true);
  });

  it('keeps the selection when a status changes only in case', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    const spy = vi.fn();
    el.addEventListener('tins-selection-change', spy);
    el.files = FILES.map((f) =>
      f.name === 'agent.exe' ? { ...f, status: 'Available' } : f,
    );
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe']);
    expect(count(el)).toBe('Selected 1');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('isDownloadable', () => {
  it('matches exactly the rows whose checkboxes are enabled', async () => {
    const files: FileEntry[] = [
      ...FILES,
      { name: 'x1', device: 'd', path: 'x1', status: ' AVAILABLE' },
      { name: 'x2', device: 'd', path: 'x2', status: 'unavailable' },
    ];
    const el = await mount(files);
    for (const f of files)
      expect(isDownloadable(f)).toBe(!rowBox(el, f.name).disabled);
  });

  it('returns false without throwing for malformed entries', () => {
    expect(
      isDownloadable({
        name: 'x',
        device: 'd',
        path: 'p',
      } as unknown as FileEntry),
    ).toBe(false);
    for (const status of [null, undefined, 1, {}, []])
      expect(isDownloadable({ status } as unknown as FileEntry)).toBe(false);
  });
});

describe('tins-file-table row click', () => {
  it('clicking a non-checkbox cell of a selectable row toggles it', async () => {
    const el = await mount();
    const peach = bodyRows(el)[2].cells[2];
    expect(peach.textContent).toBe('Cedar');
    peach.click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['libcore.dll']);
    peach.click();
    await el.updateComplete;
    expect(el.selected).toEqual([]);
  });

  it('clicking the checkbox toggles once (no double toggle from the row)', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    expect(names(el.selected)).toEqual(['agent.exe']);
  });

  it('does not toggle when the user has selected text in the row', async () => {
    const el = await mount();
    const cell = bodyRows(el)[1].cells[3];
    const range = document.createRange();
    range.selectNodeContents(cell);
    document.getSelection()!.addRange(range);
    cell.click();
    await el.updateComplete;
    expect(el.selected).toEqual([]);
  });

  it('ignores clicks outside the data rows', async () => {
    const el = await mount();
    q<HTMLElement>(el, 'thead th').click();
    q<HTMLElement>(el, '.count').click();
    await el.updateComplete;
    expect(el.selected).toEqual([]);
  });
});

describe('tins-file-table select-all and count', () => {
  it('starts unchecked with "None Selected"', async () => {
    const el = await mount();
    expect(selectAll(el).checked).toBe(false);
    expect(selectAll(el).indeterminate).toBe(false);
    expect(count(el)).toBe('None Selected');
  });

  it('tracks the count through every selection change', async () => {
    const el = await mount();
    expect(count(el)).toBe('None Selected');
    await check(el, 'agent.exe');
    expect(count(el)).toBe('Selected 1');
    await check(el, 'libcore.dll');
    expect(count(el)).toBe('Selected 2');
    await check(el, 'agent.exe');
    expect(count(el)).toBe('Selected 1');
    await check(el, 'libcore.dll');
    expect(count(el)).toBe('None Selected');
  });

  it('is indeterminate (mixed) for a partial selection', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    expect(selectAll(el).indeterminate).toBe(true);
    expect(selectAll(el).checked).toBe(false);
    expect(count(el)).toBe('Selected 1');
  });

  it('selects every available file (and no scheduled file) from a partial selection', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    selectAll(el).click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(selectAll(el).checked).toBe(true);
    expect(selectAll(el).indeterminate).toBe(false);
    expect(count(el)).toBe('Selected 2');
  });

  it('clears the selection when everything is selected', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    selectAll(el).click();
    await el.updateComplete;
    expect(el.selected).toEqual([]);
    expect(selectAll(el).checked).toBe(false);
    expect(count(el)).toBe('None Selected');
  });

  it('is checked when every available file is selected one by one', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'libcore.dll');
    expect(selectAll(el).checked).toBe(true);
  });

  it('is disabled when no file is available', async () => {
    const el = await mount(FILES.filter((f) => f.status !== 'available'));
    expect(selectAll(el).disabled).toBe(true);
  });
});

describe('tins-file-table select-all is unchecked when nothing is selected', () => {
  const expectUnchecked = (el: TinsFileTable) => {
    expect(selectAll(el).checked).toBe(false);
    expect(selectAll(el).indeterminate).toBe(false);
  };

  it('on the initial render', async () => {
    const el = await mount();
    expectUnchecked(el);
    expect(count(el)).toBe('None Selected');
  });

  it('after the last row is unchecked with its checkbox', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'agent.exe');
    expect(el.selected).toEqual([]);
    expectUnchecked(el);
  });

  it('after the last row is unchecked by clicking the row', async () => {
    const el = await mount();
    const peach = bodyRows(el)[2].cells[2];
    peach.click();
    await el.updateComplete;
    peach.click();
    await el.updateComplete;
    expect(el.selected).toEqual([]);
    expectUnchecked(el);
  });

  it('after select-all and then unchecking every row one by one', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    await check(el, 'agent.exe');
    expect(selectAll(el).indeterminate).toBe(true);
    await check(el, 'libcore.dll');
    expect(el.selected).toEqual([]);
    expectUnchecked(el);
  });

  it('after clearing everything with select-all', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    selectAll(el).click();
    await el.updateComplete;
    expectUnchecked(el);
  });

  it('after a data change drops every selected file', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    el.files = FILES.map((f) =>
      f.name === 'agent.exe' ? { ...f, status: 'scheduled' } : f,
    );
    await el.updateComplete;
    expect(count(el)).toBe('None Selected');
    expectUnchecked(el);
  });

  it('when it becomes disabled after being checked', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    expect(selectAll(el).checked).toBe(true);
    el.files = FILES.filter((f) => !isDownloadable(f));
    await el.updateComplete;
    expect(selectAll(el).disabled).toBe(true);
    expectUnchecked(el);
  });

  it('names select-all and each row checkbox', async () => {
    const el = await mount();
    expect(selectAll(el).getAttribute('aria-label')).toBe(
      'Select all available files',
    );
    expect(
      qa(el, 'tbody input').map((i) => i.getAttribute('aria-label')),
    ).toEqual(FILES.map((f) => `Select ${f.name}`));
  });

  it('exposes the count as a polite status message', async () => {
    const el = await mount();
    expect(q(el, '.count').getAttribute('role')).toBe('status');
  });
});

describe('tins-file-table select-all is checked when every selectable file is selected', () => {
  const expectChecked = (el: TinsFileTable) => {
    expect(selectAll(el).checked).toBe(true);
    expect(selectAll(el).indeterminate).toBe(false);
  };

  it('after select-all from nothing selected', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expectChecked(el);
    expect(count(el)).toBe('Selected 2');
  });

  it('after select-all from a partial selection', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    selectAll(el).click();
    await el.updateComplete;
    expectChecked(el);
  });

  it('after the last row is checked with its checkbox', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'libcore.dll');
    expectChecked(el);
  });

  it('after the last row is checked by clicking the row', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    rowBox(el, 'libcore.dll').closest('tr')!.cells[2].click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expectChecked(el);
  });

  it('after the last row is checked with Space', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    rowBox(el, 'libcore.dll').focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
    expectChecked(el);
    expect(count(el)).toBe('Selected 2');
  });

  it('after a data change removes the only unselected available file', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    el.files = FILES.filter((f) => f.name !== 'libcore.dll');
    await el.updateComplete;
    expectChecked(el);
    expect(count(el)).toBe('Selected 1');
  });

  it('after a data change makes the only unselected available file unavailable', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    el.files = FILES.map((f) =>
      f.name === 'libcore.dll' ? { ...f, status: 'scheduled' } : f,
    );
    await el.updateComplete;
    expectChecked(el);
    expect(count(el)).toBe('Selected 1');
  });

  it('stops being checked when a new available file is added', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    expectChecked(el);
    el.files = [
      ...FILES,
      { name: 'new.dll', device: 'Fern', path: '\\new.dll', status: 'available' },
    ];
    await el.updateComplete;
    expect(selectAll(el).indeterminate).toBe(true);
    expect(selectAll(el).checked).toBe(false);
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
  });

  it('is checked with scheduled files present and unselected', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    expect(FILES.some((f) => !isDownloadable(f))).toBe(true);
    expectChecked(el);
  });
});

describe('tins-file-table select-all is indeterminate when some but not all selectable files are selected', () => {
  const expectPartial = (el: TinsFileTable) => {
    expect(selectAll(el).indeterminate).toBe(true);
    expect(selectAll(el).checked).toBe(false);
  };

  /** Three available files plus one scheduled, so "partial" can mean 2 of 3. */
  const THREE: FileEntry[] = [
    { name: 'alpha.exe', device: 'A', path: '\\alpha.exe', status: 'available' },
    { name: 'beta.exe', device: 'B', path: '\\beta.exe', status: 'available' },
    { name: 'gamma.exe', device: 'C', path: '\\gamma.exe', status: 'available' },
    { name: 'delta.exe', device: 'D', path: '\\delta.exe', status: 'scheduled' },
  ];

  it('after the first row is checked with its checkbox', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    expectPartial(el);
    expect(count(el)).toBe('Selected 1');
  });

  it('after the first row is checked by clicking the row', async () => {
    const el = await mount();
    rowBox(el, 'libcore.dll').closest('tr')!.cells[2].click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['libcore.dll']);
    expectPartial(el);
  });

  it('after the first row is checked with Space', async () => {
    const el = await mount();
    rowBox(el, 'agent.exe').focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
    expectPartial(el);
    expect(count(el)).toBe('Selected 1');
  });

  it('after one row is unchecked with its checkbox following select-all', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    await check(el, 'agent.exe');
    expect(names(el.selected)).toEqual(['libcore.dll']);
    expectPartial(el);
    expect(count(el)).toBe('Selected 1');
  });

  it('after one row is unchecked by clicking the row following select-all', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    rowBox(el, 'libcore.dll').closest('tr')!.cells[2].click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe']);
    expectPartial(el);
  });

  it('with two of three available files selected', async () => {
    const el = await mount(THREE);
    await check(el, 'alpha.exe');
    await check(el, 'beta.exe');
    expectPartial(el);
    expect(count(el)).toBe('Selected 2');
  });

  it('after a data change removes one of two selected files', async () => {
    const el = await mount(THREE);
    await check(el, 'alpha.exe');
    await check(el, 'beta.exe');
    el.files = THREE.filter((f) => f.name !== 'alpha.exe');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['beta.exe']);
    expectPartial(el);
    expect(count(el)).toBe('Selected 1');
  });

  it('after a data change makes one of two selected files unavailable', async () => {
    const el = await mount(THREE);
    await check(el, 'alpha.exe');
    await check(el, 'beta.exe');
    el.files = THREE.map((f) =>
      f.name === 'alpha.exe' ? { ...f, status: 'scheduled' } : f,
    );
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['beta.exe']);
    expectPartial(el);
    expect(count(el)).toBe('Selected 1');
  });

  it('is not partial when only unavailable files are unselected', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'libcore.dll');
    expect(selectAll(el).checked).toBe(true);
    expect(selectAll(el).indeterminate).toBe(false);
  });

  it('leaves the partial state when select-all is clicked', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    expectPartial(el);
    selectAll(el).click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(selectAll(el).checked).toBe(true);
    expect(selectAll(el).indeterminate).toBe(false);
  });

  it('leaves the partial state when select-all is activated with Space', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    expectPartial(el);
    selectAll(el).focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(selectAll(el).checked).toBe(true);
    expect(selectAll(el).indeterminate).toBe(false);
  });
});

describe('tins-file-table activating select-all selects every selectable file unless all are selected', () => {
  const expectChecked = (el: TinsFileTable) => {
    expect(selectAll(el).checked).toBe(true);
    expect(selectAll(el).indeterminate).toBe(false);
  };

  async function pressSpaceOnSelectAll(el: TinsFileTable) {
    selectAll(el).focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
  }

  /** Three available files plus one scheduled, so "some" can mean 2 of 3. */
  const THREE: FileEntry[] = [
    { name: 'alpha.exe', device: 'A', path: '\\alpha.exe', status: 'available' },
    { name: 'beta.exe', device: 'B', path: '\\beta.exe', status: 'available' },
    { name: 'gamma.exe', device: 'C', path: '\\gamma.exe', status: 'available' },
    { name: 'delta.exe', device: 'D', path: '\\delta.exe', status: 'scheduled' },
  ];

  it('selects every available file from none selected with a click', async () => {
    const el = await mount();
    selectAll(el).click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expectChecked(el);
    expect(count(el)).toBe('Selected 2');
  });

  it('selects every available file from none selected with Space', async () => {
    const el = await mount();
    await pressSpaceOnSelectAll(el);
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expectChecked(el);
    expect(count(el)).toBe('Selected 2');
  });

  it('keeps agent.exe and adds libcore.dll when clicked with agent.exe selected', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    selectAll(el).click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(rowBox(el, 'agent.exe').checked).toBe(true);
    expectChecked(el);
    expect(count(el)).toBe('Selected 2');
  });

  it('keeps libcore.dll and adds agent.exe on Space with libcore.dll selected', async () => {
    const el = await mount();
    await check(el, 'libcore.dll');
    await pressSpaceOnSelectAll(el);
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expectChecked(el);
    expect(count(el)).toBe('Selected 2');
  });

  it('selects all three available files when two of three are selected', async () => {
    const el = await mount(THREE);
    await check(el, 'alpha.exe');
    await check(el, 'gamma.exe');
    selectAll(el).click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['alpha.exe', 'beta.exe', 'gamma.exe']);
    expect(rowBox(el, 'delta.exe').checked).toBe(false);
    expectChecked(el);
    expect(count(el)).toBe('Selected 3');
  });

  it('never unselects a file when activated from a partial selection', async () => {
    const el = await mount(THREE);
    await check(el, 'beta.exe');
    await check(el, 'gamma.exe');
    const before = names(el.selected);
    selectAll(el).click();
    await el.updateComplete;
    const after = names(el.selected);
    for (const name of before) expect(after).toContain(name);
  });

  it('dispatches one complete tins-selection-change when activated from a partial selection', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    const spy = vi.fn();
    el.addEventListener('tins-selection-change', spy);
    selectAll(el).click();
    await el.updateComplete;
    expect(spy).toHaveBeenCalledTimes(1);
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(names(detail.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(detail.selected).toEqual(el.selected);
  });

  it('still clears the selection when every available file is selected', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'libcore.dll');
    selectAll(el).click();
    await el.updateComplete;
    expect(el.selected).toEqual([]);
    expect(selectAll(el).checked).toBe(false);
    expect(selectAll(el).indeterminate).toBe(false);
    expect(count(el)).toBe('None Selected');
  });
});

describe('tins-file-table activating select-all clears the selection when every selectable file is selected', () => {
  const expectCleared = (el: TinsFileTable) => {
    expect(el.selected).toEqual([]);
    expect(selectAll(el).checked).toBe(false);
    expect(selectAll(el).indeterminate).toBe(false);
    expect(count(el)).toBe('None Selected');
  };

  async function selectEveryAvailable(el: TinsFileTable) {
    await check(el, 'agent.exe');
    await check(el, 'libcore.dll');
    expect(selectAll(el).checked).toBe(true);
  }

  async function clickSelectAll(el: TinsFileTable) {
    selectAll(el).click();
    await el.updateComplete;
  }

  async function pressSpaceOnSelectAll(el: TinsFileTable) {
    selectAll(el).focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
  }

  it('clears with a pointer click', async () => {
    const el = await mount();
    await selectEveryAvailable(el);
    await clickSelectAll(el);
    expectCleared(el);
    expect(download(el).disabled).toBe(true);
  });

  it('clears with Space', async () => {
    const el = await mount();
    await selectEveryAvailable(el);
    await pressSpaceOnSelectAll(el);
    expectCleared(el);
    expect(download(el).disabled).toBe(true);
  });

  it('clears a full selection made with row clicks', async () => {
    const el = await mount();
    bodyRows(el)[1].cells[2].click();
    await el.updateComplete;
    bodyRows(el)[2].cells[2].click();
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    await clickSelectAll(el);
    expectCleared(el);
  });

  it('clears a full selection caused by a host data change', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    el.files = FILES.map((f) =>
      f.name === 'libcore.dll' ? { ...f, status: 'scheduled' } : f,
    );
    await el.updateComplete;
    expect(selectAll(el).checked).toBe(true);
    await clickSelectAll(el);
    expectCleared(el);
  });

  it('clears a larger list and leaves unavailable files unselected', async () => {
    const THREE: FileEntry[] = [
      { name: 'alpha.exe', device: 'A', path: '\\alpha.exe', status: 'available' },
      { name: 'beta.exe', device: 'B', path: '\\beta.exe', status: 'available' },
      { name: 'gamma.exe', device: 'C', path: '\\gamma.exe', status: 'available' },
      { name: 'delta.exe', device: 'D', path: '\\delta.exe', status: 'scheduled' },
    ];
    const el = await mount(THREE);
    await check(el, 'alpha.exe');
    await check(el, 'beta.exe');
    await check(el, 'gamma.exe');
    expect(selectAll(el).checked).toBe(true);
    await clickSelectAll(el);
    expectCleared(el);
    expect(rowBox(el, 'delta.exe').checked).toBe(false);
  });

  it('dispatches one tins-selection-change with an empty selection', async () => {
    const el = await mount();
    await selectEveryAvailable(el);
    const spy = vi.fn();
    el.addEventListener('tins-selection-change', spy);
    await clickSelectAll(el);
    expect(spy).toHaveBeenCalledTimes(1);
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.selected).toEqual([]);
    expect(detail.selected).toEqual(el.selected);
  });

  it('round-trips: clears, then selects every available file again', async () => {
    const el = await mount();
    await selectEveryAvailable(el);
    await clickSelectAll(el);
    expectCleared(el);
    await clickSelectAll(el);
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(selectAll(el).checked).toBe(true);
    expect(selectAll(el).indeterminate).toBe(false);
  });

  it('keeps focus on select-all after clearing with Space', async () => {
    const el = await mount();
    await selectEveryAvailable(el);
    await pressSpaceOnSelectAll(el);
    expectCleared(el);
    expect(el.shadowRoot!.activeElement).toBe(selectAll(el));
  });
});

describe('tins-file-table events', () => {
  it('dispatches tins-download with the selected files (bubbles, composed)', async () => {
    const wrap = await fixture<HTMLDivElement>(
      '<div><tins-file-table></tins-file-table></div>',
    );
    const el = wrap.querySelector('tins-file-table')!;
    el.files = FILES;
    await el.updateComplete;
    const spy = vi.fn();
    wrap.addEventListener('tins-download', spy);
    await check(el, 'libcore.dll');
    await check(el, 'agent.exe');
    download(el).click();
    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.bubbles && event.composed).toBe(true);
    expect(event.detail.files).toEqual([FILES[1], FILES[2]]);
  });

  it('leaves out a file whose status changed just before download, before re-render', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    await check(el, 'libcore.dll');
    const spy = vi.fn();
    el.addEventListener('tins-download', spy);
    el.files = FILES.map((f) =>
      f.name === 'agent.exe' ? { ...f, status: 'scheduled' } : f,
    );
    // Synchronously, before Lit re-renders: the button is still enabled.
    expect(download(el).disabled).toBe(false);
    download(el).click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(names((spy.mock.calls[0][0] as CustomEvent).detail.files)).toEqual([
      'libcore.dll',
    ]);
  });

  it('dispatches nothing when every selected file became unavailable', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    const spy = vi.fn();
    el.addEventListener('tins-download', spy);
    el.files = FILES.map((f) => ({ ...f, status: 'scheduled' }));
    download(el).click();
    expect(spy).not.toHaveBeenCalled();
    await el.updateComplete;
    expect(download(el).disabled).toBe(true);
  });

  it('disables Download Selected and dispatches nothing when nothing is selected', async () => {
    const el = await mount();
    const spy = vi.fn();
    el.addEventListener('tins-download', spy);
    expect(download(el).disabled).toBe(true);
    download(el).click();
    download(el).dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('dispatches one tins-selection-change per user change (bubbles, composed)', async () => {
    const wrap = await fixture<HTMLDivElement>(
      '<div><tins-file-table></tins-file-table></div>',
    );
    const el = wrap.querySelector('tins-file-table')!;
    el.files = FILES;
    await el.updateComplete;
    const spy = vi.fn();
    wrap.addEventListener('tins-selection-change', spy);
    selectAll(el).click();
    await el.updateComplete;
    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.bubbles && event.composed).toBe(true);
    expect(names(event.detail.selected)).toEqual(['agent.exe', 'libcore.dll']);
    expect(event.detail.selected).toEqual(el.selected);
    await check(el, 'agent.exe');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(names(spy.mock.calls[1][0].detail.selected)).toEqual([
      'libcore.dll',
    ]);
  });
});

describe('tins-file-table configurable header', () => {
  const headerTexts = (el: TinsFileTable) =>
    qa<HTMLTableCellElement>(el, 'thead th').map((h) => h.textContent!.trim());
  const actionButtons = (el: TinsFileTable) =>
    qa<HTMLButtonElement>(el, '.toolbar button');

  it('renders custom column names and only the given fields, in order', async () => {
    const el = await mount();
    el.columns = [
      { key: 'device', label: 'Host' },
      { key: 'name', label: 'File' },
      { key: 'status', label: 'State' },
    ];
    await el.updateComplete;
    expect(headerTexts(el)).toEqual(['Select', 'Host', 'File', 'State']);
    const cells = [...bodyRows(el)[1].cells]
      .slice(1)
      .map((c) => c.textContent!.trim());
    expect(cells).toEqual(['Birch', 'agent.exe', 'Available']);
    expect(qa(el, 'tbody .dot')).toHaveLength(2);
  });

  it('shows extra fields of the file objects', async () => {
    const el = await mount(
      FILES.map((f, i) => ({ ...f, size: i * 10 }) as FileEntry),
    );
    el.columns = [
      { key: 'name', label: 'Name' },
      { key: 'size', label: 'Size (KB)' },
    ];
    await el.updateComplete;
    expect(bodyRows(el)[2].cells[2].textContent!.trim()).toBe('20');
  });

  it('accepts columns and actions as JSON attributes', async () => {
    const el = await mount(
      FILES,
      `columns='[{"key":"path","label":"Location"}]' actions='[{"id":"quarantine","label":"Quarantine"}]'`,
    );
    expect(headerTexts(el)).toEqual(['Select', 'Location']);
    expect(actionButtons(el).map((b) => b.textContent!.trim())).toEqual([
      'Quarantine',
    ]);
  });

  it('falls back to the default columns for invalid or empty input', async () => {
    const el = await mount();
    el.columns = [];
    await el.updateComplete;
    expect(headerTexts(el)).toEqual([
      'Select',
      'Name',
      'Device',
      'Path',
      'Status',
    ]);
  });

  it('spans every column with the empty-state message', async () => {
    const el = await mount([]);
    el.columns = [{ key: 'name', label: 'Name' }];
    await el.updateComplete;
    expect(q<HTMLTableCellElement>(el, 'td.empty').colSpan).toBe(2);
  });

  it('renders custom actions and dispatches tins-action with the selection', async () => {
    const el = await mount();
    el.actions = [
      { id: 'quarantine', label: 'Quarantine' },
      { id: 'refresh', label: 'Refresh', requiresSelection: false },
    ];
    await el.updateComplete;
    const [quarantine, refresh] = actionButtons(el);
    expect(quarantine.textContent!.trim()).toBe('Quarantine');
    expect(quarantine.disabled).toBe(true);
    expect(refresh.disabled).toBe(false);
    expect(quarantine.getAttribute('part')).toBe('action-button');

    const spy = vi.fn();
    const downloadSpy = vi.fn();
    el.addEventListener('tins-action', spy);
    el.addEventListener('tins-download', downloadSpy);
    refresh.click();
    expect((spy.mock.calls[0][0] as CustomEvent).detail).toEqual({
      action: 'refresh',
      files: [],
    });

    await check(el, 'agent.exe');
    expect(quarantine.disabled).toBe(false);
    quarantine.click();
    const event = spy.mock.calls[1][0] as CustomEvent;
    expect(event.bubbles && event.composed).toBe(true);
    expect(event.detail.action).toBe('quarantine');
    expect(names(event.detail.files)).toEqual(['agent.exe']);
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('fires tins-action and tins-download for the default download action', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    const order: string[] = [];
    el.addEventListener('tins-action', () => order.push('tins-action'));
    el.addEventListener('tins-download', () => order.push('tins-download'));
    expect(download(el).getAttribute('part')).toBe(
      'action-button download-button',
    );
    download(el).click();
    expect(order).toEqual(['tins-action', 'tins-download']);
  });

  it('shows no buttons for an empty actions list', async () => {
    const el = await mount();
    el.actions = [];
    await el.updateComplete;
    expect(actionButtons(el)).toHaveLength(0);
  });

  it('has no WCAG violations with custom columns and actions', async () => {
    const main = await fixture<HTMLElement>(
      '<main><h1>t</h1><tins-file-table></tins-file-table></main>',
    );
    const el = main.querySelector('tins-file-table')!;
    el.files = FILES;
    el.columns = [
      { key: 'name', label: 'File' },
      { key: 'status', label: 'State' },
    ];
    el.actions = [
      { id: 'download', label: 'Download', icon: 'download' },
      { id: 'quarantine', label: 'Quarantine' },
    ];
    await el.updateComplete;
    await check(el, 'agent.exe');
    await expectNoA11yViolations(el, { context: 'tins-file-table (custom)' });
  });
});

describe('tins-file-table keyboard', () => {
  async function mountBetween() {
    const wrap = await fixture<HTMLDivElement>(
      '<div><button id="before">before</button><tins-file-table></tins-file-table><button id="after">after</button></div>',
    );
    const el = wrap.querySelector('tins-file-table')!;
    el.files = FILES;
    await el.updateComplete;
    (wrap.querySelector('#before') as HTMLButtonElement).focus();
    return el;
  }
  const focused = (el: TinsFileTable) => el.shadowRoot!.activeElement;

  it('tabs through select-all, the table region and only the available rows', async () => {
    const el = await mountBetween();
    const stops: (Element | null)[] = [];
    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      stops.push(focused(el));
    }
    expect(stops).toEqual([
      selectAll(el),
      q(el, '.scroll'), // Download Selected is disabled, so it is skipped
      rowBox(el, 'agent.exe'),
      rowBox(el, 'libcore.dll'),
    ]);
    await userEvent.tab();
    expect(document.activeElement?.id).toBe('after');
  });

  it('selects with Space and downloads with Enter', async () => {
    const el = await mountBetween();
    const spy = vi.fn();
    el.addEventListener('tins-download', spy);
    rowBox(el, 'agent.exe').focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe']);
    // Shift+Tab back past the region to the now-enabled button.
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    expect(focused(el)).toBe(download(el));
    await userEvent.keyboard('{Enter}');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(names(spy.mock.calls[0][0].detail.files)).toEqual(['agent.exe']);
  });

  it('toggles select-all with Space', async () => {
    const el = await mountBetween();
    selectAll(el).focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
  });

  it('checks and unchecks a row with Enter, firing tins-selection-change each time', async () => {
    const el = await mountBetween();
    const spy = vi.fn();
    el.addEventListener('tins-selection-change', spy);
    rowBox(el, 'agent.exe').focus();
    await userEvent.keyboard('{Enter}');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe']);
    expect(rowBox(el, 'agent.exe').checked).toBe(true);
    await userEvent.keyboard('{Enter}');
    await el.updateComplete;
    expect(names(el.selected)).toEqual([]);
    expect(rowBox(el, 'agent.exe').checked).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(focused(el)).toBe(rowBox(el, 'agent.exe'));
  });

  it('toggles select-all with Enter: selects all, then clears', async () => {
    const el = await mountBetween();
    selectAll(el).focus();
    await userEvent.keyboard('{Enter}');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe', 'libcore.dll']);
    await userEvent.keyboard('{Enter}');
    await el.updateComplete;
    expect(names(el.selected)).toEqual([]);
  });

  it('does not submit an enclosing form on Enter', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><tins-file-table></tins-file-table><button>submit</button></form>',
    );
    const submit = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', submit);
    const el = form.querySelector('tins-file-table')!;
    el.files = FILES;
    await el.updateComplete;
    rowBox(el, 'agent.exe').focus();
    await userEvent.keyboard('{Enter}');
    await el.updateComplete;
    expect(names(el.selected)).toEqual(['agent.exe']);
    expect(submit).not.toHaveBeenCalled();
  });

  it('ignores Enter on a disabled checkbox and Enter with a modifier', async () => {
    const el = await mountBetween();
    const box = rowBox(el, 'sync.exe');
    box.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await el.updateComplete;
    expect(box.checked).toBe(false);
    rowBox(el, 'agent.exe').focus();
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    await el.updateComplete;
    expect(names(el.selected)).toEqual([]);
  });
});

/** Every documented state, scanned with the WCAG 2.2 A/AA/AAA rule set. */
const noop = () => Promise.resolve();
const STATES: [string, (el: TinsFileTable) => Promise<void>, FileEntry[]][] = [
  ['none selected', noop, FILES],
  ['partially selected', (el) => check(el, 'agent.exe'), FILES],
  [
    'all selected',
    async (el) => {
      selectAll(el).click();
      await el.updateComplete;
    },
    FILES,
  ],
  ['empty', noop, []],
  ['nothing selectable', noop, FILES.filter((f) => f.status !== 'available')],
];

describe('tins-file-table accessibility', () => {
  it.each(STATES)(
    '%s state has no WCAG 2.2 A/AA/AAA violations',
    async (state, setup, files) => {
      const main = await fixture<HTMLElement>(
        '<main><h1>t</h1><tins-file-table></tins-file-table></main>',
      );
      const el = main.querySelector('tins-file-table')!;
      el.files = files;
      await el.updateComplete;
      await setup(el);
      await expectNoA11yViolations(el, {
        context: `tins-file-table (${state})`,
      });
    },
  );

  it('meets 44x44 target size on every enabled control', async () => {
    const el = await mount();
    await check(el, 'agent.exe');
    assertTargetSize(el);
  });

  it.each([
    ['select-all', (el: TinsFileTable) => selectAll(el)],
    ['row checkbox', (el: TinsFileTable) => rowBox(el, 'agent.exe')],
    ['download button', (el: TinsFileTable) => download(el)],
    ['table region', (el: TinsFileTable) => q<HTMLElement>(el, '.scroll')],
  ])('%s shows a visible focus indicator', async (_name, target) => {
    const el = await mount();
    await check(el, 'agent.exe');
    assertFocusVisible(target(el));
  });

  it('does not cause horizontal page scroll at 320px; the table scrolls in its region', async () => {
    const wrap = await fixture<HTMLDivElement>(
      '<div style="inline-size: 320px"><tins-file-table></tins-file-table></div>',
    );
    const el = wrap.querySelector('tins-file-table')!;
    el.files = FILES;
    await el.updateComplete;
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    const toolbar = q<HTMLElement>(el, '.toolbar');
    expect(toolbar.scrollWidth).toBeLessThanOrEqual(toolbar.clientWidth);
    const region = q<HTMLElement>(el, '.scroll');
    expect(getComputedStyle(region).overflowX).toBe('auto');
    expect(region.tabIndex).toBe(0);
  });
});

describe('tins-file-table row colours', () => {
  // Transitions are turned off so computed colours are final as soon as they are read.
  const mountStill = () => mount(FILES, 'style="--tins-motion-duration: 0s"');
  const bg = (row: Element) => getComputedStyle(row).backgroundColor;
  const rowOf = (el: TinsFileTable, name: string) =>
    bodyRows(el).find((r) => r.cells[1].textContent!.trim() === name)!;

  // Hover the device cell: inside the row and away from the checkbox.
  const hover = (row: HTMLTableRowElement) => userEvent.hover(row.cells[2]);

  it('shows default, hovered, selected and selected+hover as four distinct colours', async () => {
    const el = await mountStill();
    const agent = rowOf(el, 'agent.exe');
    const libcore = rowOf(el, 'libcore.dll');
    const base = bg(agent);

    await hover(agent);
    const hovered = bg(agent);
    expect(hovered).not.toBe(base);

    await check(el, 'agent.exe');
    const selectedHovered = bg(agent);

    await hover(libcore);
    const selected = bg(agent);
    expect(bg(libcore)).toBe(hovered);

    expect(new Set([base, hovered, selected, selectedHovered]).size).toBe(4);
  });

  it('returns to the default colour when the pointer leaves an unselected row', async () => {
    const el = await mountStill();
    const agent = rowOf(el, 'agent.exe');
    const base = bg(agent);
    await hover(agent);
    expect(bg(agent)).not.toBe(base);
    await userEvent.unhover(agent.cells[2]);
    expect(bg(agent)).toBe(base);
  });

  it('shows the selected colour after keyboard selection and the default after unselecting', async () => {
    const el = await mountStill();
    const agent = rowOf(el, 'agent.exe');
    const base = bg(agent);
    rowBox(el, 'agent.exe').focus();
    await userEvent.keyboard(' ');
    await el.updateComplete;
    const selected = bg(agent);
    expect(selected).not.toBe(base);
    await userEvent.keyboard(' ');
    await el.updateComplete;
    expect(bg(agent)).toBe(base);
  });

  it('shows the hover colour but no pointer cursor on a row that cannot be selected', async () => {
    const el = await mountStill();
    const sync = rowOf(el, 'sync.exe');
    const agent = rowOf(el, 'agent.exe');
    const base = bg(sync);
    await hover(agent);
    const hovered = bg(agent);
    await hover(sync);
    expect(bg(sync)).not.toBe(base);
    expect(bg(sync)).toBe(hovered);
    expect(getComputedStyle(sync).cursor).not.toBe('pointer');
  });

  it('keeps the default colour and cursor on the empty-state row', async () => {
    const el = await mount([], 'style="--tins-motion-duration: 0s"');
    const [empty] = bodyRows(el);
    const base = bg(empty);
    await userEvent.hover(empty.cells[0]);
    expect(bg(empty)).toBe(base);
    expect(getComputedStyle(empty).cursor).not.toBe('pointer');
  });
});
