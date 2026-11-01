#!/usr/bin/env node
// Fails when any @nx/* package (declared or installed) differs from the `nx` version.
// Spec: workspace-architecture › "Single package manager and version policy".
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const declared = { ...pkg.dependencies, ...pkg.devDependencies };
const nxDeclared = declared.nx;

if (!nxDeclared) {
  console.error('check-nx-versions: `nx` is not declared in package.json');
  process.exit(1);
}

const installedVersion = (name) => {
  const file = join(root, 'node_modules', name, 'package.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).version : undefined;
};

const nxInstalled = installedVersion('nx');
const problems = [];

for (const [name, range] of Object.entries(declared)) {
  if (!name.startsWith('@nx/')) continue;
  if (range !== nxDeclared) {
    problems.push(`${name} declared as "${range}" but nx is declared as "${nxDeclared}"`);
  }
  const installed = installedVersion(name);
  if (nxInstalled && installed && installed !== nxInstalled) {
    problems.push(`${name} installed at ${installed} but nx is installed at ${nxInstalled}`);
  }
}

if (problems.length) {
  console.error('check-nx-versions: Nx package version mismatch:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}
console.log(`check-nx-versions: all @nx/* packages match nx@${nxInstalled ?? nxDeclared}`);
