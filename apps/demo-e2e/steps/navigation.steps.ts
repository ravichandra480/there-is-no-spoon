import { expect } from '@playwright/test';
import {
  DEMO_ROUTES,
  SITE_NAME,
  THEMES,
  type Theme,
  urlOf,
} from '../src/support/routes';
import { Given, Then, When } from './fixtures';

Given(
  'the user opens the {string} page',
  async ({ demo, world }, url: string) => {
    await demo.open(url);
    world.opened = { url, theme: 'light' };
  },
);

Given(
  'the user opens the {string} page in the {string} theme',
  async ({ demo, world }, url: string, theme: string) => {
    if (!THEMES.includes(theme as Theme))
      throw new Error(
        `Unknown theme "${theme}"; shipped: ${THEMES.join(', ')}`,
      );
    await demo.open(url, theme as Theme);
    world.opened = { url, theme: theme as Theme };
  },
);

When(
  'the user follows the {string} link in the main navigation',
  async ({ page }, name: string) => {
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name, exact: true })
      .click();
  },
);

Then('the address is {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL(path);
});

Then('the page title is {string}', async ({ page }, title: string) => {
  await expect(page).toHaveTitle(`${title} · ${SITE_NAME}`);
});

Then('the main heading reads {string}', async ({ page }, text: string) => {
  await expect(page.locator('main h1')).toHaveText(text);
});

Then('the page has exactly one main heading', async ({ page }) => {
  await expect(page.locator('main h1')).toHaveCount(1);
});

// Reads the route manifest, so a new component page is checked without editing this feature.
Then(
  "every component page's custom elements are upgraded",
  async ({ demo, page }) => {
    for (const route of DEMO_ROUTES) {
      const element = route.element;
      if (!element) continue;
      await demo.open(urlOf(route));
      expect(await page.locator(element).count()).toBeGreaterThan(0);
      const upgraded = await page.evaluate(
        (tag) =>
          [...document.querySelectorAll(tag)].every((e) => !!e.shadowRoot),
        element,
      );
      expect(
        upgraded,
        `${element} elements on ${urlOf(route)} are upgraded`,
      ).toBe(true);
    }
  },
);
