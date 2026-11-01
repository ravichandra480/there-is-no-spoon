import { afterEach, describe, expect, it } from 'vitest';
import { A11yAssertionError, assertFocusVisible, assertTargetSize, excludeRule, expectNoA11yViolations } from './vitest.js';

function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
});

const AAA_BUTTON = `<button style="min-width:44px;min-height:44px;color:#000;background:#fff;border:2px solid #000">Save</button>`;

describe('expectNoA11yViolations', () => {
  it('passes for an accessible fixture', async () => {
    await expect(expectNoA11yViolations(mount(`<main><h1>Title</h1>${AAA_BUTTON}</main>`))).resolves.toBeUndefined();
  });

  it('fails for an unlabeled button and reports rule, node and criterion', async () => {
    const el = mount(`<button style="width:44px;height:44px"></button>`);
    const err = await expectNoA11yViolations(el).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(A11yAssertionError);
    expect((err as Error).message).toMatch(/\[button-name\]/);
    expect((err as Error).message).toMatch(/WCAG 4\.1\.2/);
    expect((err as Error).message).toMatch(/at: button/);
  });

  it('fails AAA enhanced contrast for text that only meets AA (4.54:1)', async () => {
    const el = mount(`<p style="color:#767676;background:#fff;font-size:16px">Low contrast text</p>`);
    const err = (await expectNoA11yViolations(el).catch((e: unknown) => e)) as A11yAssertionError;
    expect(err.findings.map((f) => f.rule)).toContain('color-contrast-enhanced');
    expect(err.message).toMatch(/WCAG 1\.4\.6/);
  });

  it('scans inside open shadow roots', async () => {
    const el = mount(`<div id="h"></div>`);
    el.querySelector('#h')!.attachShadow({ mode: 'open' }).innerHTML = `<button style="width:44px;height:44px"></button>`;
    await expect(expectNoA11yViolations(el)).rejects.toThrow(/button-name/);
  });

  it('honours a justified exclusion', async () => {
    const el = mount(`<p class="logo" style="color:#767676;background:#fff">Logo</p>`);
    const exclusions = [excludeRule({ rule: 'color-contrast-enhanced', selector: '.logo', reason: 'Logotype exempt under 1.4.6', issue: '#1' })];
    await expect(expectNoA11yViolations(el, { exclusions })).resolves.toBeUndefined();
  });
});

describe('assertTargetSize', () => {
  it('passes for a 44x44 target', () => {
    expect(() => assertTargetSize(mount(AAA_BUTTON))).not.toThrow();
  });

  it('fails for a 24x24 target', () => {
    const el = mount(`<button style="width:24px;height:24px;padding:0">x</button>`);
    expect(() => assertTargetSize(el)).toThrow(/at least 44x44.*24\.0x24\.0/);
  });

  it('measures interactive elements inside shadow roots', () => {
    const el = mount(`<div id="h"></div>`);
    el.querySelector('#h')!.attachShadow({ mode: 'open' }).innerHTML = `<button style="width:30px;height:30px">x</button>`;
    expect(() => assertTargetSize(el)).toThrow(/tins-target-size/);
  });

  it('ignores disabled controls and exempt selectors', () => {
    const el = mount(`<button disabled style="width:10px;height:10px">x</button><a class="inline" href="#">inline</a>`);
    expect(() => assertTargetSize(el, 44, { exempt: ['a.inline'] })).not.toThrow();
  });
});

describe('assertFocusVisible', () => {
  it('passes for a 3px high-contrast outline', () => {
    const style = document.createElement('style');
    style.textContent = `.ring:focus-visible { outline: 3px solid #000; outline-offset: 2px; }`;
    document.head.append(style);
    const btn = mount(`<button class="ring" style="background:#fff">Ok</button>`).querySelector('button')!;
    expect(() => assertFocusVisible(btn)).not.toThrow();
    style.remove();
  });

  it('passes for a box-shadow ring inside a shadow root (delegated focus)', () => {
    const host = mount(`<div id="h"></div>`).querySelector<HTMLElement>('#h')!;
    const root = host.attachShadow({ mode: 'open', delegatesFocus: true });
    root.innerHTML = `<style>button:focus-visible{outline:none;box-shadow:0 0 0 3px #000}</style><button>Ok</button>`;
    expect(() => assertFocusVisible(host)).not.toThrow();
  });

  it('fails when the outline is removed', () => {
    const btn = mount(`<button style="outline:none">Ok</button>`).querySelector('button')!;
    expect(() => assertFocusVisible(btn)).toThrow(/No visible focus indicator/);
  });

  it('fails a 1px indicator', () => {
    const btn = mount(`<button style="outline:1px solid #000">Ok</button>`).querySelector('button')!;
    expect(() => assertFocusVisible(btn)).toThrow(/at least 2px/);
  });

  it('fails a low-contrast indicator', () => {
    const btn = mount(`<div style="background:#fff"><button style="outline:3px solid #ddd">Ok</button></div>`).querySelector('button')!;
    expect(() => assertFocusVisible(btn)).toThrow(/contrast is .*must be at least 3:1/);
  });

  it('fails when focus is obscured by overlapping content', () => {
    const el = mount(`<button style="outline:3px solid #000;position:relative">Ok</button><div style="position:fixed;inset:0;background:#fff"></div>`);
    expect(() => assertFocusVisible(el.querySelector('button')!)).toThrow(/2\.4\.12|covered/);
  });
});
