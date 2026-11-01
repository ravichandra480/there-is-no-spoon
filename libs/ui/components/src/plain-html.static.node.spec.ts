import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize, sep } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Spec: web-component-library › "Use in plain HTML".
 * Serves the *built* files (dist, not src) from a plain Node HTTP server (no Vite, no bundler, no
 * module rewriting) and loads the "Plain HTML with an import map" example from README.md verbatim.
 * The page must register `tins-file-table`, render its rows and let the user select a file.
 * The test target depends on `build`, so `dist/` is current.
 */

const workspace = join(import.meta.dirname, '../../../..');
const readme = readFileSync(join(import.meta.dirname, '../README.md'), 'utf8');

/** The first ```html block under "### Plain HTML with an import map" in README.md. */
function readmeExample(): string {
  const start = readme.indexOf('### Plain HTML with an import map');
  const match = /```html\n([\s\S]*?)```/.exec(readme.slice(start));
  if (start < 0 || !match)
    throw new Error('README plain HTML example not found');
  return match[1];
}

/** URL prefix → directory, matching the layout the README describes. */
const mounts: Record<string, string> = {
  '/ui-components/': join(workspace, 'dist/libs/ui/components'),
  '/ui-tokens/': join(workspace, 'dist/libs/ui/tokens'),
  '/node_modules/': join(workspace, 'node_modules'),
};

const types: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
};

const pages: Record<string, string> = {
  '/': readmeExample(),
  // The same page without its import map, loading the built file by URL: shows why the map is needed.
  '/no-import-map.html': readmeExample()
    .replace(/<script type="importmap">[\s\S]*?<\/script>/, '')
    .replace(
      "import '@tins/ui-components/file-table';",
      "import '/ui-components/file-table.js';",
    ),
};

let server: Server;
let browser: Browser;
let origin: string;

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url!, 'http://x').pathname);
    if (path in pages) {
      res.writeHead(200, { 'content-type': 'text/html' }).end(pages[path]);
      return;
    }
    const prefix = Object.keys(mounts).find((p) => path.startsWith(p));
    const dir = prefix && mounts[prefix];
    const file = dir && normalize(join(dir, path.slice(prefix.length)));
    if (!file || !file.startsWith(dir + sep)) {
      res.writeHead(404).end();
      return;
    }
    try {
      const body = await readFile(file);
      res
        .writeHead(200, {
          'content-type': types[extname(file)] ?? 'application/octet-stream',
        })
        .end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await new Promise((r) => server?.close(r));
});

async function open(path: string): Promise<{ page: Page; errors: string[] }> {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(origin + path);
  return { page, errors };
}

describe('built bundle served as static files', () => {
  it('without an import map, the bare "lit" import cannot be resolved', async () => {
    const { page, errors } = await open('/no-import-map.html');
    await expect
      .poll(() => errors.join('\n'))
      .toMatch(/Failed to resolve module specifier "lit"/);
    expect(
      await page.evaluate(() => !!customElements.get('tins-file-table')),
    ).toBe(false);
    await page.close();
  });

  it('with the README import map, tins-file-table registers, renders rows and selects a file', async () => {
    const { page, errors } = await open('/');

    await page.waitForFunction(() => customElements.get('tins-file-table'));
    expect(
      await page.evaluate(() => {
        const el = document.querySelector('tins-file-table')!;
        return el instanceof customElements.get('tins-file-table')!;
      }),
    ).toBe(true);

    // Rows from the declarative `files` attribute (Playwright locators pierce the shadow root).
    const table = page.locator('tins-file-table');
    await expect.poll(() => table.locator('tbody tr').count()).toBe(2);
    expect(await table.locator('tbody tr').allInnerTexts()).toEqual([
      expect.stringContaining('agent.exe'),
      expect.stringContaining('sync.exe'),
    ]);

    // Select the available file.
    const events: string[][] = [];
    await page.exposeFunction('record', (names: string[]) =>
      events.push(names),
    );
    await page.evaluate(() =>
      document
        .querySelector('tins-file-table')!
        .addEventListener('tins-selection-change', (e) =>
          (window as unknown as { record(n: string[]): void }).record(
            (
              e as CustomEvent<{ selected: readonly { name: string }[] }>
            ).detail.selected.map((f) => f.name),
          ),
        ),
    );
    const box = table.getByRole('checkbox', { name: 'Select agent.exe' });
    await box.check();
    expect(await box.isChecked()).toBe(true);
    await expect
      .poll(() => table.locator('[part~="count"]').innerText())
      .toBe('Selected 1');
    await expect.poll(() => events).toEqual([['agent.exe']]);

    // The unavailable file cannot be selected.
    expect(
      await table
        .getByRole('checkbox', { name: 'Select sync.exe' })
        .isDisabled(),
    ).toBe(true);

    // The tokens stylesheet was served and applied.
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--tins-color-primary')
          .trim(),
      ),
    ).not.toBe('');

    expect(errors).toEqual([]);
    await page.close();
  });
});
