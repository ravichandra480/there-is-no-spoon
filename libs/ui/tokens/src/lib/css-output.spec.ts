import { describe, expect, it } from 'vitest';
import { compileTokensCss, tokensJson } from '../../build/tokens-plugin.mjs';
import { parseTokenCss } from './parse.js';
import { BASE_TOKENS, COLOR_TOKENS, THEMES, tokenProperty } from './themes.js';

const css = compileTokensCss();
const blocks = parseTokenCss(css);

describe('compiled tokens.css', () => {
  it('declares base and light tokens on :root', () => {
    for (const name of [...BASE_TOKENS, ...COLOR_TOKENS]) expect(blocks[':root']).toHaveProperty(tokenProperty(name));
  });

  it.each(THEMES)('declares every color token for [data-theme=%s]', (theme) => {
    const block = blocks[`[data-theme=${theme}]`];
    expect(block).toBeDefined();
    for (const name of COLOR_TOKENS) expect(block).toHaveProperty(tokenProperty(name));
  });

  it('follows prefers-color-scheme: dark when no theme is chosen', () => {
    expect(blocks['@media (prefers-color-scheme: dark) :root:not([data-theme])']).toHaveProperty('--tins-color-surface');
  });

  it('maps tokens to system colors under forced-colors', () => {
    const block = blocks['@media (forced-colors: active) :root, [data-theme]'];
    expect(block['--tins-color-text']).toBe('CanvasText');
    expect(block['--tins-color-focus-ring']).toBe('Highlight');
  });

  it('zeroes motion duration under prefers-reduced-motion', () => {
    expect(blocks['@media (prefers-reduced-motion: reduce) :root']['--tins-motion-duration']).toBe('0ms');
  });

  it('exports JSON for every theme', () => {
    const json = tokensJson(css);
    expect(Object.keys(json.themes)).toEqual([...THEMES]);
    expect(json.base['target-size']).toBe('44px');
  });
});
