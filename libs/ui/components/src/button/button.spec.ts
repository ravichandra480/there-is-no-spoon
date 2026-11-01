import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  assertFocusVisible,
  assertTargetSize,
  expectNoA11yViolations,
} from '@tins/testing-a11y/vitest';
import { cleanup, fixture, shadow } from '../testing/fixture.js';
import './index.js';
import type { TinsButton } from './button.js';

afterEach(cleanup);

const inner = (el: TinsButton) => shadow(el, 'button') as HTMLButtonElement;

/** Every documented state, scanned with the AAA rule set plus target-size and focus checks. */
const STATES: [string, string][] = [
  ['primary', '<tins-button>Save</tins-button>'],
  ['secondary', '<tins-button variant="secondary">Cancel</tins-button>'],
  ['disabled', '<tins-button disabled>Save</tins-button>'],
  ['toggle off', '<tins-button toggle>Bold</tins-button>'],
  ['toggle on', '<tins-button toggle pressed>Bold</tins-button>'],
  [
    'icon-only',
    '<tins-button label="Close"><svg slot="icon" aria-hidden="true" viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg></tins-button>',
  ],
  ['submit', '<tins-button type="submit">Send</tins-button>'],
];

describe('tins-button accessibility', () => {
  it.each(STATES)(
    '%s state has no WCAG 2.2 A/AA/AAA violations',
    async (state, markup) => {
      const el = await fixture<TinsButton>(
        `<main><h1>t</h1>${markup}</main>`,
      ).then((m) => m.querySelector('tins-button')!);
      await expectNoA11yViolations(el, { context: `tins-button (${state})` });
    },
  );

  it.each(STATES.filter(([s]) => s !== 'disabled'))(
    '%s state meets 44x44 target size and focus appearance',
    async (_s, markup) => {
      const el = await fixture<TinsButton>(markup);
      assertTargetSize(el);
      assertFocusVisible(el);
    },
  );

  it('fails the scan when an icon-only button has no label', async () => {
    const el = await fixture<TinsButton>(
      '<tins-button><svg slot="icon" aria-hidden="true"></svg></tins-button>',
    );
    await expect(expectNoA11yViolations(el)).rejects.toThrow(/button-name/);
  });

  it('uses the label attribute as the accessible name', async () => {
    const el = await fixture<TinsButton>(
      '<tins-button label="Close">X</tins-button>',
    );
    expect(inner(el).getAttribute('aria-label')).toBe('Close');
  });

  it('exposes aria-pressed only for toggle buttons', async () => {
    const plain = await fixture<TinsButton>('<tins-button>Go</tins-button>');
    expect(inner(plain).hasAttribute('aria-pressed')).toBe(false);
    const toggle = await fixture<TinsButton>(
      '<tins-button toggle>Bold</tins-button>',
    );
    expect(inner(toggle).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('tins-button API', () => {
  it('reflects disabled to the attribute and disables the native button', async () => {
    const el = await fixture<TinsButton>('<tins-button>Save</tins-button>');
    el.disabled = true;
    await el.updateComplete;
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(inner(el).disabled).toBe(true);
  });

  it('defaults variant to primary and reflects it', async () => {
    const el = await fixture<TinsButton>('<tins-button>Save</tins-button>');
    expect(el.getAttribute('variant')).toBe('primary');
  });

  it('click() and focus() delegate to the native button', async () => {
    const el = await fixture<TinsButton>('<tins-button>Save</tins-button>');
    const spy = vi.fn();
    el.addEventListener('click', spy);
    el.click();
    expect(spy).toHaveBeenCalledTimes(1);
    el.focus();
    expect(el.shadowRoot!.activeElement).toBe(inner(el));
  });

  it('does not emit click while disabled (even on programmatic click)', async () => {
    const el = await fixture<TinsButton>(
      '<tins-button disabled>Save</tins-button>',
    );
    const spy = vi.fn();
    el.addEventListener('click', spy);
    el.click();
    el.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('tins-button keyboard', () => {
  it('activates with Enter and Space', async () => {
    const el = await fixture<TinsButton>('<tins-button>Save</tins-button>');
    const spy = vi.fn();
    el.addEventListener('click', spy);
    el.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('is skipped by Tab when disabled', async () => {
    const wrap = await fixture<HTMLDivElement>(
      '<div><button id="a">a</button><tins-button disabled>x</tins-button><button id="b">b</button></div>',
    );
    (wrap.querySelector('#a') as HTMLButtonElement).focus();
    await userEvent.tab();
    expect(document.activeElement?.id).toBe('b');
  });

  it('is reached by Tab when enabled (focus delegated to the inner button)', async () => {
    const wrap = await fixture<HTMLDivElement>(
      '<div><button id="a">a</button><tins-button>x</tins-button></div>',
    );
    (wrap.querySelector('#a') as HTMLButtonElement).focus();
    await userEvent.tab();
    const host = wrap.querySelector('tins-button')!;
    expect(document.activeElement).toBe(host);
    expect(host.shadowRoot!.activeElement).toBe(inner(host));
  });
});

describe('tins-button events', () => {
  it('toggle emits tins-change that bubbles and is composed', async () => {
    const wrap = await fixture<HTMLDivElement>(
      '<div><tins-button toggle>Bold</tins-button></div>',
    );
    const el = wrap.querySelector('tins-button')!;
    const spy = vi.fn();
    wrap.addEventListener('tins-change', spy);
    await userEvent.click(el);
    expect(el.pressed).toBe(true);
    expect(el.hasAttribute('pressed')).toBe(true);
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ pressed: true });
    expect(event.bubbles && event.composed).toBe(true);
    await el.updateComplete;
    expect(inner(el).getAttribute('aria-pressed')).toBe('true');
  });

  it('native click bubbles out of the shadow root with the host as target', async () => {
    const wrap = await fixture<HTMLDivElement>(
      '<div><tins-button>Go</tins-button></div>',
    );
    const spy = vi.fn((e: Event) => e.target);
    wrap.addEventListener('click', spy);
    await userEvent.click(wrap.querySelector('tins-button')!);
    expect(spy.mock.results[0].value).toBe(wrap.querySelector('tins-button'));
  });
});

describe('tins-button forms', () => {
  it('type=submit submits the owning form including name/value', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><input name="q" value="x"><tins-button type="submit" name="action" value="save">Save</tins-button></form>',
    );
    const submitted = vi.fn((e: SubmitEvent) => {
      e.preventDefault();
      return Object.fromEntries(new FormData(form, e.submitter));
    });
    form.addEventListener('submit', submitted);
    const el = form.querySelector('tins-button')!;
    expect(el.form).toBe(form);
    await userEvent.click(el);
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(submitted.mock.results[0].value).toEqual({ q: 'x', action: 'save' });
  });

  it('type=submit without a name submits the form', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><tins-button type="submit">Save</tins-button></form>',
    );
    const submitted = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', submitted);
    await userEvent.click(form.querySelector('tins-button')!);
    expect(submitted).toHaveBeenCalledTimes(1);
  });

  it('type=reset resets the owning form', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><input name="q" value="a"><tins-button type="reset">Reset</tins-button></form>',
    );
    const input = form.querySelector('input')!;
    input.value = 'changed';
    await userEvent.click(form.querySelector('tins-button')!);
    expect(input.value).toBe('a');
  });

  it('type=button does not submit', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><tins-button>Do</tins-button></form>',
    );
    const submitted = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', submitted);
    await userEvent.click(form.querySelector('tins-button')!);
    expect(submitted).not.toHaveBeenCalled();
  });
});
