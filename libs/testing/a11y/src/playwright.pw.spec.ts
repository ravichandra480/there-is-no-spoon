import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { chromium, type Browser, type Page } from '@playwright/test';
import {
  assertNoReflowOverflow,
  assertTextSpacingSafe,
  excludeRule,
  PageA11yError,
  scanPage,
} from './playwright.js';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

const shell = (body: string) =>
  `<!doctype html><html lang="en"><head><title>Fixture</title><meta name="viewport" content="width=device-width"></head><body style="margin:0;color:#000;background:#fff">${body}</body></html>`;

async function open(body: string, width = 1024): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width, height: 800 },
  });
  page = await context.newPage();
  await page.setContent(shell(body));
  return page;
}

describe('scanPage', () => {
  it('passes and attaches a report for an accessible page', async () => {
    const info = { attach: vi.fn().mockResolvedValue(undefined) };
    const p = await open(`<main><h1>Hello</h1><p>Body text</p></main>`);
    await expect(scanPage(p, info, { name: 'axe:fixture' })).resolves.toEqual(
      [],
    );
    expect(info.attach).toHaveBeenCalledWith(
      'axe:fixture',
      expect.objectContaining({ contentType: 'application/json' }),
    );
    await p.context().close();
  });

  it('fails with page-level violations (heading order, enhanced contrast)', async () => {
    const info = { attach: vi.fn().mockResolvedValue(undefined) };
    const p = await open(
      `<main><h1>A</h1><h3>Skipped</h3><p style="color:#767676">low</p></main>`,
    );
    const err = (await scanPage(p, info).catch(
      (e: unknown) => e,
    )) as PageA11yError;
    expect(err).toBeInstanceOf(PageA11yError);
    const rules = err.findings.map((f) => f.rule);
    expect(rules).toContain('heading-order');
    expect(rules).toContain('color-contrast-enhanced');
    await p.context().close();
  });

  it('applies exclusions', async () => {
    const info = { attach: vi.fn().mockResolvedValue(undefined) };
    const p = await open(
      `<main><h1>A</h1><p class="legal" style="color:#767676">fine print</p></main>`,
    );
    const exclusions = [
      excludeRule({
        rule: 'color-contrast-enhanced',
        selector: '.legal',
        reason: 'Fixture exclusion for testing',
        issue: '#1',
      }),
    ];
    await expect(scanPage(p, info, { exclusions })).resolves.toEqual([]);
    await p.context().close();
  });
});

describe('assertNoReflowOverflow', () => {
  it('passes for fluid content at 320px', async () => {
    const p = await open(
      `<main><h1>Fluid</h1><p>Some wrapping text that reflows nicely.</p></main>`,
    );
    await expect(assertNoReflowOverflow(p)).resolves.toBeUndefined();
    await p.context().close();
  });

  it('fails when a fixed-width element forces horizontal scrolling', async () => {
    const p = await open(`<main><div style="width:600px">wide</div></main>`);
    await expect(assertNoReflowOverflow(p)).rejects.toThrow(
      /horizontal-scroll/,
    );
    await p.context().close();
  });
});

describe('assertTextSpacingSafe', () => {
  it('passes when containers grow with text', async () => {
    const p = await open(
      `<main><p style="max-width:20em">Text that can grow.</p></main>`,
    );
    await expect(assertTextSpacingSafe(p)).resolves.toBeUndefined();
    await p.context().close();
  });

  it('fails when fixed-height overflow:hidden clips text after spacing overrides (incl. shadow DOM)', async () => {
    const p = await open(`<div id="h"></div>`);
    await p.evaluate(() => {
      document.getElementById('h')!.attachShadow({ mode: 'open' }).innerHTML =
        '<div style="height:20px;width:120px;overflow:hidden;font-size:16px;line-height:1">clipped label text here</div>';
    });
    await expect(assertTextSpacingSafe(p)).rejects.toThrow(/clipped-text/);
    await p.context().close();
  });

  it('ignores visually hidden text (intentionally clipped, still read by screen readers)', async () => {
    const hidden =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0';
    const p = await open(
      `<main><table><caption style="${hidden}">A caption only screen readers need</caption><tr><td>x</td></tr></table></main>`,
    );
    await expect(assertTextSpacingSafe(p)).resolves.toBeUndefined();
    await expect(assertNoReflowOverflow(p)).resolves.toBeUndefined();
    await p.context().close();
  });

  it('still flags a small but visible clipped box', async () => {
    const p = await open(
      `<main><div style="width:40px;height:16px;overflow:hidden;line-height:1">clipped label text here</div></main>`,
    );
    await expect(assertTextSpacingSafe(p)).rejects.toThrow(/clipped-text/);
    await p.context().close();
  });
});
