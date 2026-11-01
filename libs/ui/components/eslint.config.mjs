import lit from 'eslint-plugin-lit';
import litA11y from 'eslint-plugin-lit-a11y';
import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    ...lit.configs['flat/recommended'],
  },
  {
    files: ['src/**/*.ts'],
    ...litA11y.configs.recommended,
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'lit/no-invalid-html': 'error',
      'lit/no-useless-template-literals': 'error',
      'lit/attribute-value-entities': 'error',
      'lit/no-native-attributes': 'error',
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
            '{projectRoot}/custom-elements-manifest.config.mjs',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
