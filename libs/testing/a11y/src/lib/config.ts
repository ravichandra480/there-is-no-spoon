import type { RunOptions } from 'axe-core';

/**
 * axe-core tags covering WCAG 2.0/2.1/2.2 Levels A, AA and AAA plus best practices.
 * (axe-core does not publish `wcag21aaa` / `wcag22aaa` tags; AAA rules carry `wcag2aaa`.)
 */
export const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag2aaa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
] as const;

/**
 * Rules that axe-core disables by default but which are required for the AAA target.
 * They must be switched on explicitly even when selected by tag.
 */
export const FORCE_ENABLED_RULES = [
  'color-contrast-enhanced', // 1.4.6 Contrast (Enhanced)
  'identical-links-same-purpose', // 2.4.9 Link Purpose (Link Only)
  'meta-refresh-no-exceptions', // 2.2.4 / 3.2.5
  'target-size', // 2.5.8 (24px); 44px 2.5.5 is checked by assertTargetSize
] as const;

/** Run options shared by the Vitest and Playwright helpers. */
export function axeRunOptions(): RunOptions {
  return {
    runOnly: { type: 'tag', values: [...WCAG_TAGS] },
    rules: Object.fromEntries(FORCE_ENABLED_RULES.map((id) => [id, { enabled: true }])),
    resultTypes: ['violations', 'incomplete'],
    elementRef: true,
  };
}

/** Minimum enhanced pointer target size (WCAG 2.5.5), CSS px. */
export const AAA_TARGET_SIZE = 44;
/** Minimum focus indicator thickness (WCAG 2.4.13), CSS px. */
export const AAA_FOCUS_THICKNESS = 2;
/** Minimum non-text contrast (WCAG 1.4.11 / 2.4.13). */
export const NON_TEXT_CONTRAST = 3;
/** Enhanced text contrast (WCAG 1.4.6). */
export const AAA_TEXT_CONTRAST = 7;
export const AAA_LARGE_TEXT_CONTRAST = 4.5;
