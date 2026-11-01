# Spec Delta

## Purpose

Defines the Angular demo application that consumes the web component libraries, showcases every component and state for review, and serves as the target for end-to-end and accessibility testing.

## ADDED Requirements

### Requirement: Consumes components as custom elements
The demo app SHALL use the component libraries through their published entry points as custom elements, exactly as an external Angular consumer would, without importing library internals.

#### Scenario: Deep import rejected
- **WHEN** demo app code imports a non-public file path from a component library
- **THEN** linting fails with a module-boundary or restricted-import error

#### Scenario: Two-way binding with a form control
- **WHEN** a demo page binds an Angular form control to a form-control component
- **THEN** user input in the component updates the Angular model, and model changes update the component

### Requirement: Component showcase pages
The demo app SHALL provide one routed page per component that renders every documented variant and state, plus a usage snippet and a summary of the component's keyboard interaction and accessibility notes.

#### Scenario: Navigate to a component page
- **WHEN** a user selects "Button" in the demo navigation
- **THEN** the URL changes to that component's route and the page shows all button variants and states

#### Scenario: Deep link
- **WHEN** a user opens a component page URL directly
- **THEN** that page renders without first visiting the home page

### Requirement: Accessible application shell
The demo app shell SHALL provide a skip link to main content, landmark regions, a single `h1` per page, a page title that reflects the current route, and focus moved to the main heading after route changes.

#### Scenario: Route change announces new page
- **WHEN** a user navigates to a different component page
- **THEN** the document title updates and keyboard focus moves to that page's main heading

#### Scenario: Skip link
- **WHEN** a keyboard user presses Tab once after page load and activates the skip link
- **THEN** focus moves to the main content region

### Requirement: Theme and preference controls
The demo app SHALL let users switch between the default and high-contrast themes, and SHALL honor operating-system preferences for color scheme, reduced motion, and forced colors.

#### Scenario: Reduced motion preference
- **WHEN** the browser reports `prefers-reduced-motion: reduce`
- **THEN** no non-essential animation or transition plays in the app or components

#### Scenario: Theme choice persists
- **WHEN** a user selects the high-contrast theme and reloads the page
- **THEN** the high-contrast theme is still applied

### Requirement: End-to-end test coverage
The demo app SHALL have end-to-end tests run in Chromium, Firefox, and WebKit that cover navigation to every component page, keyboard-only operation of each component, and an accessibility scan of every route.

#### Scenario: New route without e2e coverage
- **WHEN** a component page route is added without a corresponding e2e accessibility scan
- **THEN** the e2e suite's route-coverage check fails and names the uncovered route

#### Scenario: Keyboard-only flow
- **WHEN** the e2e suite operates each component using only the keyboard
- **THEN** every interactive behavior documented for that component is reachable and functions
