import { TestBed } from '@angular/core/testing';
import { THEMES } from '@tins/ui-tokens';
import { expectNoA11yViolations } from '@tins/testing-a11y/vitest';
import { DEMO_ROUTES } from '../routes.manifest';
import { renderApp } from '../testing';
import { SAMPLE_FILES } from './file-table.page';

/** Whitespace-normalized text of each file in the download alert. */
const itemTexts = (dialog: HTMLDialogElement) =>
  [...dialog.querySelectorAll('li')].map((li) =>
    li.textContent!.replace(/\s+/g, ' ').trim(),
  );

afterEach(() => {
  TestBed.resetTestingModule();
  document.documentElement.removeAttribute('data-theme');
});

describe('showcase pages', () => {
  it.each(DEMO_ROUTES.map((r) => [r.path || '/', r] as const))(
    'deep link %s renders the page directly',
    async (_p, route) => {
      const { root } = await renderApp(`/${route.path}`);
      expect(root.querySelector('main h1')?.textContent).toBe(route.title);
      if (route.element) {
        const els = root.querySelectorAll(route.element);
        expect(els.length).toBeGreaterThan(1);
        // Upgraded custom elements (rendered shadow root), registered by the page's lazy chunk.
        els.forEach((el) => expect(el.shadowRoot).not.toBeNull());
      }
    },
  );

  it('file table page shows every documented state with the sample data', async () => {
    const { root } = await renderApp('/file-table');
    const [sample, scheduled, empty] = [
      ...root.querySelectorAll('tins-file-table'),
    ];
    expect(sample.shadowRoot?.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(
      scheduled.shadowRoot?.querySelector<HTMLInputElement>('.toolbar input')
        ?.disabled,
    ).toBe(true);
    expect(empty.shadowRoot?.querySelector('td.empty')).not.toBeNull();
    expect(root.querySelector('pre code')?.textContent).toContain(
      '<tins-file-table',
    );
  });

  it('file table download opens a dialog listing device and path of each selected file', async () => {
    const { fixture, root } = await renderApp('/file-table');
    const table = root.querySelector('#sample-files')!;
    const shadow = table.shadowRoot!;
    shadow.querySelector<HTMLInputElement>('.toolbar input')!.click();
    await fixture.whenStable();
    expect(root.querySelector('#selection-event')?.textContent).toContain(
      '2 file(s)',
    );
    await (table as Element & { updateComplete: Promise<unknown> })
      .updateComplete;
    shadow.querySelector<HTMLButtonElement>('button[data-action="download"]')!.click();
    await fixture.whenStable();
    const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    const title = document.getElementById(
      dialog.getAttribute('aria-labelledby')!,
    );
    expect(title?.textContent?.trim()).toBe('Download requested');
    const described = dialog
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => document.getElementById(id));
    expect(described).toEqual([
      dialog.querySelector('#download-dialog-summary'),
      dialog.querySelector('#download-dialog-files'),
    ]);
    expect(described[0]?.textContent?.trim()).toBe(
      'These 2 file(s) would be downloaded:',
    );
    expect(itemTexts(dialog)).toEqual([
      'Path: \\srv\\share2\\apps\\bin\\agent.exe Device: Birch',
      'Path: \\srv\\share1\\apps\\bin\\libcore.dll Device: Cedar',
    ]);
    expect(document.activeElement).toBe(dialog.querySelector('tins-button'));
    await expectNoA11yViolations(dialog, { context: 'download dialog' });
    dialog
      .querySelector('tins-button')!
      .shadowRoot!.querySelector('button')!
      .click();
    expect(dialog.open).toBe(false);
  });

  it('file table download dialog lists only available files from a tins-download event', async () => {
    const { fixture, root } = await renderApp('/file-table');
    const table = root.querySelector('#sample-files')!;
    const files = [SAMPLE_FILES[0], SAMPLE_FILES[1]]; // sync.exe (scheduled), agent.exe (available)
    table.dispatchEvent(
      new CustomEvent('tins-download', {
        bubbles: true,
        composed: true,
        detail: { files },
      }),
    );
    await fixture.whenStable();
    const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBe(true);
    expect(itemTexts(dialog)).toEqual([
      'Path: \\srv\\share2\\apps\\bin\\agent.exe Device: Birch',
    ]);
    dialog.close();
  });

  it('file table download with some files selected lists the path and device of each', async () => {
    const { fixture, root } = await renderApp('/file-table');
    const table = root.querySelector('#sample-files')!;
    const shadow = table.shadowRoot!;
    shadow
      .querySelector<HTMLInputElement>('input[aria-label="Select libcore.dll"]')!
      .click();
    await fixture.whenStable();
    await (table as Element & { updateComplete: Promise<unknown> })
      .updateComplete;
    shadow.querySelector<HTMLButtonElement>('button[data-action="download"]')!.click();
    await fixture.whenStable();
    const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBe(true);
    expect(
      dialog.querySelector('#download-dialog-summary')?.textContent?.trim(),
    ).toBe('These 1 file(s) would be downloaded:');
    expect(itemTexts(dialog)).toEqual([
      'Path: \\srv\\share1\\apps\\bin\\libcore.dll Device: Cedar',
    ]);
    dialog.close();
  });

  it('file table download opens no dialog when no file in the event is available', async () => {
    const { fixture, root } = await renderApp('/file-table');
    const table = root.querySelector('#sample-files')!;
    table.dispatchEvent(
      new CustomEvent('tins-download', {
        bubbles: true,
        composed: true,
        detail: {
          files: SAMPLE_FILES.filter((f) => f.status !== 'available'),
        },
      }),
    );
    await fixture.whenStable();
    expect(root.querySelector<HTMLDialogElement>('dialog')!.open).toBe(false);
  });

  describe.each(['light', ...THEMES.filter((t) => t !== 'light')])(
    '%s theme',
    (theme) => {
      it.each(DEMO_ROUTES.map((r) => [r.path || '/', r] as const))(
        '%s has no WCAG 2.2 A/AA/AAA violations',
        async (_p, route) => {
          document.documentElement.setAttribute('data-theme', theme);
          const { root } = await renderApp(`/${route.path}`);
          document.documentElement.setAttribute('data-theme', theme);
          await expectNoA11yViolations(root, {
            context: `${route.title} page (${theme})`,
          });
        },
      );
    },
  );
});
