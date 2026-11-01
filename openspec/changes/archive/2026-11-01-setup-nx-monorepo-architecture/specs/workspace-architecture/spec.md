# Spec Delta

## Purpose

Defines how the Nx monorepo is organized, which toolchain every project uses, and the dependency rules and standard tasks that keep applications and libraries consistent and independently testable.

## ADDED Requirements

### Requirement: Project layout
The workspace SHALL place deployable applications and their e2e projects under `apps/` and reusable libraries under `libs/`, with every project registered in the Nx project graph.

#### Scenario: Projects are discoverable
- **WHEN** a developer runs `npx nx show projects`
- **THEN** the output lists the demo app, the demo e2e project, the component library, and the tokens library

#### Scenario: E2E project lives next to its app
- **WHEN** the demo app exists at `apps/demo`
- **THEN** its e2e project exists at `apps/demo-e2e` and declares an implicit dependency on the demo app

### Requirement: Project tagging
Every project SHALL carry a `type:` tag (`app`, `e2e`, `ui`, `tokens`, `util`) and a `scope:` tag so that dependency rules can be enforced by tag.

#### Scenario: Untagged project is rejected
- **WHEN** a project is added without a `type:` tag
- **THEN** linting fails with a module-boundary error identifying the project

### Requirement: Enforced dependency direction
The workspace SHALL enforce that apps may depend on `ui`, `tokens`, and `util` libraries; `ui` libraries may depend on `tokens` and `util` only; `tokens` and `util` libraries depend on no `ui` or `app` project; and no library depends on an app.

#### Scenario: Library imports an app
- **WHEN** code in a `type:ui` library imports from `apps/demo`
- **THEN** `nx lint` for that library fails with a module-boundary violation

#### Scenario: Library imports another framework
- **WHEN** code in a `type:ui` library imports from an Angular package
- **THEN** `nx lint` for that library fails, keeping UI libraries framework-agnostic

### Requirement: Unified toolchain
All projects SHALL build with Vite, run unit tests with Vitest, style with SCSS, and lint with ESLint; the demo app's end-to-end tests SHALL run with Playwright. No project SHALL introduce an alternative bundler or unit test runner.

#### Scenario: Unit tests use the shared runner
- **WHEN** `npx nx run-many -t test` is executed
- **THEN** every project with tests runs them through Vitest and reports results in a consistent format

#### Scenario: Styles are authored in SCSS
- **WHEN** a component or app stylesheet is added
- **THEN** it is an `.scss` file compiled as part of the project's Vite build

### Requirement: Standard targets
Each library SHALL expose `build`, `test`, and `lint` targets; the demo app SHALL expose `build`, `serve`, `test`, and `lint`; the e2e project SHALL expose `e2e`. Targets SHALL be cacheable with declared inputs and outputs.

#### Scenario: Cached rebuild
- **WHEN** `npx nx build <project>` is run twice with no source changes
- **THEN** the second run is served from the Nx cache

#### Scenario: Affected checks
- **WHEN** only a file in the tokens library changes
- **THEN** `npx nx affected -t test` runs tests for the tokens library, every library depending on it, and the demo app, and skips unrelated projects

### Requirement: Single package manager and version policy
The workspace SHALL use npm with a single root `package.json` and lockfile, and all Nx plugin packages SHALL share the same version as `nx`.

#### Scenario: Version drift detected
- **WHEN** an `@nx/*` package version differs from the installed `nx` version
- **THEN** the repository's verification step fails and reports the mismatch

### Requirement: Continuous integration gate
The repository SHALL run lint, unit test, build, and e2e tasks for affected projects on every pull request, and the pull request SHALL be blocked when any of them fails.

#### Scenario: Failing check blocks merge
- **WHEN** a pull request introduces a failing unit test or accessibility violation
- **THEN** the CI workflow reports failure for that pull request
