#!/usr/bin/env node
// Fails when a component's source changed without an update to its manual accessibility review
// record (`A11Y.md` next to the component). Spec: accessibility-compliance › "Missing manual review".
//
// Usage:
//   node tools/scripts/check-a11y-review.mjs                       # working tree vs $NX_BASE (or main)
//   node tools/scripts/check-a11y-review.mjs --base <ref> --head <ref>
//   node tools/scripts/check-a11y-review.mjs --files a.ts b.md     # explicit changed-file list (tests)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
/** Directories whose immediate sub-folders with an `index.ts` are components. */
const COMPONENT_ROOTS = ['libs/ui/components/src'];
/** Files in a component folder that do not require a new review. */
const EXEMPT = [/\.spec\.ts$/, /\.test\.ts$/, /(^|\/)A11Y\.md$/];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const git = (...args) =>
  execFileSync('git', args, { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

function changedFiles() {
  const i = process.argv.indexOf('--files');
  if (i >= 0)
    return process.argv.slice(i + 1).filter((f) => !f.startsWith('--'));
  const base = arg('--base') ?? process.env.NX_BASE ?? 'main';
  const head = arg('--head') ?? process.env.NX_HEAD;
  if (head) {
    // `base...head` diffs from the merge base, which needs two commits. On the first CI run
    // nx-set-shas passes the empty-tree hash as base (no earlier commit), so diff the trees directly.
    const baseIsCommit = git('cat-file', '-t', base)[0] === 'commit';
    return baseIsCommit
      ? git('diff', '--name-only', `${base}...${head}`)
      : git('diff', '--name-only', base, head);
  }
  // Local: committed + staged + unstaged changes against base, plus untracked files.
  return [
    ...new Set([
      ...git('diff', '--name-only', base),
      ...git('ls-files', '--others', '--exclude-standard'),
    ]),
  ];
}

function components() {
  return COMPONENT_ROOTS.flatMap((dir) =>
    existsSync(join(root, dir))
      ? readdirSync(join(root, dir))
          .map((name) => `${dir}/${name}`)
          .filter(
            (p) =>
              statSync(join(root, p)).isDirectory() &&
              existsSync(join(root, p, 'index.ts')),
          )
      : [],
  );
}

const changed = changedFiles().map((f) =>
  relative(root, join(root, f)).split('\\').join('/'),
);
const problems = [];

for (const dir of components()) {
  const record = `${dir}/A11Y.md`;
  const inDir = changed.filter((f) => f.startsWith(`${dir}/`));
  const sourceChanges = inDir.filter((f) => !EXEMPT.some((re) => re.test(f)));
  if (!existsSync(join(root, record))) {
    problems.push(
      `${dir}: missing ${record} (manual accessibility review record)`,
    );
  } else if (sourceChanges.length && !changed.includes(record)) {
    problems.push(
      `${dir}: source changed (${sourceChanges.join(', ')}) but ${record} was not updated`,
    );
  }
}

if (problems.length) {
  console.error('check-a11y-review: manual accessibility review incomplete');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    'Update the component\'s A11Y.md (see ACCESSIBILITY.md › "Manual review").',
  );
  process.exit(1);
}
console.log(
  `check-a11y-review: ok (${components().length} components, ${changed.length} changed files checked)`,
);
