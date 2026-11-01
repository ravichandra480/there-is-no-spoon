import { type Page, expect } from '@playwright/test';
import {
  contrastRatio,
  NON_TEXT_CONTRAST,
  AAA_FOCUS_THICKNESS,
} from '@tins/testing-a11y';
import { THEME_STORAGE_KEY, type Theme } from './routes';

/** Opens a demo URL (optionally with a saved theme) and waits until Angular and every tins-* element have rendered. */
export async function openPage(
  page: Page,
  url: string,
  theme?: Theme,
): Promise<void> {
  if (theme) {
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [THEME_STORAGE_KEY, theme] as const,
    );
  }
  await page.goto(url);
  await expect(page.locator('main h1')).toBeVisible();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('*')]
      .filter((e) => e.localName.startsWith('tins-'))
      .every(
        (e) =>
          customElements.get(e.localName) &&
          e.shadowRoot &&
          (e as unknown as { hasUpdated?: boolean }).hasUpdated !== false,
      ),
  );
  if (theme)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

export interface FocusInfo {
  /** Light-DOM element that has focus (a custom element host when focus is inside its shadow root). */
  tag: string;
  id: string;
  text: string;
  label: string | null;
  disabled: boolean;
}

/** Describes `document.activeElement` (the host, for focus inside a shadow root). */
export function focused(page: Page): Promise<FocusInfo | null> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    return {
      tag: el.localName,
      id: el.id,
      text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      label: el.getAttribute('label') ?? el.getAttribute('aria-label'),
      disabled: el.hasAttribute('disabled'),
    };
  });
}

/**
 * Presses the key that moves to the next focusable element. WebKit follows Safari's macOS default,
 * where Tab only visits form controls and Option+Tab visits every focusable element (links too).
 */
export async function pressTab(
  page: Page,
  { shift = false } = {},
): Promise<void> {
  const webkit = page.context().browser()?.browserType().name() === 'webkit';
  await page.keyboard.press(
    `${webkit ? 'Alt+' : ''}${shift ? 'Shift+' : ''}Tab`,
  );
}

/**
 * Presses Tab until `match` is focused (keyboard only, no clicks). Fails if it is not reached
 * within `max` presses, i.e. it is not keyboard reachable. Returns every element passed on the way.
 */
export async function tabTo(
  page: Page,
  match: (f: FocusInfo) => boolean,
  max = 40,
): Promise<FocusInfo[]> {
  const path: FocusInfo[] = [];
  for (let i = 0; i < max; i++) {
    await pressTab(page);
    const f = await focused(page);
    if (f) path.push(f);
    if (f && match(f)) return path;
  }
  throw new Error(
    `Not reachable with Tab within ${max} presses. Visited: ${path.map((f) => `${f.tag}(${f.label ?? f.text})`).join(' → ')}`,
  );
}

/**
 * WCAG 2.4.7 / 2.4.13 in the real browser: the deepest focused element (through shadow roots), or
 * an ancestor up to its host, draws an outline ≥ 2px with ≥ 3:1 contrast against the background.
 */
export async function expectFocusVisible(page: Page): Promise<void> {
  const info = await page.evaluate(() => {
    let el: Element | null = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    if (!el || el === document.body) return null;
    const parentOf = (e: Element): Element | null =>
      e.parentElement ?? (e.getRootNode() as ShadowRoot).host ?? null;
    const background = (e: Element | null): string => {
      for (let cur = e; cur; cur = parentOf(cur)) {
        const bg = getComputedStyle(cur).backgroundColor;
        if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg))
          return bg;
      }
      return (
        getComputedStyle(document.documentElement).backgroundColor ||
        'rgb(255, 255, 255)'
      );
    };
    const host = (el.getRootNode() as ShadowRoot).host ?? el;
    for (let cur: Element | null = el; cur; cur = parentOf(cur)) {
      const s = getComputedStyle(cur);
      const width = parseFloat(s.outlineWidth) || 0;
      if (s.outlineStyle !== 'none' && width > 0) {
        return {
          tag: el.localName,
          width,
          color: s.outlineColor,
          background: background(parentOf(cur)),
        };
      }
      if (cur === host) break;
    }
    return { tag: el.localName, width: 0, color: '', background: '' };
  });
  expect(info, 'something must have focus').not.toBeNull();
  if (!info) return;
  expect(
    info.width,
    `focus outline on <${info.tag}> must be ≥ ${AAA_FOCUS_THICKNESS}px`,
  ).toBeGreaterThanOrEqual(AAA_FOCUS_THICKNESS);
  const ratio = contrastRatio(info.color, info.background);
  expect(
    ratio,
    `focus outline ${info.color} on ${info.background} must be ≥ ${NON_TEXT_CONTRAST}:1`,
  ).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST);
}
