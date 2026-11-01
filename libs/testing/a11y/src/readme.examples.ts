/**
 * Compiled by `nx typecheck testing-a11y` to keep README.md examples in sync with the API.
 * Not executed and not part of the library build.
 */
import { expect, test as vitest } from 'vitest';
import { test as pwTest } from '@playwright/test';
import { contrastRatio, excludeRule, meetsContrast, WCAG_TAGS } from '@tins/testing-a11y';
import { assertFocusVisible, assertTargetSize, expectNoA11yViolations } from '@tins/testing-a11y/vitest';
import { assertNoReflowOverflow, assertTextSpacingSafe, scanPage } from '@tins/testing-a11y/playwright';

// --- README: Vitest browser mode ---
vitest('tins-button is accessible', async () => {
  const el = document.createElement('tins-button');
  el.textContent = 'Save';
  document.body.append(el);

  await expectNoA11yViolations(el, { context: 'tins-button default' });
  assertTargetSize(el); // 44x44 CSS px (WCAG 2.5.5)
  assertFocusVisible(el); // ≥2px, ≥3:1, not obscured (WCAG 2.4.7/2.4.12/2.4.13)
});

// --- README: Playwright ---
pwTest('button page has no violations', async ({ page }, testInfo) => {
  await page.goto('/components/button');
  await scanPage(page, testInfo, { name: 'axe:/components/button:light' });
  await assertTextSpacingSafe(page); // WCAG 1.4.12
  await assertNoReflowOverflow(page, 320); // WCAG 1.4.10
});

// --- README: exclusions ---
export const exclusions = [
  excludeRule({
    rule: 'color-contrast-enhanced',
    selector: '.brand-logo',
    reason: 'Logotypes are exempt from WCAG 1.4.6',
    issue: '#123',
  }),
];

// --- README: contrast utilities ---
expect(contrastRatio('#000000', '#ffffff')).toBe(21);
expect(meetsContrast('#595959', '#ffffff', 7)).toBe(true);
export const tags: readonly string[] = WCAG_TAGS;
