# Design

## Context

See proposal.md - Why. Select-all is a native `<input type="checkbox">` in `libs/ui/components/src/file-table/file-table.ts`. When it is activated by a click or by Space, the browser first clears `indeterminate` and flips `checked`, then fires `change`. `#onSelectAll` ignores the input's new `checked` value. It decides from the component's own state: if every selectable file is in the selection it commits an empty set, and otherwise it commits the full selectable set. The re-render then sets `checked` and `indeterminate` through `live()`.

That is why the partial case works. A naive handler such as `checked ? selectAll() : clear()` would also work for an indeterminate box, because the browser flips `checked` from false to true. But it would break as soon as the visual state and the real selection drift apart. The tests below pin the selection outcome, not the input's `checked` value.

## Goals / Non-Goals

**Goals:**
- Lock the activation rule (none or some → all, all → none) with unit tests for pointer and keyboard, plus e2e coverage of the pointer path.

**Non-Goals:**
- Changing the rule, the tri-state rendering or the styles.
- Changing other selection paths (row click, row checkbox, host data changes). Their state rules are already covered by the archived select-all changes.

## Decisions

- **Decide from the selection, not from `checked`.** Keep `#onSelectAll` deriving `allSelected` from the selectable files and the current selection. Alternative: read `event.target.checked`. Rejected because it couples behavior to the DOM state, which the browser has already changed by the time `change` fires.
- **Pointer click in e2e via a new step.** Add `When the user clicks the {string} check box` to `file-table.steps.ts`, using the existing `checkbox(page, name)` locator and `click()`. The current e2e select-all scenarios are all keyboard-only, so this is the only end-to-end check of the browser's click handling on an indeterminate box. Alternative: `check()`. Rejected because Playwright's `check()` asserts the result is checked, which would hide a regression where the click clears the box.
- **Three-file fixture for 2-of-3.** Reuse the local three-available-plus-one-scheduled fixture pattern from the indeterminate tests, so "some" means more than one file and a partial clear would show.
- **Fix only on failure.** The component changes only if a new test fails, as in the sibling changes.

## Risks / Trade-offs

- [Overlap with existing tests such as "leaves the partial state when select-all is clicked"] → Accept it. The new block is organized by the new requirement, like its sibling blocks, and adds the cases that are missing: no file removed, the event detail, and 2-of-3.
- [Synchronous reads after a native click can see the browser's intermediate state] → Await `el.updateComplete` in unit tests, and rely on Playwright's retrying assertions in e2e.
