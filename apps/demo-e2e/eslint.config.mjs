import playwright from 'eslint-plugin-playwright';
import baseConfig, { testFileRules } from '../../eslint.config.mjs';

export default [
  playwright.configs['flat/recommended'],
  ...baseConfig,
  // Everything in an e2e project is test code (support helpers included).
  { files: ['**/*.ts', '**/*.mts'], rules: testFileRules },
  {
    files: ['**/*.ts', '**/*.mts'],
    rules: {
      // Assertions live in shared helpers (scanPage, assertNoReflowOverflow, …).
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['scanPage', 'assert*', 'expect*', 'tabTo'] },
      ],
    },
  },
  {
    // Step definitions (Given/When/Then from createBdd) run as the bodies of generated tests.
    files: ['steps/**/*.ts'],
    rules: { 'playwright/no-standalone-expect': 'off' },
  },
  {
    // Design D7: the BDD config only runs tests generated from features/*.feature, so a code-only
    // spec file would silently never run.
    files: ['src/**/*.spec.ts', 'steps/**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'E2E tests are written as features in features/*.feature (write a feature and reuse or add steps in steps/*.steps.ts); this spec file would never run.',
        },
      ],
    },
  },
];
