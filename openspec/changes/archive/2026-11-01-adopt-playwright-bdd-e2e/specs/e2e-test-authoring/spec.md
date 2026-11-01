# Spec Delta

## Purpose

Defines how the demo app's end-to-end tests are written and run: readable Gherkin scenarios backed by shared step definitions, executed in real browsers, and kept in sync with the demo's routes.

## ADDED Requirements

### Requirement: Behaviour written as Gherkin scenarios
Every end-to-end test of the demo app SHALL be expressed as a Gherkin scenario in a feature file, using plain-language steps; the suite SHALL contain no end-to-end tests that exist only as code.

#### Scenario: Reviewer reads the suite
- **WHEN** a reviewer opens the e2e project's feature files
- **THEN** every behaviour the suite checks (navigation, keyboard flows, accessibility scans, layout and preference checks) is described there as a named scenario

#### Scenario: Test written only in code
- **WHEN** an end-to-end test is added as a code-only test file instead of a scenario
- **THEN** the e2e suite does not run it and the project's lint or review check flags the file

### Requirement: Shared, reusable step definitions
Steps SHALL be implemented once and reused across features, and step wording SHALL describe user-visible behaviour rather than implementation details such as selectors.

#### Scenario: Same step in two features
- **WHEN** two feature files use the step "the user opens the Button page"
- **THEN** both run the same step definition

### Requirement: Undefined steps fail the suite
The suite SHALL fail before any browser starts when a scenario uses a step with no definition or with more than one matching definition, and the failure SHALL name the step and the feature file.

#### Scenario: Missing step definition
- **WHEN** a feature file contains a step that no step definition matches
- **THEN** the e2e target fails and reports the step text and its file

#### Scenario: Ambiguous step definition
- **WHEN** a step matches two step definitions
- **THEN** the e2e target fails and reports both matching definitions

### Requirement: Browser selection by tag
Scenarios that can only run in some browsers SHALL be marked with a tag, and the suite SHALL run each scenario in every configured browser (Chromium, Firefox, WebKit) except those its tags exclude.

#### Scenario: Chromium-only scenario
- **WHEN** a scenario is tagged as Chromium-only (for example forced-colors emulation)
- **THEN** it runs in Chromium and is not run in Firefox or WebKit

#### Scenario: Untagged scenario
- **WHEN** a scenario has no browser tag
- **THEN** it runs in Chromium, Firefox and WebKit

### Requirement: Route scenarios stay in sync with the route manifest
Per-route scenarios (accessibility scans per theme, reflow, text spacing, zoom) SHALL cover every route in the demo route manifest, and the suite SHALL fail and name any manifest route missing from them.

#### Scenario: Route added without scenarios
- **WHEN** a route is added to the route manifest but not to the per-route scenario examples
- **THEN** the route-coverage scenario fails and names the missing route

#### Scenario: Stale example
- **WHEN** a per-route scenario example refers to a path that is not in the route manifest
- **THEN** the route-coverage scenario fails and names the stale path

### Requirement: Readable results
Test results SHALL report each test by feature and scenario name, and SHALL keep the attachments existing checks produce, such as the accessibility scan report for each route and theme.

#### Scenario: Failed accessibility scan
- **WHEN** an accessibility scan scenario fails
- **THEN** the HTML report shows the feature and scenario name, the failing step, and the attached scan report

### Requirement: Coverage preserved through migration
Migrating the suite to scenarios SHALL NOT reduce coverage: every check the previous suite made (routes, themes, browsers, keyboard flows, interactive states, presentation checks) SHALL have a corresponding scenario that fails under the same conditions.

#### Scenario: Known violation still caught
- **WHEN** a heading-order violation is temporarily added to a demo page
- **THEN** the accessibility scenario for that page fails in every theme, as it did before the migration
