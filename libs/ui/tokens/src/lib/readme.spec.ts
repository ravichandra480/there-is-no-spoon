import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileTokensCss } from '../../build/tokens-plugin.mjs';
import { parseTokenCss } from './parse.js';
import { BASE_TOKENS, COLOR_TOKENS, tokenProperty } from './themes.js';

const readme = readFileSync(join(import.meta.dirname, '..', '..', 'README.md'), 'utf8');
const section = (name: string) => readme.split(`<!-- tokens:${name} -->`)[1].split(`<!-- /tokens:${name} -->`)[0];
const listed = (name: string) => [...section(name).matchAll(/`(--tins-[a-z0-9-]+)`/g)].map((m) => m[1]);
const root = parseTokenCss(compileTokensCss())[':root'];

describe('README token documentation', () => {
  it.each(['color', 'base'])('every %s token listed in README exists in tokens.css', (name) => {
    for (const prop of listed(name)) expect(root, `${prop} is documented but not emitted`).toHaveProperty(prop);
  });

  it('documents every token', () => {
    expect(listed('color').sort()).toEqual(COLOR_TOKENS.map(tokenProperty).sort());
    expect(listed('base').sort()).toEqual(BASE_TOKENS.map(tokenProperty).sort());
  });
});
