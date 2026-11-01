import { expect } from '@playwright/test';
import { scanPage } from '@tins/testing-a11y/playwright';
import { THEMES } from '../src/support/routes';
import { Then } from './fixtures';

Then(
  'the page has no accessibility violations',
  async ({ page, world, $testInfo }) => {
    const { url, theme } = world.opened;
    await scanPage(page, $testInfo, { name: `axe:${url}:${theme}` });
  },
);

Then(
  'the page has no accessibility violations in the {string} state',
  async ({ page, world, $testInfo }, state: string) => {
    const { url, theme } = world.opened;
    await scanPage(page, $testInfo, { name: `axe:${url}:${state}:${theme}` });
  },
);

Then(
  'the theme menu offers every scanned theme and "match my device"',
  async ({ page }) => {
    const values = await page
      .locator('#theme-select option')
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
    expect(values).toContain('system');
    expect(values.filter((v) => v !== 'system').sort()).toEqual(
      [...THEMES].sort(),
    );
  },
);
