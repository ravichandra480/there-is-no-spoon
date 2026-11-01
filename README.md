# there-is-no-spoon

Nx monorepo for **framework-agnostic Lit web components** with an **Angular demo app**, built and tested with **Vite / Vitest**, styled with **SCSS**, end-to-end tested with **Playwright**, and targets **WCAG 2.2 Level AAA**.

Demo site is available at [file-table](https://ravichandra480.github.io/there-is-no-spoon/#/file-table)

| What                            | Where                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Component (Lit, TypeScript)     | [`libs/ui/components/src/file-table/file-table.ts`](libs/ui/components/src/file-table/file-table.ts)                            |
| Styles (SCSS, design tokens)    | [`libs/ui/components/src/file-table/file-table.styles.scss`](libs/ui/components/src/file-table/file-table.styles.scss)          |
| Unit + accessibility tests      | [`libs/ui/components/src/file-table/file-table.spec.ts`](libs/ui/components/src/file-table/file-table.spec.ts)                  |
| API docs                        | [`libs/ui/components/README.md` › `tins-file-table`](libs/ui/components/README.md#tins-file-table)                              |
| Accessibility review record     | [`libs/ui/components/src/file-table/A11Y.md`](libs/ui/components/src/file-table/A11Y.md)                                        |
| Demo page (Angular host, alert) | [`apps/demo/src/app/pages/file-table.page.ts`](apps/demo/src/app/pages/file-table.page.ts) — <http://localhost:4200/file-table> |
| End-to-end scenarios            | [`apps/demo-e2e/features/file-table.feature`](apps/demo-e2e/features/file-table.feature)                                        |
| Spec, design and task list      | [`openspec/specs/file-download-table/`](openspec/specs/file-download-table)  |

Key behaviour: only `status: 'available'` files can be selected (others show a disabled checkbox
with the reason "Not available for download"); select-all acts on available files only; the
component emits `tins-download` and `tins-selection-change` (bubbling, composed) and leaves the
actual download to the host. The demo shows an alert dialog listing the path and device of each
requested file, with focus on its Close button.

## Getting started

Prerequisites: Node.js 22 or newer and npm.

```sh
git clone https://github.com/ravichandra480/there-is-no-spoon.git
cd there-is-no-spoon
npm ci
npx playwright install --with-deps   # browsers for Vitest browser mode and e2e
```

Quick check of the file table:

```sh
npx nx serve demo                    # open http://localhost:4200/file-table
npx nx test ui-components            # component unit + accessibility tests (headless Chromium)
npx nx e2e demo-e2e                  # end-to-end tests in Chromium and WebKit
```

## How this was built

Built with Claude Code, using spec driven development workflow using [openspec](https://openspec.dev/) . The configuration that steers it is checked in:

| File                                               | What it is for                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`CLAUDE.md`](CLAUDE.md)                           | Repo rules for the agent: spec first, no framework imports, browser tests, axe exclusions, `A11Y.md` |
| [`.claude/commands/opsx/`](.claude/commands/opsx/) | `/opsx:*` commands that propose, apply and archive each OpenSpec change                              |
| [`openspec/config.yaml`](openspec/config.yaml)     | Project context and per-artifact rules OpenSpec adds to every proposal, spec, design and task list   |


## Layout

| Path                 | Project         | Tags                        | Purpose                                                                                                                    |
| -------------------- | --------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `libs/ui/tokens`     | `ui-tokens`     | `type:tokens` `scope:ui`    | Design tokens (SCSS → CSS custom properties), AAA-contrast themes                                                          |
| `libs/ui/components` | `ui-components` | `type:ui` `scope:ui`        | Lit components (`tins-*` custom elements)                                                                                  |
| `apps/demo`          | `demo`          | `type:app` `scope:demo`     | Angular showcase app consuming the components as custom elements                                                           |
| `apps/demo-e2e`      | `demo-e2e`      | `type:e2e` `scope:demo`     | Playwright e2e + accessibility scans for the demo, written as Gherkin features ([how to add one](apps/demo-e2e/README.md)) |
| `libs/testing/a11y`  | `testing-a11y`  | `type:util` `scope:testing` | Shared axe-core config and AAA checks for Vitest and Playwright                                                            |
| `tools/scripts`      | –               | –                           | Repository checks (Nx version policy, a11y review record)                                                                  |

Dependency rules are enforced by `@nx/enforce-module-boundaries` — see [ARCHITECTURE.md](ARCHITECTURE.md).
Accessibility policy and test layers — see [ACCESSIBILITY.md](ACCESSIBILITY.md).

### Known accessibility gaps

- **Manual review pending** for `tins-button` and `tins-file-table`. Neither has a named reviewer,
  and the screen reader passes (NVDA + Firefox, VoiceOver + Safari) have not been done. The
  expected announcements are written down but not confirmed. Windows High Contrast is checked only
  through Chromium's forced-colors emulation. See each component's `A11Y.md`.

## File table component (`tins-file-table`)

A reusable table of files from which the user selects the **available** ones and asks to download
them: per-row checkboxes, a tri-state select-all (unchecked / mixed / checked), a live
"Selected N" count, and a "Download Selected" button. Give it data, listen for one event.
`@tins/ui-components/file-table` is a bare module specifier and the bundle imports `lit`, so this
snippet needs a bundler (Vite, Angular CLI, …) or, in plain HTML, an import map. See
[Plain HTML with an import map](libs/ui/components/README.md#plain-html-with-an-import-map).

```html
<tins-file-table id="files"></tins-file-table>
<script type="module">
  import '@tins/ui-components/file-table';
  const table = document.getElementById('files');
  table.files = [
    {
      name: 'agent.exe',
      device: 'Birch',
      path: '\\srv\\share2\\apps\\bin\\agent.exe',
      status: 'available',
    },
    {
      name: 'sync.exe',
      device: 'Atlas',
      path: '\\srv\\share2\\apps\\bin\\sync.exe',
      status: 'scheduled',
    },
  ];
  table.addEventListener('tins-download', (e) => console.log(e.detail.files));
</script>
```