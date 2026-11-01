# web-component-library Specification

## Purpose

Defines the contract for the framework-agnostic web component libraries: how components are exposed as standard custom elements, styled and themed, packaged, and documented so any host application can consume them.

## Requirements

### Requirement: Standards-based custom elements
Each component SHALL be delivered as a standard custom element with a tag prefixed `tins-` (for example `tins-button`) and SHALL work in any HTML host without a framework runtime.

#### Scenario: Use in plain HTML
- **WHEN** a page loads the library bundle and contains `<tins-button>Save</tins-button>`
- **THEN** the element upgrades and renders a functional button without any framework present

#### Scenario: Duplicate registration is safe
- **WHEN** the library's registration module is imported twice in the same page
- **THEN** no error is thrown and the element is defined once

### Requirement: Public component API
Each component SHALL expose its public API through attributes/properties, slots, CSS custom properties, CSS shadow parts, and DOM events, and SHALL document every one of them.

#### Scenario: Property reflects to attribute
- **WHEN** a consumer sets a documented boolean property such as `disabled` to `true`
- **THEN** the corresponding attribute is present on the host and the component renders its disabled state

#### Scenario: Events are composed
- **WHEN** a user activates a component that emits a documented event
- **THEN** the event bubbles and is composed so that host frameworks can listen on the custom element

### Requirement: Native form participation
Components that represent form controls SHALL participate in native HTML forms, including value submission, reset, validation state, and label association.

#### Scenario: Form submission includes value
- **WHEN** a form containing a named form-control component is submitted
- **THEN** the submitted form data includes that component's name and current value

#### Scenario: Label association
- **WHEN** a native `<label for>` references a form-control component
- **THEN** the component's accessible name is the label's text

### Requirement: Themeable styling via design tokens
Component styles SHALL consume design tokens exposed as CSS custom properties, so that consumers can retheme components without modifying component source.

#### Scenario: Consumer overrides a token
- **WHEN** a host page sets a documented token custom property on an ancestor
- **THEN** components beneath that ancestor render using the overridden value

#### Scenario: Default theme without host CSS
- **WHEN** a component is rendered with no host-provided tokens
- **THEN** it renders with the default theme values

### Requirement: Distributable package output
Each library build SHALL produce ES module output, TypeScript type declarations, and a Custom Elements Manifest, with per-component entry points so consumers can import only what they use.

#### Scenario: Per-component import
- **WHEN** a consumer imports only the button entry point
- **THEN** only the button and its dependencies are included in the consumer's bundle

#### Scenario: Manifest describes components
- **WHEN** the library is built
- **THEN** the output contains a `custom-elements.json` listing each element's tag, attributes, properties, events, slots, CSS parts, and CSS custom properties

### Requirement: Framework type support
The library SHALL provide type information that allows TypeScript hosts to recognize element tags and their properties.

#### Scenario: Typed element lookup
- **WHEN** host code calls `document.querySelector('tins-button')`
- **THEN** the TypeScript return type is the button element class

### Requirement: Component unit test coverage
Every component SHALL have unit tests running in a real browser engine that cover rendering, each documented state, keyboard interaction, emitted events, and an automated accessibility scan.

#### Scenario: Component without tests
- **WHEN** a new component is added without a test file
- **THEN** the library's test target fails the coverage threshold
