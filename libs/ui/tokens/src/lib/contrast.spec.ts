import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@tins/testing-a11y';
import { tokensJson } from '../../build/tokens-plugin.mjs';
import { CONTRAST_PAIRS, MIN_RATIO, ROW_STATE_TOKENS } from './contrast-pairs.js';
import { THEMES } from './themes.js';

/**
 * WCAG 1.4.6 Contrast (Enhanced) and 1.4.11 Non-text Contrast, checked against the compiled CSS
 * that ships — so a palette change below threshold fails here, naming the token pair.
 */
const { themes } = tokensJson();

describe.each(THEMES)('theme "%s" meets AAA contrast', (theme) => {
  it.each(CONTRAST_PAIRS.map((p) => [`${p.foreground} on ${p.background} (${p.level}: ${p.usage})`, p] as const))(
    '%s',
    (_label, pair) => {
      const fg = themes[theme][pair.foreground];
      const bg = themes[theme][pair.background];
      expect(fg, `${theme}: missing token ${pair.foreground}`).toBeDefined();
      expect(bg, `${theme}: missing token ${pair.background}`).toBeDefined();
      const ratio = Math.floor(contrastRatio(fg, bg) * 100) / 100;
      expect(
        ratio,
        `${theme}: ${pair.foreground} (${fg}) on ${pair.background} (${bg}) is ${ratio}:1, needs ${MIN_RATIO[pair.level]}:1 for ${pair.level}`,
      ).toBeGreaterThanOrEqual(MIN_RATIO[pair.level]);
    },
  );
});

describe.each(THEMES)('theme "%s" row state backgrounds', (theme) => {
  it.each(ROW_STATE_TOKENS)('%s differs from color-surface', (token) => {
    const value = themes[theme][token];
    expect(value, `${theme}: missing token ${token}`).toBeDefined();
    expect(value?.toLowerCase()).not.toBe(themes[theme]['color-surface']?.toLowerCase());
  });

  it('hover, selected and selected-hover are pairwise distinct', () => {
    const values = ROW_STATE_TOKENS.map((t) => themes[theme][t]?.toLowerCase());
    expect(new Set(values).size).toBe(values.length);
  });
});
