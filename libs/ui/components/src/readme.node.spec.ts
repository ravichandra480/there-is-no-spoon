import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Spec: web-component-library › "Public component API" — every public API item is documented.
 * Every attribute, public member, event, slot, CSS part and CSS custom property in the Custom
 * Elements Manifest must appear in that element's section of README.md.
 */
interface Named {
  name: string;
  static?: boolean;
  privacy?: string;
}
interface Decl {
  tagName?: string;
  attributes?: Named[];
  members?: Named[];
  events?: Named[];
  slots?: Named[];
  cssParts?: Named[];
  cssProperties?: Named[];
}

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(
  readFileSync(join(root, 'custom-elements.json'), 'utf8'),
) as { modules: { declarations?: Decl[] }[] };
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const elements = manifest.modules
  .flatMap((m) => m.declarations ?? [])
  .filter((d) => d.tagName);

/** The README section `## \`tins-x\`` up to the next `## ` heading. */
function section(tag: string): string {
  const start = readme.indexOf(`## \`${tag}\``);
  if (start < 0) return '';
  const next = readme.indexOf('\n## ', start + 1);
  return readme.slice(start, next < 0 ? undefined : next);
}

function apiItems(d: Decl): [kind: string, name: string][] {
  const pub = (m: Named) => !m.static && (m.privacy ?? 'public') === 'public';
  return [
    ...(d.attributes ?? []).map(
      (a) => ['attribute', a.name] as [string, string],
    ),
    ...(d.members ?? [])
      .filter(pub)
      .map((m) => ['member', m.name] as [string, string]),
    ...(d.events ?? []).map((e) => ['event', e.name] as [string, string]),
    ...(d.slots ?? []).map(
      (s) => ['slot', s.name === '' ? '(default)' : s.name] as [string, string],
    ),
    ...(d.cssParts ?? []).map((p) => ['css part', p.name] as [string, string]),
    ...(d.cssProperties ?? []).map(
      (p) => ['css property', p.name] as [string, string],
    ),
  ];
}

describe('README documents the manifest API', () => {
  it('manifest lists every component', () => {
    expect(elements.map((e) => e.tagName).sort()).toEqual([
      'tins-button',
      'tins-file-table',
    ]);
  });

  describe.each(elements.map((e) => [e.tagName as string, e] as const))(
    '%s',
    (tag, decl) => {
      it('has a README section', () => {
        expect(
          section(tag),
          `README.md has no "## \`${tag}\`" section`,
        ).not.toBe('');
      });

      it.each(apiItems(decl))('documents %s %s', (kind, name) => {
        const text = section(tag);
        const documented =
          name === '(default)'
            ? text.includes(name)
            : text.includes(`\`${name}\``) || text.includes(`\`${name}(`);
        expect(
          documented,
          `${tag}: ${kind} "${name}" is in custom-elements.json but not in README.md`,
        ).toBe(true);
      });
    },
  );
});
