import { expect } from '@playwright/test';
import {
  assertNoReflowOverflow,
  assertTextSpacingSafe,
  findLayoutProblems,
} from '@tins/testing-a11y/playwright';
import { Given, Then, When } from './fixtures';

Given(
  'the viewport is {int} by {int} CSS px',
  async ({ page }, width: number, height: number) => {
    await page.setViewportSize({ width, height });
  },
);

Then(
  'the page reflows at a width of {int} CSS px',
  async ({ page }, width: number) => {
    await assertNoReflowOverflow(page, width);
  },
);

Then('no text is clipped with increased text spacing', async ({ page }) => {
  await assertTextSpacingSafe(page);
});

When('the root font size is doubled', async ({ page }) => {
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
});

Then('the page has no layout problems', async ({ page }) => {
  expect(await findLayoutProblems(page)).toEqual([]);
});

// Reduced motion (`@reduced-motion` scenarios run with prefers-reduced-motion: reduce).

When(
  'the user hovers over the {string} button, moves away and hovers again',
  async ({ page }, name: string) => {
    // The first match is the interactive table; later instances show other states.
    const button = page.getByRole('button', { name }).first();
    await button.hover();
    await page.mouse.move(0, 0);
    await button.hover();
  },
);

Then('no animations or transitions are running', async ({ page }) => {
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .map((a) => (a as CSSTransition).transitionProperty ?? a.id),
  );
  expect(running).toEqual([]);
});

Then('buttons have no transition duration', async ({ page }) => {
  const duration = await page.evaluate(() => {
    const button = document
      .querySelector('tins-button')
      ?.shadowRoot?.querySelector('button');
    return button ? getComputedStyle(button).transitionDuration : 'missing';
  });
  expect(duration.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
});

// Forced colors (Chromium only).

Given('forced colors are active', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
});
