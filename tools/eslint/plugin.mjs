// Local ESLint rules for this workspace.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKSPACE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const TYPE_TAGS = ['type:app', 'type:e2e', 'type:ui', 'type:tokens', 'type:util'];
const cache = new Map();

/** Finds the nearest project.json (or package.json with an `nx` field) above `file`. */
function findProject(file, root) {
  for (let dir = dirname(file); dir.startsWith(root) && dir !== root; dir = dirname(dir)) {
    if (cache.has(dir)) return cache.get(dir);
    const projectJson = join(dir, 'project.json');
    const packageJson = join(dir, 'package.json');
    let result = null;
    if (existsSync(projectJson)) {
      const p = JSON.parse(readFileSync(projectJson, 'utf8'));
      result = { dir, name: p.name ?? relative(root, dir), tags: p.tags ?? [] };
    } else if (existsSync(packageJson)) {
      const p = JSON.parse(readFileSync(packageJson, 'utf8'));
      if (p.nx) result = { dir, name: p.nx.name ?? p.name, tags: p.nx.tags ?? [] };
    }
    if (result) {
      cache.set(dir, result);
      return result;
    }
  }
  return null;
}

const requireProjectTags = {
  meta: {
    type: 'problem',
    docs: { description: 'Every Nx project must declare one `type:` tag and at least one `scope:` tag.' },
    schema: [],
    messages: {
      missingType: 'Project "{{name}}" has no valid `type:` tag (one of: {{allowed}}). Module boundaries cannot be enforced.',
      missingScope: 'Project "{{name}}" has no `scope:` tag. Module boundaries cannot be enforced.',
    },
  },
  create(context) {
    return {
      Program(node) {
        const project = findProject(context.filename, WORKSPACE_ROOT);
        if (!project) return;
        const types = project.tags.filter((t) => TYPE_TAGS.includes(t));
        if (types.length !== 1) {
          context.report({ node, messageId: 'missingType', data: { name: project.name, allowed: TYPE_TAGS.join(', ') } });
        }
        if (!project.tags.some((t) => t.startsWith('scope:'))) {
          context.report({ node, messageId: 'missingScope', data: { name: project.name } });
        }
      },
    };
  },
};

export default {
  meta: { name: 'eslint-plugin-tins' },
  rules: { 'require-project-tags': requireProjectTags },
};
