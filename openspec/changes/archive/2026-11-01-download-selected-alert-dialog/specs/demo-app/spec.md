# Spec Delta

## MODIFIED Requirements

### Requirement: Showcase download lists only available files
When the file table showcase receives a `tins-download` event, the demo SHALL re-check each file with the library's shared availability predicate. Its download alert SHALL list only the files that pass, in the order received, showing each one's path and device. If no file passes, the demo SHALL NOT open the alert.

#### Scenario: Select all then download
- **WHEN** a user selects all files on `/file-table` and activates "Download Selected"
- **THEN** the alert lists exactly agent.exe (Birch) and libcore.dll (Cedar), in that order, and no scheduled file

#### Scenario: Some files selected then download
- **WHEN** a user selects only libcore.dll on `/file-table` and activates "Download Selected"
- **THEN** the alert lists exactly one file, with path `\srv\share1\apps\bin\libcore.dll` and device Cedar

#### Scenario: Event carrying an unavailable file
- **WHEN** the showcase receives a `tins-download` event whose detail includes sync.exe (status `scheduled`) and agent.exe
- **THEN** the alert lists only agent.exe

#### Scenario: Event with no available files
- **WHEN** the showcase receives a `tins-download` event whose files are all not available
- **THEN** no alert opens

### Requirement: End-to-end test coverage
The demo app SHALL have end-to-end tests run in Chromium and WebKit that cover navigation to the showcase page, keyboard-only operation of the file table, and an accessibility scan of every route.

#### Scenario: New route without e2e coverage
- **WHEN** a component page route is added without a corresponding e2e accessibility scan
- **THEN** the e2e suite's route-coverage check fails and names the uncovered route

#### Scenario: Keyboard-only flow
- **WHEN** the e2e suite operates the file table using only the keyboard
- **THEN** every interactive behavior documented for it (choosing some or all files, select all, download, closing the download alert) is reachable and functions

## ADDED Requirements

### Requirement: Download alert shows path and device of each file
Each file in the showcase's download alert SHALL be shown as one list item containing the file's full path and its device, each preceded by a visible label ("Path" and "Device"). The full path SHALL be readable without truncation, wrapping when it is longer than the alert is wide. A summary line above the list SHALL state how many files were requested.

#### Scenario: Labelled path and device
- **WHEN** the alert lists agent.exe
- **THEN** its list item reads "Path: \srv\share2\apps\bin\agent.exe Device: Birch" (ignoring whitespace between the two lines)

#### Scenario: Count summary
- **WHEN** the alert lists two files
- **THEN** the line above the list reads "These 2 file(s) would be downloaded:"

#### Scenario: Long path at narrow width
- **WHEN** the alert opens in a 320 CSS pixel wide viewport
- **THEN** every path is fully visible (wrapped, not clipped or ellipsized) and the page has no horizontal scrollbar

### Requirement: Download alert is an accessible modal alert dialog
The download alert SHALL be a modal exposed to assistive technology as an alert dialog, named by its "Download requested" title and described by its summary line and file list. On opening it SHALL move focus to its "Close" button. "Close" or Escape SHALL close it and return focus to "Download Selected". It SHALL have no WCAG 2.2 A/AA/AAA violations in every theme.

#### Scenario: Announced as an alert
- **WHEN** the alert opens
- **THEN** it is exposed with role `alertdialog`, accessible name "Download requested", and an accessible description that includes the path and device of each listed file

#### Scenario: Initial focus
- **WHEN** a keyboard user activates "Download Selected" with Enter
- **THEN** focus is on the alert's "Close" button

#### Scenario: Dismiss with Escape
- **WHEN** the alert is open and the user presses Escape
- **THEN** the alert closes and focus is on "Download Selected"

#### Scenario: Dismiss with Close
- **WHEN** the alert is open and the user activates "Close"
- **THEN** the alert closes and focus is on "Download Selected"

#### Scenario: Background is inert
- **WHEN** the alert is open and the user presses Tab repeatedly
- **THEN** focus never lands on page content outside the alert

#### Scenario: No accessibility violations
- **WHEN** the alert is open with both available files listed, in any theme
- **THEN** an axe scan of the alert reports no WCAG 2.2 A/AA/AAA violations
