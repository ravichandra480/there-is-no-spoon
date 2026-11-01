// Builds `no-restricted-imports` patterns that allow only the public entry points of each
// workspace library, as declared in its package.json `exports` (spec: demo-app › "Deep import rejected").
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKSPACE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
);

function* packageJsons(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    const pkg = join(full, 'package.json');
    if (existsSync(pkg)) yield pkg;
    else yield* packageJsons(full);
  }
}

const escape = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/** `{ '@tins/ui-components': ['button', 'file-table', ...] }` from each lib's `exports` map. */
export function publicEntryPoints(root = WORKSPACE_ROOT) {
  const result = {};
  for (const file of packageJsons(join(root, 'libs'))) {
    const pkg = JSON.parse(readFileSync(file, 'utf8'));
    if (!pkg.name?.startsWith('@tins/') || !pkg.exports) continue;
    result[pkg.name] = Object.keys(pkg.exports)
      .filter((k) => k !== '.')
      .map((k) => k.replace(/^\.\//, ''));
  }
  return result;
}

/** One pattern per library: any subpath that is not an exported entry point is rejected. */
export function deepImportPatterns(root = WORKSPACE_ROOT) {
  return Object.entries(publicEntryPoints(root)).map(([name, subpaths]) => {
    const allowed = subpaths.map((s) => escape(s).replace(/\\\*|\*/g, '.+'));
    return {
      regex: `^${escape(name)}/(?!(?:${allowed.join('|')})$)`,
      message: `Import only public entry points of ${name}: ${[name, ...subpaths.map((s) => `${name}/${s}`)].join(', ')}.`,
    };
  });
}
