/**
 * Lit's analyzer treats every entry in `static properties` as an attribute, including internal
 * reactive state (`{ state: true }`). Internal state is `_`-prefixed by convention (and `#private` members are never public); drop them from
 * the public manifest so documented API == real API.
 */
const isInternal = (name) =>
  typeof name === 'string' && (name.startsWith('_') || name.startsWith('#'));

function stripInternalState() {
  return {
    name: 'tins-strip-internal-state',
    packageLinkPhase({ customElementsManifest }) {
      for (const mod of customElementsManifest.modules ?? []) {
        for (const decl of mod.declarations ?? []) {
          if (decl.attributes)
            decl.attributes = decl.attributes.filter(
              (a) => !isInternal(a.name) && !isInternal(a.fieldName),
            );
          if (decl.members)
            decl.members = decl.members.filter((m) => !isInternal(m.name));
        }
      }
    },
  };
}

export default {
  globs: ['src/**/*.ts'],
  exclude: [
    'src/**/*.spec.ts',
    'src/**/*.d.ts',
    'src/shared/**',
    'src/testing/**',
  ],
  outdir: '.',
  litelement: true,
  packagejson: false,
  plugins: [stripInternalState()],
};
