import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // README examples intentionally import through the public entry points, as consumers do.
    files: ['src/readme.examples.ts'],
    rules: { '@nx/enforce-module-boundaries': 'off' },
  },
];
