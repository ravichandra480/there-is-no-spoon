import type { Page } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';
import {
  expectFocusVisible,
  type FocusInfo,
  focused,
  openPage,
  pressTab,
  tabTo,
} from '../src/support/page';
import type { Theme } from '../src/support/routes';

/** The demo app as seen by step definitions: thin wrappers over `src/support/page.ts`, bound to the page. */
export class Demo {
  constructor(readonly page: Page) {}

  open(url: string, theme?: Theme): Promise<void> {
    return openPage(this.page, url, theme);
  }

  tabTo(match: (f: FocusInfo) => boolean, max?: number): Promise<FocusInfo[]> {
    return tabTo(this.page, match, max);
  }

  pressTab(options?: { shift?: boolean }): Promise<void> {
    return pressTab(this.page, options);
  }

  focused(): Promise<FocusInfo | null> {
    return focused(this.page);
  }

  expectFocusVisible(): Promise<void> {
    return expectFocusVisible(this.page);
  }
}

/** Per-scenario state shared between steps. */
export interface World {
  /** The page the scenario opened and its theme (names accessibility scan reports). */
  opened: { url: string; theme: Theme };
  /** Elements passed on the way by the last "presses Tab until …" step. */
  focusPath: FocusInfo[];
  /** Paths visited by the link crawl. */
  visited: string[];
}

export const test = base.extend<{ demo: Demo; world: World }>({
  demo: async ({ page }, use) => {
    await use(new Demo(page));
  },
  // Playwright fixtures must destructure their dependencies, even when there are none.
  // eslint-disable-next-line no-empty-pattern
  world: async ({}, use) => {
    await use({
      opened: { url: '/', theme: 'light' },
      focusPath: [],
      visited: [],
    });
  },
  // `@reduced-motion` scenarios run in a context that prefers reduced motion.
  reducedMotion: async ({ $tags, reducedMotion }, use) => {
    await use($tags.includes('@reduced-motion') ? 'reduce' : reducedMotion);
  },
});

export const { Given, When, Then } = createBdd(test);
