/**
 * Parses compiled token CSS into `{ [scope]: { [property]: value } }`.
 * Scope keys are the selector, prefixed by any enclosing at-rules, e.g.
 * `:root`, `[data-theme='dark']`, `@media (forced-colors: active) :root, [data-theme]`.
 */
export type TokenBlocks = Record<string, Record<string, string>>;

export function parseTokenCss(css: string): TokenBlocks {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: TokenBlocks = {};
  const stack: { prelude: string; atRule: boolean }[] = [];
  let buffer = '';

  for (const ch of src) {
    if (ch === '{') {
      const prelude = buffer.trim().replace(/\s+/g, ' ');
      stack.push({ prelude, atRule: prelude.startsWith('@') });
      buffer = '';
    } else if (ch === '}') {
      const scope = stack.pop();
      if (scope && !scope.atRule) {
        const key = [...stack.map((s) => s.prelude), scope.prelude].join(' ');
        const decls = (blocks[key] ??= {});
        for (const decl of buffer.split(';')) {
          const idx = decl.indexOf(':');
          if (idx > 0) decls[decl.slice(0, idx).trim()] = decl.slice(idx + 1).trim();
        }
      }
      buffer = '';
    } else {
      buffer += ch;
    }
  }
  return blocks;
}
