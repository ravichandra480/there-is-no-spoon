# Spec Delta

## Purpose

Defines the reusable file download table component: a selectable list of files (name, device, path, status) from which a user picks available files and requests a bulk download, usable from any host page.

## ADDED Requirements

### Requirement: Accepts file data
The component SHALL render one row per entry of a `files` list, where each entry has `name`, `device`, `path` and `status` string fields, and SHALL re-render when the list is replaced. An empty or missing list SHALL render the table headers and an empty-state message instead of rows.

#### Scenario: Render the sample data
- **WHEN** the component is given the six sample files (sync.exe, agent.exe, libcore.dll, audio.sys, telemetry.dll, zip.exe)
- **THEN** six data rows are shown in the given order, each displaying its name, device, path and status

#### Scenario: Data set from plain HTML
- **WHEN** a plain HTML page sets the `files` property from script, with no framework present
- **THEN** the rows render exactly as when set by a framework binding

#### Scenario: Empty list
- **WHEN** `files` is an empty array
- **THEN** the column headers remain visible, a "No files" message is shown, select-all is disabled, and "Download Selected" is disabled

### Requirement: Column layout
The component SHALL present the files as a data table with a leading selection column followed by the columns Name, Device, Path and Status, in that order, with column headers exposed as table headers to assistive technology.

#### Scenario: Header semantics
- **WHEN** a screen reader user navigates to a cell in the Path column
- **THEN** the cell is announced with its "Path" column header

#### Scenario: Long path
- **WHEN** a file's path is longer than its column width
- **THEN** the full path remains readable (wrapped, not truncated with hidden text)

### Requirement: Status display
The component SHALL display each file's status as capitalized text (for example "Scheduled", "Available"). Files with status `available` SHALL additionally show a green indicator dot before the text; the dot SHALL be decorative and SHALL meet 3:1 contrast against the row background in every theme.

#### Scenario: Available file
- **WHEN** a row's status is `available`
- **THEN** the row shows a green dot followed by the text "Available", and the dot is hidden from assistive technology

#### Scenario: Scheduled file
- **WHEN** a row's status is `scheduled`
- **THEN** the row shows the text "Scheduled" with no dot

#### Scenario: Unknown status
- **WHEN** a row's status is a value other than `available` or `scheduled`
- **THEN** the status text is shown capitalized and the row is treated as not available

### Requirement: Only available files are selectable
The component SHALL allow selecting a row only when its status is `available`. Rows with any other status SHALL render a disabled checkbox whose accessible description states why it cannot be selected, and SHALL never become selected.

#### Scenario: Select an available file
- **WHEN** the user checks the checkbox on the agent.exe row
- **THEN** that row becomes selected, its checkbox is checked, and the row is visually highlighted

#### Scenario: Scheduled file cannot be selected
- **WHEN** the user clicks the checkbox or the row of sync.exe (status `scheduled`)
- **THEN** the row stays unselected and the checkbox is announced as disabled with a reason such as "Not available for download"

#### Scenario: Data change drops stale selection
- **WHEN** a selected file is removed from `files` or its status changes away from `available`
- **THEN** it is no longer part of the selection and the count updates

### Requirement: Row click toggles selection
Clicking anywhere on a selectable row SHALL toggle that row's selection, equivalent to clicking its checkbox. Selecting text inside a row with the pointer SHALL NOT toggle it.

#### Scenario: Click on the device cell
- **WHEN** the user clicks the "Cedar" cell of the libcore.dll row while it is unselected
- **THEN** the libcore.dll row becomes selected

### Requirement: Select-all tri-state
The toolbar SHALL contain a select-all checkbox that reflects the selection over selectable rows: unchecked when none are selected, indeterminate when some are, and checked when all are. Activating it SHALL select all selectable rows unless all are already selected, in which case it SHALL clear the selection.

#### Scenario: Partial selection shows indeterminate
- **WHEN** one of the two available files is selected
- **THEN** the select-all checkbox is shown and exposed as mixed (indeterminate)

#### Scenario: Select all from partial
- **WHEN** the select-all checkbox is indeterminate and the user activates it
- **THEN** every available file becomes selected, no scheduled file is selected, and select-all is checked

#### Scenario: Clear all
- **WHEN** all available files are selected and the user activates select-all
- **THEN** no file is selected and select-all is unchecked

#### Scenario: Nothing selectable
- **WHEN** no file in the list has status `available`
- **THEN** the select-all checkbox is disabled

### Requirement: Selection count
The toolbar SHALL show "None selected" when no file is selected and "Selected N" when N files are selected, and SHALL expose count changes to assistive technology as a polite status message without moving focus.

#### Scenario: Count after selecting two files
- **WHEN** the user selects agent.exe and libcore.dll
- **THEN** the toolbar reads "Selected 2" and screen readers announce the new count

#### Scenario: Count when empty
- **WHEN** no file is selected
- **THEN** the toolbar reads "None selected"

### Requirement: Download selected action
The toolbar SHALL contain a "Download Selected" button that is disabled when nothing is selected. Activating it SHALL emit a `tins-download` event, bubbling and composed, whose detail lists the selected files in display order. The component SHALL NOT itself transfer files or show dialogs.

#### Scenario: Download two files
- **WHEN** agent.exe and libcore.dll are selected and the user activates "Download Selected"
- **THEN** one `tins-download` event is dispatched whose detail contains exactly those two file entries, including their device and path

#### Scenario: Nothing selected
- **WHEN** no file is selected
- **THEN** "Download Selected" is disabled and activating it dispatches no event

### Requirement: Selection change event
The component SHALL emit a `tins-selection-change` event, bubbling and composed, after every user-initiated selection change, whose detail lists the currently selected files. It SHALL also expose the current selection as a read-only property.

#### Scenario: Event on select-all
- **WHEN** the user activates select-all with nothing selected
- **THEN** one `tins-selection-change` event is dispatched listing all available files, and the selection property returns the same files

### Requirement: Keyboard operation
Every control SHALL be operable by keyboard alone using native semantics: Tab moves through select-all, "Download Selected" (when enabled) and each enabled row checkbox in order; Space toggles the focused checkbox; Enter or Space activates the button. Disabled row checkboxes SHALL be skipped by Tab.

#### Scenario: Keyboard-only download
- **WHEN** a keyboard user tabs to the agent.exe checkbox, presses Space, tabs back to "Download Selected" and presses Enter
- **THEN** a `tins-download` event is dispatched containing agent.exe

#### Scenario: Scheduled rows skipped
- **WHEN** a keyboard user tabs through the rows of the sample data
- **THEN** focus lands only on the checkboxes of agent.exe and libcore.dll

### Requirement: Accessible names for controls
Each row checkbox SHALL have an accessible name that identifies its file (for example "Select agent.exe"), the select-all checkbox SHALL be named "Select all available files", and the table SHALL have an accessible name that defaults to "Files" and can be set by the consumer.

#### Scenario: Consumer label
- **WHEN** the consumer sets the component's label to "Quarantined files"
- **THEN** the table's accessible name is "Quarantined files"

### Requirement: Narrow viewport presentation
At narrow widths, down to 320 CSS pixels, the toolbar SHALL wrap without clipping, and the table SHALL scroll horizontally inside a keyboard-focusable, labelled region rather than causing the page to scroll horizontally.

#### Scenario: 320px viewport
- **WHEN** the component is rendered in a 320 CSS pixel wide viewport
- **THEN** the page has no horizontal scrollbar, the toolbar controls are all visible, and the table region can be scrolled with the keyboard
