#!/usr/bin/env node
// Boundary regression check (tasks 3.3, design D10). Lints in-memory snippets that MUST be
// rejected and one that MUST pass, using each project's real ESLint config. No files are written.
// Spec: workspace-architecture › "Enforced dependency direction", demo-app › "Deep import rejected".
import { ESLint } from 'eslint';
import { join } from 'node:path';

const root = process.cwd();

const cases = [
  {
    name: 'ui library imports the demo app',
    project: 'libs/ui/components',
    file: 'src/__boundary_check__.ts',
    code: "import { App } from '../../../../apps/demo/src/app/app';\nexport const x = App;\n",
    expect: { rule: '@nx/enforce-module-boundaries' },
  },
  {
    name: 'ui library imports Angular',
    project: 'libs/ui/components',
    file: 'src/__boundary_check__.ts',
    code: "import { Component } from '@angular/core';\nexport const x = Component;\n",
    expect: { rule: '@nx/enforce-module-boundaries' },
  },
  {
    name: 'tokens library imports the ui library',
    project: 'libs/ui/tokens',
    file: 'src/__boundary_check__.ts',
    code: "import { TinsButton } from '@tins/ui-components/button';\nexport const x = TinsButton;\n",
    expect: { rule: '@nx/enforce-module-boundaries' },
  },
  {
    name: 'demo deep-imports a library internal',
    project: 'apps/demo',
    file: 'src/app/__boundary_check__.ts',
    code: "import { define } from '@tins/ui-components/shared/define';\nexport const x = define;\n",
    expect: { rule: 'no-restricted-imports' },
  },
  {
    name: 'demo production code imports the test-only a11y library',
    project: 'apps/demo',
    file: 'src/app/__boundary_check__.ts',
    code: "import { WCAG_TAGS } from '@tins/testing-a11y';\nexport const x = WCAG_TAGS;\n",
    expect: { rule: '@nx/enforce-module-boundaries' },
  },
  {
    name: 'demo imports a public entry point (allowed)',
    project: 'apps/demo',
    file: 'src/app/__boundary_check__.ts',
    code: "import '@tins/ui-components/button';\nimport { THEMES } from '@tins/ui-tokens';\nexport const x = THEMES;\n",
    expect: null,
  },
];

let failed = 0;
for (const c of cases) {
  const cwd = join(root, c.project);
  const eslint = new ESLint({ cwd });
  const [result] = await eslint.lintText(c.code, {
    filePath: join(cwd, c.file),
  });
  const errors = (result?.messages ?? []).filter((m) => m.severity === 2);
  const ok = c.expect
    ? errors.some((e) => e.ruleId === c.expect.rule)
    : errors.length === 0;
  if (!ok) failed++;
  const detail = errors.length
    ? errors.map((e) => `${e.ruleId}: ${e.message.split('\n')[0]}`).join('; ')
    : 'no errors';
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${c.name} — expected ${c.expect ? c.expect.rule : 'no errors'}; got ${detail}`,
  );
}

if (failed) {
  console.error(
    `check-boundaries: ${failed} case(s) did not behave as expected`,
  );
  process.exit(1);
}
console.log('check-boundaries: all module-boundary rules hold');
