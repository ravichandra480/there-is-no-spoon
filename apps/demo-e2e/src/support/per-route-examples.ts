import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser,
} from '@cucumber/gherkin';

export const PER_ROUTE_TAG = '@per-route';
export const FEATURES_DIR = join(workspaceRoot, 'apps/demo-e2e/features');

/**
 * The paths one `@per-route` Scenario Outline lists in its Examples `path` column. Outlines with a
 * `theme` column produce one group per theme, so each theme must cover every route on its own.
 */
export interface PerRouteGroup {
  /** `features/<file>.feature › <outline name>` plus ` (<theme> theme)` when grouped by theme. */
  label: string;
  /** Feature file name relative to `features/`. */
  file: string;
  paths: Set<string>;
}

interface Tagged {
  tags: readonly { name: string }[];
}

/** Parses every feature file and returns the `path` cells of each `@per-route` outline. */
export function perRouteGroups(dir = FEATURES_DIR): PerRouteGroup[] {
  let id = 0;
  const parser = new Parser(
    new AstBuilder(() => String(id++)),
    new GherkinClassicTokenMatcher(),
  );
  const groups: PerRouteGroup[] = [];
  const files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.feature'))
    .sort();
  for (const file of files) {
    const feature = parser.parse(readFileSync(join(dir, file), 'utf8')).feature;
    if (!feature) continue;
    const hasTag = (...nodes: Tagged[]) =>
      nodes.some((n) => n.tags.some((t) => t.name === PER_ROUTE_TAG));
    const scenarios = feature.children.flatMap((c) =>
      c.scenario
        ? [{ scenario: c.scenario, rule: undefined }]
        : (c.rule?.children ?? []).flatMap((rc) =>
            rc.scenario ? [{ scenario: rc.scenario, rule: c.rule }] : [],
          ),
    );
    for (const { scenario, rule } of scenarios) {
      if (!scenario.examples.length) continue;
      const outlineTagged = hasTag(feature, scenario, ...(rule ? [rule] : []));
      for (const examples of scenario.examples) {
        if (!outlineTagged && !hasTag(examples)) continue;
        const header = examples.tableHeader?.cells.map((c) => c.value) ?? [];
        const pathCol = header.indexOf('path');
        if (pathCol < 0)
          throw new Error(
            `${file} › ${scenario.name}: ${PER_ROUTE_TAG} Examples need a "path" column`,
          );
        const themeCol = header.indexOf('theme');
        for (const row of examples.tableBody) {
          const theme = themeCol >= 0 ? row.cells[themeCol]?.value : undefined;
          const label = `features/${file} › ${scenario.name}${theme ? ` (${theme} theme)` : ''}`;
          let group = groups.find((g) => g.label === label);
          if (!group) {
            group = { label, file, paths: new Set() };
            groups.push(group);
          }
          group.paths.add(row.cells[pathCol]?.value ?? '');
        }
      }
    }
  }
  return groups;
}
