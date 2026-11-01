import { type Locator, type Page, expect } from '@playwright/test';
import { pressTab, type FocusInfo, focused } from '../src/support/page';
import { Then, When } from './fixtures';

/** The interactive file table on the demo page (the other instances show empty / scheduled-only states). */
const table = (page: Page) => page.locator('#sample-files');
const checkbox = (page: Page, name: string) =>
  table(page).getByRole('checkbox', { name, exact: true });

/** True when `locator` is the focused element of its own root (document or shadow root). */
const hasFocus = (locator: Locator) =>
  locator.evaluate(
    (el) => (el.getRootNode() as Document | ShadowRoot).activeElement === el,
  );

/** Presses Tab (or Shift+Tab) until `target` has focus. Keyboard only; fails if it is not reachable. */
async function tabUntil(
  page: Page,
  target: Locator,
  { shift = false, max = 40 } = {},
): Promise<FocusInfo[]> {
  const path: FocusInfo[] = [];
  for (let i = 0; i < max; i++) {
    await pressTab(page, { shift });
    const f = await focused(page);
    if (f) path.push(f);
    if (await hasFocus(target)) return path;
  }
  throw new Error(`${target} was not reached with ${shift ? 'Shift+' : ''}Tab`);
}

/** Inside the table, the host is focused; record the focused shadow element's state too. */
async function withShadowState(page: Page, path: FocusInfo[]) {
  const disabled = await table(page).evaluate(
    (el) => !!el.shadowRoot?.activeElement?.matches(':disabled'),
  );
  return path.map((f, i) =>
    i === path.length - 1 ? { ...f, disabled: f.disabled || disabled } : f,
  );
}

When(
  'the user presses Tab until the {string} check box is focused',
  async ({ page, world }, name: string) => {
    world.focusPath = await withShadowState(
      page,
      await tabUntil(page, checkbox(page, name)),
    );
  },
);

When(
  'the user presses Shift+Tab until the {string} check box is focused',
  async ({ page, world }, name: string) => {
    world.focusPath = await withShadowState(
      page,
      await tabUntil(page, checkbox(page, name), { shift: true }),
    );
  },
);

When(
  'the user presses Shift+Tab until the {string} button is focused',
  async ({ page, world }, name: string) => {
    world.focusPath = await tabUntil(
      page,
      table(page).getByRole('button', { name, exact: true }),
      { shift: true },
    );
  },
);

When(
  'the user presses Tab until the {string} table region is focused',
  async ({ page, world }, name: string) => {
    world.focusPath = await tabUntil(
      page,
      table(page).getByRole('region', { name }),
    );
  },
);

When('the user clicks the {string} check box', async ({ page }, name: string) => {
  // click(), not check(): check() asserts the result is checked and would hide a click that clears it.
  await checkbox(page, name).click();
});

When('the user presses Escape', async ({ page }) => {
  await page.keyboard.press('Escape');
});

When(
  'the user presses ArrowRight {int} times',
  async ({ page }, times: number) => {
    for (let i = 0; i < times; i++) await page.keyboard.press('ArrowRight');
  },
);

Then('the {string} check box is disabled', async ({ page }, name: string) => {
  await expect(checkbox(page, name)).toBeDisabled();
});

Then('the {string} check box is enabled', async ({ page }, name: string) => {
  await expect(checkbox(page, name)).toBeEnabled();
});

Then('the {string} check box is checked', async ({ page }, name: string) => {
  // A check mark, not the "mixed" dash.
  await expect(checkbox(page, name)).toBeChecked();
  await expect(checkbox(page, name)).toHaveJSProperty('indeterminate', false);
});

Then('the {string} check box is not checked', async ({ page }, name: string) => {
  // Neither a check mark nor the "mixed" dash.
  await expect(checkbox(page, name)).not.toBeChecked();
  await expect(checkbox(page, name)).toHaveJSProperty('indeterminate', false);
});

Then(
  'the {string} check box is partly checked',
  async ({ page }, name: string) => {
    // The "mixed" dash, not a check mark drawn over it.
    await expect(checkbox(page, name)).toHaveJSProperty('indeterminate', true);
    await expect(checkbox(page, name)).toHaveJSProperty('checked', false);
  },
);

Then('the {string} button is disabled', async ({ page }, name: string) => {
  await expect(
    table(page).getByRole('button', { name, exact: true }),
  ).toBeDisabled();
});

Then('the {string} button is focused', async ({ page }, name: string) => {
  expect(
    await hasFocus(table(page).getByRole('button', { name, exact: true })),
  ).toBe(true);
});

Then('the selection count reads {string}', async ({ page }, text: string) => {
  await expect(table(page).getByRole('status')).toHaveText(text);
});

/** The download alert the demo page shows for a `tins-download` event. */
const downloadAlert = (page: Page) =>
  page.getByRole('alertdialog', { name: 'Download requested' });

Then(
  'the download alert lists these files:',
  async ({ page }, data: { hashes(): { device: string; path: string }[] }) => {
    const alert = downloadAlert(page);
    await expect(alert).toBeVisible();
    // toHaveText normalizes whitespace, so the label/value line breaks read as single spaces.
    await expect(alert.getByRole('listitem')).toHaveText(
      data.hashes().map((r) => `Path: ${r.path} Device: ${r.device}`),
    );
  },
);

Then('the "Close" button in the download alert is focused', async ({ page }) => {
  const close = downloadAlert(page).getByRole('button', {
    name: 'Close',
    exact: true,
  });
  await expect(close).toBeVisible();
  // tins-button delegates focus to its inner <button>; the host is the document's active element.
  await expect
    .poll(() =>
      downloadAlert(page)
        .locator('tins-button')
        .evaluate((el) => document.activeElement === el),
    )
    .toBe(true);
});

Then('the download alert is closed', async ({ page }) => {
  await expect(page.getByRole('alertdialog')).toBeHidden();
});

Then(
  'every path in the download alert is fully visible without horizontal page scroll',
  async ({ page }) => {
    const alert = downloadAlert(page);
    await expect(alert).toBeVisible();
    const problems = await alert.evaluate((dialog) => {
      const out: string[] = [];
      const root = document.documentElement;
      if (root.scrollWidth > root.clientWidth)
        out.push(`page scrolls sideways (${root.scrollWidth} > ${root.clientWidth})`);
      const box = dialog.getBoundingClientRect();
      if (box.left < 0 || box.right > window.innerWidth)
        out.push('alert is wider than the viewport');
      // Measure the block <dd> around each path (inline <code> has no client width).
      for (const dd of dialog.querySelectorAll('li dd:has(code)')) {
        const r = dd.getBoundingClientRect();
        if (dd.scrollWidth > dd.clientWidth + 1 || r.right > box.right + 1)
          out.push(`path clipped: ${dd.textContent}`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  },
);

Then(
  'the {string} table region has scrolled sideways',
  async ({ page }, name: string) => {
    const region = table(page).getByRole('region', { name });
    await expect
      .poll(() => region.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
  },
);

// Row colours. Colours are read after any background transition finishes.

const row = (page: Page, name: string) =>
  table(page).locator('tbody tr', { has: page.getByText(name, { exact: true }) });

async function rowColour(page: Page, name: string): Promise<string> {
  return row(page, name).evaluate(async (r) => {
    await Promise.all(r.getAnimations().map((a) => a.finished));
    return getComputedStyle(r).backgroundColor;
  });
}

/** Hovers the row's device cell: inside the row and away from its checkbox. */
const hoverRow = (page: Page, name: string) => row(page, name).locator('td').nth(2).hover();

Then('the {string} row changes colour when hovered', async ({ page }, name: string) => {
  await page.mouse.move(0, 0);
  const before = await rowColour(page, name);
  await hoverRow(page, name);
  expect(await rowColour(page, name)).not.toBe(before);
});

Then(
  'the {string} row and the hovered {string} row have different colours',
  async ({ page }, selected: string, hovered: string) => {
    await hoverRow(page, hovered);
    expect(await rowColour(page, selected)).not.toBe(await rowColour(page, hovered));
  },
);
