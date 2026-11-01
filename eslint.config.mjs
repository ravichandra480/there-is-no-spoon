import nx from '@nx/eslint-plugin';
import tins from './tools/eslint/plugin.mjs';
import { deepImportPatterns } from './tools/eslint/public-entry-points.mjs';

const TS_JS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.cts',
  '**/*.mts',
  '**/*.js',
  '**/*.jsx',
  '**/*.cjs',
  '**/*.mjs',
];
const TEST_FILES = [
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/*.examples.ts',
  '**/src/test-setup.ts',
  '**/vitest.config.mts',
  'apps/*-e2e/**/*',
];

/**
 * Dependency direction (design D10):
 *   type:app    -> type:ui | type:tokens | type:util
 *   type:e2e    -> type:util
 *   type:ui     -> type:tokens | type:util   (no framework imports)
 *   type:tokens -> type:util
 *   type:util   -> type:util
 * scope:testing libraries are allowed only from test files (see TEST_FILES override below).
 */
const typeConstraints = [
  {
    sourceTag: 'type:app',
    onlyDependOnLibsWithTags: ['type:ui', 'type:tokens', 'type:util'],
  },
  { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:util'] },
  {
    sourceTag: 'type:ui',
    onlyDependOnLibsWithTags: ['type:tokens', 'type:util'],
    bannedExternalImports: [
      '@angular/*',
      '@angular-*',
      'zone.js',
      'rxjs',
      'react',
      'react-dom',
      'vue',
      'svelte',
    ],
  },
  { sourceTag: 'type:tokens', onlyDependOnLibsWithTags: ['type:util'] },
  { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
];

/**
 * Scope rules are checked per import (onlyDependOnLibsWithTags), not transitively: a lib whose
 * *tests* use @tins/testing-a11y must still be importable from production code.
 * `scope:testing` is added to every scope's allow-list only for test files.
 */
const SCOPES = {
  'scope:ui': ['scope:ui'],
  'scope:demo': ['scope:ui', 'scope:demo'],
  'scope:testing': ['scope:testing', 'scope:ui'],
  'scope:workspace': ['scope:workspace'],
};
const scopeConstraints = ({ allowTesting }) =>
  Object.entries(SCOPES).map(([sourceTag, allowed]) => ({
    sourceTag,
    onlyDependOnLibsWithTags: allowTesting
      ? [...new Set([...allowed, 'scope:testing'])]
      : allowed,
  }));

const boundaries = (
  extra = [],
  { enforceBuildableLibDependency = true } = {},
) => [
  'error',
  {
    enforceBuildableLibDependency,
    allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
    depConstraints: [...typeConstraints, ...extra],
  },
];

/**
 * Rules for test code: may use `scope:testing` libraries and non-buildable test helpers.
 * E2E projects apply this to all their files (globs here resolve relative to the project's own
 * eslint.config.mjs, so `apps/*-e2e/**` only matches when linting from the workspace root).
 */
export const testFileRules = {
  '@nx/enforce-module-boundaries': boundaries(
    scopeConstraints({ allowTesting: true }),
    {
      enforceBuildableLibDependency: false,
    },
  ),
};

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/coverage',
      '**/test-results',
      '**/playwright-report',
      '**/.features-gen',
      '**/vitest.config.*.timestamp*',
      '**/vite.config.*.timestamp*',
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  {
    files: TS_JS,
    plugins: { tins },
    rules: {
      'tins/require-project-tags': 'error',
      // Libraries are consumed only through their package.json `exports` (no deep imports).
      'no-restricted-imports': ['error', { patterns: deepImportPatterns() }],
      // Production code may not depend on test-only libraries.
      '@nx/enforce-module-boundaries': boundaries(
        scopeConstraints({ allowTesting: false }),
      ),
      // Accessibility rules may only be suppressed through excludeRule() from @tins/testing-a11y
      // (spec: accessibility-compliance › "No suppression without justification").
      'no-restricted-properties': [
        'error',
        {
          property: 'disableRules',
          message:
            'Do not disable axe rules directly. Use excludeRule({ rule, selector, reason, issue }) from @tins/testing-a11y.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name=/^(run|configure|options)$/] Property[key.name='enabled'][value.value=false]",
          message:
            'Do not disable axe rules via options. Use excludeRule({ rule, selector, reason, issue }) from @tins/testing-a11y.',
        },
        {
          selector: "Property[key.name='disableRules']",
          message:
            'Do not disable axe rules directly. Use excludeRule({ rule, selector, reason, issue }) from @tins/testing-a11y.',
        },
      ],
    },
  },
  { files: TEST_FILES, rules: testFileRules },
];
