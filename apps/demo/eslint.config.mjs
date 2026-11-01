import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'demo', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'demo', style: 'kebab-case' },
      ],
    },
  },
  // Template accessibility (spec: accessibility-compliance › "Static accessibility linting").
  // Listed explicitly so the rules stay on even if the Nx preset changes.
  ...angular.configs.templateAccessibility.map((c) => ({
    ...c,
    files: ['**/*.html'],
  })),
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
    },
  },
];
