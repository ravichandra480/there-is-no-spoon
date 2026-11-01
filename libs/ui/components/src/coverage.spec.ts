import { describe, expect, it } from 'vitest';

/** Spec: web-component-library › "Component unit test coverage" — every component ships with tests. */
const components = Object.keys(import.meta.glob('./*/index.ts')).map(
  (p) => p.split('/')[1],
);
const specs = new Set(
  Object.keys(import.meta.glob('./*/*.spec.ts')).map((p) => p.split('/')[1]),
);

describe('component test coverage', () => {
  it('finds components', () => {
    expect(components.length).toBeGreaterThan(0);
  });

  it.each(components)('%s has a unit test file', (name) => {
    expect(specs.has(name), `src/${name}/ has no *.spec.ts`).toBe(true);
  });
});
