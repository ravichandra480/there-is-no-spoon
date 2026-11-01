# @tins/testing-a11y

Shared accessibility test helpers so **Vitest component tests** and **Playwright e2e tests** check the same
WCAG 2.2 **A / AA / AAA** rule set. Test-only: tagged `scope:testing`, so it may be imported only from
spec files and e2e projects.

| Entry point | Runs in | Exports |
| --- | --- | --- |
| `@tins/testing-a11y` | anywhere | `WCAG_TAGS`, `FORCE_ENABLED_RULES`, `axeRunOptions()`, `excludeRule()`, `contrastRatio()`, `meetsContrast()`, `parseColor()`, `formatFindings()` |
| `@tins/testing-a11y/vitest` | Vitest **browser mode** | `expectNoA11yViolations()`, `runAxe()`, `assertTargetSize()`, `assertFocusVisible()` |
| `@tins/testing-a11y/playwright` | Playwright | `scanPage()`, `applyTextSpacing()`, `assertTextSpacingSafe()`, `assertNoReflowOverflow()`, `findLayoutProblems()` |

## Rule set

axe-core tags `wcag2a wcag2aa wcag2aaa wcag21a wcag21aa wcag22aa best-practice`, plus rules axe disables by
default but the AAA target needs: `color-contrast-enhanced` (1.4.6), `identical-links-same-purpose` (2.4.9),
`meta-refresh-no-exceptions` (2.2.4/3.2.5), `target-size` (2.5.8).

axe-core automates only part of AAA, so the helpers add custom checks:

| Check | WCAG | Helper |
| --- | --- | --- |
| Pointer targets ≥ 44×44 CSS px | 2.5.5 | `assertTargetSize(el, 44)` |
| Focus indicator present, ≥ 2px, ≥ 3:1, not obscured | 2.4.7, 2.4.11–2.4.13, 1.4.11 | `assertFocusVisible(el)` |
| No horizontal scroll / clipped text at 320px | 1.4.10 | `assertNoReflowOverflow(page, 320)` |
| Text-spacing override keeps content intact (incl. shadow DOM) | 1.4.12 | `assertTextSpacingSafe(page)` |
| Token contrast ≥ 7:1 / 4.5:1 / 3:1 | 1.4.6, 1.4.11 | `contrastRatio()`, `meetsContrast()` |

Failures list the rule id, the node, and the WCAG criterion:

```
1 accessibility violation(s) in tins-button default:
1) [button-name] Buttons must have discernible text (WCAG 4.1.2, critical)
   at: tins-button >>> button
```

## Vitest (browser mode)

```ts
import { assertFocusVisible, assertTargetSize, expectNoA11yViolations } from '@tins/testing-a11y/vitest';

test('tins-button is accessible', async () => {
  const el = document.createElement('tins-button');
  el.textContent = 'Save';
  document.body.append(el);

  await expectNoA11yViolations(el, { context: 'tins-button default' });
  assertTargetSize(el); // 44x44 CSS px (WCAG 2.5.5)
  assertFocusVisible(el); // ≥2px, ≥3:1, not obscured (WCAG 2.4.7/2.4.12/2.4.13)
});
```

## Playwright

```ts
import { assertNoReflowOverflow, assertTextSpacingSafe, scanPage } from '@tins/testing-a11y/playwright';

test('button page has no violations', async ({ page }, testInfo) => {
  await page.goto('/components/button');
  await scanPage(page, testInfo, { name: 'axe:/components/button:light' }); // attaches JSON report
  await assertTextSpacingSafe(page); // WCAG 1.4.12
  await assertNoReflowOverflow(page, 320); // WCAG 1.4.10
});
```

Pages must come from a browser **context** (`browser.newContext()` / the Playwright `page` fixture);
`@axe-core/playwright` cannot run on pages from `browser.newPage()`.

## Exclusions

Rules are never disabled globally. The only way to suppress a finding is `excludeRule()`, which requires
a specific CSS selector, a reason, and a tracking reference — it throws otherwise. Calling axe's
`disableRules` directly is a lint error outside this library.

```ts
import { excludeRule } from '@tins/testing-a11y';

const exclusions = [
  excludeRule({
    rule: 'color-contrast-enhanced',
    selector: '.brand-logo', // matched against the element or its (shadow-including) ancestors
    reason: 'Logotypes are exempt from WCAG 1.4.6',
    issue: '#123',
  }),
];
await expectNoA11yViolations(el, { exclusions });
```

## Commands

```sh
npx nx test testing-a11y       # unit (node) + browser (Chromium) + Playwright helper tests
npx nx typecheck testing-a11y  # also compiles src/readme.examples.ts to keep this README honest
```
