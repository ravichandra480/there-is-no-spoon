import { expect } from '@playwright/test';
import { Then, When } from './fixtures';

When('the user presses Tab', async ({ demo }) => {
  await demo.pressTab();
});

When('the user presses Enter', async ({ page }) => {
  await page.keyboard.press('Enter');
});

When('the user presses Space', async ({ page }) => {
  await page.keyboard.press('Space');
});

When(
  'the user presses Tab until the theme menu is focused',
  async ({ demo, world }) => {
    world.focusPath = await demo.tabTo((f) => f.id === 'theme-select');
  },
);

Then('the focus indicator is visible', async ({ demo }) => {
  await demo.expectFocusVisible();
});

Then(
  'the {string} link is focused and in view',
  async ({ demo, page }, name: string) => {
    expect((await demo.focused())?.text).toBe(name);
    await expect(page.getByRole('link', { name })).toBeInViewport();
  },
);

Then('the main content is focused', async ({ demo }) => {
  expect((await demo.focused())?.id).toBe('main');
});

Then('focus is inside the main content', async ({ page }) => {
  expect(
    await page.evaluate(() => !!document.activeElement?.closest('main')),
  ).toBe(true);
});

Then('no disabled control was focused on the way', ({ world }) => {
  expect(
    world.focusPath.filter((f) => f.disabled),
    'disabled controls must not receive focus',
  ).toEqual([]);
});

Then(
  'pressing Tab repeatedly moves through more than 5 elements without getting trapped',
  async ({ demo }) => {
    const visited = new Set<string>();
    for (let i = 0; i < 80; i++) {
      await demo.pressTab();
      const f = await demo.focused();
      if (!f) break; // focus left the document (or returned to body): not trapped
      visited.add(`${f.tag}#${f.id}:${f.label ?? f.text}`);
    }
    expect(visited.size).toBeGreaterThan(5);
  },
);

// Keyboard selection in a native <select> is OS-specific; the value is changed through the control.
When(
  'the user chooses {string} in the theme menu',
  async ({ page }, theme: string) => {
    await page.locator('#theme-select').selectOption(theme);
  },
);

Then('the page uses the {string} theme', async ({ page }, theme: string) => {
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
});
