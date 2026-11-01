import { join } from 'node:path';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

const loadPaths = [join(import.meta.dirname, '..')];
const compile = (source: string) => sass.compileString(source, { loadPaths, style: 'expanded' }).css;

describe('@tins/ui-tokens/scss', () => {
  it('token() resolves to a custom property with the light default as fallback', () => {
    const css = compile(`@use 'scss' as t; a { color: t.token('color-text'); }`);
    expect(css).toContain('color: var(--tins-color-text, #1a1a1a)');
  });

  it('token() fails the build for unknown tokens', () => {
    expect(() => compile(`@use 'scss' as t; a { color: t.token('nope'); }`)).toThrow(/Unknown design token "nope"/);
  });

  it('focus-ring, target-size, reduced-motion and forced-colors mixins compile', () => {
    const css = compile(`
      @use 'scss' as t;
      button {
        @include t.target-size;
        @include t.focus-ring;
        @include t.motion-safe-transition(background-color);
        @include t.forced-colors { border-color: ButtonBorder; }
      }`);
    expect(css).toContain('min-inline-size: var(--tins-target-size, 44px)');
    expect(css).toMatch(/button:focus-visible\s*\{\s*outline: var\(--tins-focus-ring-width, 3px\) solid var\(--tins-color-focus-ring, #0b3d91\)/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*button\s*\{\s*transition: none;/);
    expect(css).toContain('@media (forced-colors: active)');
  });
});
