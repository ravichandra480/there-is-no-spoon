# Tasks

## 1. Component

- [x] 1.1 In `libs/ui/components/src/file-table/file-table.ts`, change the empty-state count text to "None Selected" and update the `@csspart count` JSDoc. Verify with `grep -rn "None selected" libs/ui/components/src`, which should find nothing outside tests.
- [x] 1.2 Update `libs/ui/components/src/file-table/file-table.spec.ts`: switch the "None selected" expectations to "None Selected". Add a test that walks the count through 0 → 1 → 2 → 1 → 0 ("None Selected" → "Selected 1" → "Selected 2" → "Selected 1" → "None Selected"). Verify with `pnpm nx test ui-components`, which should pass.
- [x] 1.3 Regenerate the manifest with `pnpm nx run ui-components:cem`. Verify that `libs/ui/components/custom-elements.json` describes the count part as "Selected N" / "None Selected".
- [x] 1.4 Update the count wording in `libs/ui/components/src/file-table/A11Y.md` and in `libs/ui/components/README.md` (if it mentions the empty text). Verify that `pnpm nx test ui-components` still passes, including `readme.node.spec.ts`.

## 2. Demo e2e

- [x] 2.1 In `apps/demo-e2e/features/file-table.feature`, change the three `the selection count reads "None selected"` steps to "None Selected". Verify with `pnpm nx e2e demo-e2e`, which should pass with `.features-gen` regenerated.

## 3. Integration

- [x] 3.1 Run `pnpm nx run-many -t lint test` for the affected projects, then `openspec validate selection-count-none-selected-copy --strict`. Verify that both succeed.
