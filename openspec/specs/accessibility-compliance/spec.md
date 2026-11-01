# accessibility-compliance Specification

## Purpose

Defines the WCAG 2.2 Level AAA conformance target for all components and the demo app, and the automated and manual verification that must pass before UI changes are merged.

## Requirements

### Requirement: Conformance target
All components and demo app pages SHALL conform to WCAG 2.2 Levels A, AA, and AAA success criteria that apply to their content, and any criterion deemed not applicable SHALL be recorded with a reason.

#### Scenario: Not-applicable criterion
- **WHEN** a component has no time-based media
- **THEN** its accessibility record marks criteria 1.2.x as not applicable with a stated reason

### Requirement: Enhanced contrast
Text and images of text SHALL have a contrast ratio of at least 7:1 against their background, or 4.5:1 for large text (WCAG 1.4.6), in every shipped theme and in every component state including hover, focus, active, disabled-adjacent labels, and error.

#### Scenario: Token palette below threshold
- **WHEN** a design token pair used for text and background has a contrast ratio below 7:1 for normal text
- **THEN** the tokens library's test target fails and names the offending token pair

#### Scenario: Rendered contrast scan
- **WHEN** the automated accessibility scan runs with AAA rules on a component or page
- **THEN** any enhanced-contrast violation fails the test

### Requirement: Non-text contrast and visible focus
User interface component boundaries, state indicators, and focus indicators SHALL have at least 3:1 contrast against adjacent colors, and every focusable element SHALL show a focus indicator that is at least a 2 CSS pixel thick perimeter, not obscured by other content (WCAG 1.4.11, 2.4.7, 2.4.11, 2.4.12, 2.4.13).

#### Scenario: Focus indicator present
- **WHEN** a keyboard user moves focus onto any interactive component
- **THEN** a visible focus indicator meeting the size and contrast requirement is displayed and is not hidden by sticky or overlapping content

### Requirement: Keyboard operability without exception
All functionality SHALL be operable through the keyboard alone with no keyboard trap and no timing requirement for individual keystrokes (WCAG 2.1.1, 2.1.2, 2.1.3), following WAI-ARIA Authoring Practices keyboard patterns for each widget role.

#### Scenario: Composite widget navigation
- **WHEN** a keyboard user focuses a composite widget such as tabs or a listbox
- **THEN** arrow keys move within the widget, Tab moves out of it, and Home/End move to the first and last item

#### Scenario: No keyboard trap
- **WHEN** focus enters any component
- **THEN** the user can move focus out using standard keys only

### Requirement: Target size enhanced
Pointer targets SHALL be at least 44 by 44 CSS pixels except where WCAG 2.5.5 exceptions apply.

#### Scenario: Small target detected
- **WHEN** an interactive component's rendered hit area is smaller than 44 by 44 CSS pixels and no exception applies
- **THEN** the component's automated accessibility test fails

### Requirement: Accessible names, roles, and states
Every interactive component SHALL expose an accessible name, a correct role, and its current states and values to assistive technology, including across shadow DOM boundaries (WCAG 1.3.1, 4.1.2).

#### Scenario: Missing accessible name
- **WHEN** an icon-only button is rendered without a label
- **THEN** the automated accessibility scan reports a violation and the test fails

#### Scenario: State change announced
- **WHEN** a toggle component changes from off to on
- **THEN** the exposed state (for example `aria-pressed` or `aria-checked`) updates accordingly

### Requirement: Status and error messaging
Status messages SHALL be programmatically exposed without moving focus (WCAG 4.1.3), and input errors SHALL be identified in text with a suggestion for correction where known (WCAG 3.3.1, 3.3.3), with confirmation or undo available for consequential submissions (WCAG 3.3.6).

#### Scenario: Validation error
- **WHEN** a user submits a required form-control component left empty
- **THEN** an error message in text is associated with the control and announced to assistive technology

### Requirement: Motion, animation, and flashing
Components SHALL not flash more than three times per second (WCAG 2.3.2) and SHALL disable non-essential motion triggered by interaction when the user prefers reduced motion (WCAG 2.3.3).

#### Scenario: Reduced motion respected
- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** components render without interaction-triggered animation

### Requirement: Adaptable presentation
Content SHALL reflow at 320 CSS pixels width without two-dimensional scrolling (WCAG 1.4.10), remain functional with WCAG 1.4.12 text-spacing overrides, support 200% text resize, and remain usable in forced-colors (high-contrast) mode.

#### Scenario: Text spacing override
- **WHEN** the e2e suite applies the WCAG 1.4.12 text-spacing styles to a demo page
- **THEN** no text is clipped or overlapped and all controls remain operable

#### Scenario: Forced colors
- **WHEN** a page is rendered with `forced-colors: active`
- **THEN** component boundaries, focus indicators, and selected states remain visible

### Requirement: Automated accessibility testing in unit tests
Each component's unit tests SHALL run an automated accessibility scan with WCAG 2.2 A, AA, and AAA rule sets enabled against every documented state, and any violation SHALL fail the test.

#### Scenario: Violation in a component state
- **WHEN** a component's error state introduces an accessibility rule violation
- **THEN** that component's unit test fails and reports the rule id, impacted node, and WCAG criterion

### Requirement: Automated accessibility testing in end-to-end tests
The demo app's end-to-end suite SHALL run an automated accessibility scan with WCAG 2.2 A, AA, and AAA rules on every route in every shipped theme, plus keyboard, focus-visibility, reflow, and text-spacing checks, and any violation SHALL fail the suite.

#### Scenario: Page-level violation
- **WHEN** a demo route has a duplicate landmark or heading-order violation
- **THEN** the e2e test for that route fails and attaches the violation report to the test results

#### Scenario: Theme coverage
- **WHEN** the e2e accessibility scan runs
- **THEN** each route is scanned once per shipped theme

### Requirement: Static accessibility linting
Component source and Angular templates SHALL be linted with accessibility rules, and lint violations SHALL fail the lint target.

#### Scenario: Missing alt text in template
- **WHEN** an Angular template contains an `<img>` without an `alt` attribute
- **THEN** `nx lint demo` fails

### Requirement: Manual verification for non-automatable criteria
Each component and demo page SHALL have a recorded manual accessibility review covering criteria that cannot be fully automated, including screen reader testing with at least two screen reader and browser pairings, link purpose (2.4.9), section headings (2.4.10), reading level (3.1.5), and pronunciation and unusual words (3.1.3, 3.1.6).

#### Scenario: Missing manual review
- **WHEN** a pull request adds or changes a component without updating its manual review record
- **THEN** the pull request checklist marks the accessibility review as incomplete and the change is not mergeable

### Requirement: No suppression without justification
Automated accessibility rules SHALL NOT be disabled globally; any per-test exclusion SHALL reference a specific rule, target, and documented justification.

#### Scenario: Unjustified rule disable
- **WHEN** a test disables an accessibility rule without a justification comment and tracking reference
- **THEN** the lint or review check flags the exclusion and fails
