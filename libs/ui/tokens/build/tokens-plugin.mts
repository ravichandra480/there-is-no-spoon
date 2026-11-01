import { cpSync } from 'node:fs';
import { join } from 'node:path';
import * as sass from 'sass';
import type { Plugin } from 'vite';
import { parseTokenCss } from '../src/lib/parse.js';
import { THEMES } from '../src/lib/themes.js';

const SRC = join(import.meta.dirname, '..', 'src', 'scss');

export function compileTokensCss(): string {
  return sass.compile(join(SRC, 'tokens.scss'), { style: 'expanded' }).css;
}

export interface TokensJson {
  themes: Record<string, Record<string, string>>;
  base: Record<string, string>;
}

/** Extracts per-theme token values from compiled CSS (what actually ships). */
export function tokensJson(css = compileTokensCss()): TokensJson {
  const blocks = parseTokenCss(css);
  const strip = (decls: Record<string, string> = {}) =>
    Object.fromEntries(Object.entries(decls).filter(([k]) => k.startsWith('--tins-')).map(([k, v]) => [k.replace('--tins-', ''), v]));
  const themes = Object.fromEntries(THEMES.map((t) => [t, strip(blocks[`[data-theme=${t}]`] ?? blocks[`[data-theme='${t}']`] ?? blocks[`[data-theme="${t}"]`])]));
  const root = strip(blocks[':root']);
  const base = Object.fromEntries(Object.entries(root).filter(([k]) => !k.startsWith('color-')));
  return { themes, base };
}

/** Emits tokens.css, tokens.json and the SCSS sources into the library build output. */
export function tokensPlugin(): Plugin {
  let outDir = '';
  return {
    name: 'tins-tokens',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    generateBundle() {
      const css = compileTokensCss();
      this.emitFile({ type: 'asset', fileName: 'tokens.css', source: css });
      this.emitFile({ type: 'asset', fileName: 'tokens.json', source: JSON.stringify(tokensJson(css), null, 2) });
    },
    writeBundle() {
      cpSync(SRC, join(outDir, 'scss'), { recursive: true });
    },
  };
}
