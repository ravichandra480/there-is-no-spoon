# file-download-table Specification

## Purpose

Defines the reusable file download table component: a selectable list of files (name, device, path, status) from which a user picks available files and requests a bulk download, usable from any host page.

## Requirements

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
The component SHALL display each file's status as capitalized text (for example "Scheduled", "Available"). Files that are available (see "Only available files are selectable") SHALL additionally show a green indicator dot before the text; the dot SHALL be decorative and SHALL meet 3:1 contrast against the row background in every theme.

#### Scenario: Available file
- **WHEN** a row's status is `available`
- **THEN** the row shows a green dot followed by the text "Available", and the dot is hidden from assistive technology

#### Scenario: Scheduled file
- **WHEN** a row's status is `scheduled`
- **THEN** the row shows the text "Scheduled" with no dot

#### Scenario: Unknown status
- **WHEN** a row's status is a value other than `available` or `scheduled`
- **THEN** the status text is shown capitalized and the row is treated as not available

### Requirement: Canonical status labels
Known statuses (`available`, `scheduled`) SHALL be displayed with their canonical label regardless of the case or surrounding whitespace they were given in. Other statuses SHALL be displayed in sentence case: every `_` and `-` replaced by a space, runs of whitespace collapsed to a single space, leading and trailing whitespace removed, all letters lower-cased, and then the first letter upper-cased. A status that is empty after this normalization SHALL display as empty text. Formatting SHALL affect only the displayed label; the status value in `files`, `selected` and `tins-download` SHALL remain the string the host supplied.

#### Scenario: Known status in another case
- **WHEN** a row's status is `AVAILABLE` or ` Scheduled `
- **THEN** the row shows "Available" (with the dot) or "Scheduled" (without it) respectively

#### Scenario: Unknown status in upper snake case
- **WHEN** a row's status is `IN_PROGRESS`
- **THEN** the row shows "In progress" with no dot, and the row is treated as not available

#### Scenario: Unknown status with hyphens and extra whitespace
- **WHEN** a row's statuses are `pending-review` and `  failed   VERIFICATION `
- **THEN** the rows show "Pending review" and "Failed verification" respectively

#### Scenario: Unknown single word
- **WHEN** a row's status is `quarantined`
- **THEN** the row shows "Quarantined"

#### Scenario: Status made only of separators
- **WHEN** a row's status is `__` or ` - `
- **THEN** the status cell shows empty text, renders without error, and the row is treated as not available

#### Scenario: Original value is preserved
- **WHEN** a row's status is `IN_PROGRESS` and the host reads that file back from `files`
- **THEN** its `status` is still `IN_PROGRESS`

#### Scenario: Missing or non-string status
- **WHEN** a row's status is missing, `null`, or not a string
- **THEN** the component renders without error, shows no dot, and treats the row as not available

### Requirement: Only available files are selectable
The component SHALL allow selecting a row only when its status is available. A status is available when, after removing surrounding whitespace and ignoring case, it equals `available`. Rows with any other status SHALL render a disabled checkbox whose accessible description states why it cannot be selected, and SHALL never become selected.

#### Scenario: Select an available file
- **WHEN** the user checks the checkbox on the agent.exe row
- **THEN** that row becomes selected, its checkbox is checked, and the row is visually highlighted

#### Scenario: Scheduled file cannot be selected
- **WHEN** the user clicks the checkbox or the row of sync.exe (status `scheduled`)
- **THEN** the row stays unselected and the checkbox is announced as disabled with a reason such as "Not available for download"

#### Scenario: Data change drops stale selection
- **WHEN** a selected file is removed from `files` or its status changes away from `available`
- **THEN** it is no longer part of the selection and the count updates

#### Scenario: Status variants count as available
- **WHEN** files have the statuses `Available`, `AVAILABLE` and ` available `
- **THEN** each of those rows has an enabled checkbox and is chosen by select-all

#### Scenario: Look-alike statuses do not count
- **WHEN** files have the statuses `unavailable`, `available-soon` or an empty string
- **THEN** each of those rows has a disabled checkbox and is never selected

#### Scenario: Case-only status change keeps the selection
- **WHEN** a selected file's status is replaced from `available` to `Available`
- **THEN** the file stays selected and no selection is dropped

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

### Requirement: Select-all is unchecked when nothing is selected
Whenever no file is selected, however the selection became empty, the select-all checkbox SHALL be neither checked nor indeterminate. It SHALL be visually unchecked (no check mark, no dash) and SHALL be exposed to assistive technology as not checked, not as mixed.

#### Scenario: Initial render
- **WHEN** the component first renders the sample files with nothing selected
- **THEN** select-all is unchecked, not indeterminate, and the toolbar reads "None Selected"

#### Scenario: Last row unchecked with its checkbox
- **WHEN** only agent.exe is selected and the user unchecks the agent.exe checkbox
- **THEN** select-all is unchecked and not indeterminate

#### Scenario: Last row unchecked by clicking the row
- **WHEN** only libcore.dll is selected and the user clicks the libcore.dll row outside its checkbox
- **THEN** select-all is unchecked and not indeterminate

#### Scenario: Rows unchecked one by one after select-all
- **WHEN** the user activates select-all and then unchecks every available row one at a time
- **THEN** after the last row is unchecked, select-all is unchecked and not indeterminate

#### Scenario: Cleared with select-all
- **WHEN** all available files are selected and the user activates select-all
- **THEN** select-all is unchecked and not indeterminate

#### Scenario: Data change empties the selection
- **WHEN** files are selected and the host replaces `files` so that none of the selected files is present and available
- **THEN** select-all is unchecked and not indeterminate, and the toolbar reads "None Selected"

#### Scenario: Disabled with nothing selected
- **WHEN** select-all was checked and the host replaces `files` with a list that has no available file
- **THEN** select-all is disabled, unchecked and not indeterminate

### Requirement: Select-all is checked when every selectable file is selected
Whenever at least one file is selectable and every selectable file is selected, however that came about, the select-all checkbox SHALL be checked and SHALL NOT be indeterminate. It SHALL show a check mark (no dash) and SHALL be exposed to assistive technology as checked, not as mixed. Files that are not available do not count toward "every".

#### Scenario: Select-all from nothing selected
- **WHEN** nothing is selected and the user activates select-all
- **THEN** agent.exe and libcore.dll are selected, select-all is checked and not indeterminate, and the toolbar reads "Selected 2"

#### Scenario: Select-all from a partial selection
- **WHEN** only agent.exe is selected and the user activates select-all
- **THEN** select-all is checked and not indeterminate

#### Scenario: Last row checked with its checkbox
- **WHEN** only agent.exe is selected and the user checks the libcore.dll checkbox
- **THEN** select-all is checked and not indeterminate

#### Scenario: Last row checked by clicking the row
- **WHEN** only agent.exe is selected and the user clicks the libcore.dll row outside its checkbox
- **THEN** select-all is checked and not indeterminate

#### Scenario: Last row checked with the keyboard
- **WHEN** only agent.exe is selected and the user focuses the libcore.dll checkbox and presses Space
- **THEN** select-all is checked and not indeterminate, and the toolbar reads "Selected 2"

#### Scenario: Data change completes the selection
- **WHEN** only agent.exe is selected and the host replaces `files` so that libcore.dll is removed or no longer available
- **THEN** select-all is checked and not indeterminate, and the toolbar reads "Selected 1"

#### Scenario: New available file breaks the full selection
- **WHEN** every available file is selected and the host replaces `files` with a list that adds another available file
- **THEN** select-all is indeterminate and not checked, and the previously selected files stay selected

#### Scenario: Unavailable files do not prevent the checked state
- **WHEN** the list contains scheduled files and every available file is selected
- **THEN** select-all is checked and not indeterminate, even though the scheduled files are not selected

### Requirement: Select-all is indeterminate when some but not all selectable files are selected
Whenever at least one selectable file is selected and at least one selectable file is not, however that came about, the select-all checkbox SHALL be indeterminate and SHALL NOT be checked. It SHALL show a dash (no check mark) and SHALL be exposed to assistive technology as mixed, not as checked or not checked. Files that are not available count toward neither "some" nor "all".

#### Scenario: First row checked with its checkbox
- **WHEN** nothing is selected and the user checks the agent.exe checkbox
- **THEN** select-all is indeterminate and not checked, and the toolbar reads "Selected 1"

#### Scenario: First row checked by clicking the row
- **WHEN** nothing is selected and the user clicks the libcore.dll row outside its checkbox
- **THEN** select-all is indeterminate and not checked

#### Scenario: First row checked with the keyboard
- **WHEN** nothing is selected and the user focuses the agent.exe checkbox and presses Space
- **THEN** select-all is indeterminate and not checked, and the toolbar reads "Selected 1"

#### Scenario: One row unchecked with its checkbox after select-all
- **WHEN** the user activates select-all and then unchecks the agent.exe checkbox
- **THEN** select-all is indeterminate and not checked, and the toolbar reads "Selected 1"

#### Scenario: One row unchecked by clicking the row after select-all
- **WHEN** the user activates select-all and then clicks the libcore.dll row outside its checkbox
- **THEN** select-all is indeterminate and not checked

#### Scenario: Several but not all selected
- **WHEN** the list has three available files and the user selects two of them
- **THEN** select-all is indeterminate and not checked, and the toolbar reads "Selected 2"

#### Scenario: Data change leaves a partial selection
- **WHEN** the list has three available files, two are selected, and the host replaces `files` so that one of the selected files is removed or no longer available
- **THEN** select-all is indeterminate and not checked, and the toolbar reads "Selected 1"

#### Scenario: Unavailable files do not create a partial state
- **WHEN** the list contains scheduled files and every available file is selected
- **THEN** select-all is checked and not indeterminate

#### Scenario: Activating select-all leaves the partial state
- **WHEN** select-all is indeterminate and the user activates it with a click or with Space
- **THEN** every available file is selected, and select-all is checked and not indeterminate

### Requirement: Activating select-all selects every selectable file unless all are selected
When the user activates the select-all checkbox while no selectable file is selected, or while some but not all are, every selectable file SHALL become selected. Files already selected SHALL stay selected, and files that are not available SHALL stay unselected. Only when every selectable file is already selected SHALL activating it clear the selection. Pointer click, Space and Enter SHALL behave the same.

#### Scenario: None selected, pointer click
- **WHEN** nothing is selected and the user clicks the select-all checkbox
- **THEN** agent.exe and libcore.dll are selected, no scheduled file is selected, select-all is checked and not indeterminate, and the toolbar reads "Selected 2"

#### Scenario: None selected, Space
- **WHEN** nothing is selected and the user focuses the select-all checkbox and presses Space
- **THEN** agent.exe and libcore.dll are selected, select-all is checked and not indeterminate, and the toolbar reads "Selected 2"

#### Scenario: Some selected, pointer click
- **WHEN** only agent.exe is selected and the user clicks the select-all checkbox
- **THEN** agent.exe stays selected, libcore.dll becomes selected, select-all is checked and not indeterminate, and the toolbar reads "Selected 2"

#### Scenario: Some selected, Space
- **WHEN** only libcore.dll is selected and the user focuses the select-all checkbox and presses Space
- **THEN** libcore.dll stays selected, agent.exe becomes selected, and the toolbar reads "Selected 2"

#### Scenario: Several but not all selected
- **WHEN** the list has three available files and one scheduled file, two of the available files are selected, and the user activates select-all
- **THEN** all three available files are selected, the scheduled file is not, and the toolbar reads "Selected 3"

#### Scenario: Partial activation never clears
- **WHEN** some but not all selectable files are selected and the user activates select-all
- **THEN** no file that was selected before becomes unselected

#### Scenario: Partial activation emits one complete selection event
- **WHEN** only agent.exe is selected and the user activates select-all
- **THEN** exactly one `tins-selection-change` event is dispatched, its detail lists agent.exe and libcore.dll in display order, and the selection property returns the same files

#### Scenario: All selected still clears
- **WHEN** every selectable file is selected and the user activates select-all
- **THEN** no file is selected, select-all is unchecked and not indeterminate, and the toolbar reads "None Selected"

### Requirement: Activating select-all clears the selection when every selectable file is selected
When at least one file is selectable and every selectable file is selected, however that came about, activating the select-all checkbox SHALL unselect every file. Afterwards select-all SHALL be unchecked and not indeterminate, the toolbar SHALL read "None Selected", and "Download Selected" SHALL be disabled. Pointer click, Space and Enter SHALL behave the same. Files that are not available do not count toward "every".

#### Scenario: All selected, pointer click
- **WHEN** agent.exe and libcore.dll are selected and the user clicks the select-all checkbox
- **THEN** no file is selected, select-all is unchecked and not indeterminate, the toolbar reads "None Selected", and "Download Selected" is disabled

#### Scenario: All selected, Space
- **WHEN** agent.exe and libcore.dll are selected and the user focuses the select-all checkbox and presses Space
- **THEN** no file is selected, select-all is unchecked and not indeterminate, and the toolbar reads "None Selected"

#### Scenario: Full selection made with row clicks
- **WHEN** the user clicks the agent.exe row and then the libcore.dll row outside their checkboxes, and then activates select-all
- **THEN** no file is selected and select-all is unchecked and not indeterminate

#### Scenario: Full selection caused by a host data change
- **WHEN** only agent.exe is selected, the host replaces `files` so that libcore.dll is no longer available, and the user activates select-all
- **THEN** no file is selected, select-all is unchecked and not indeterminate, and the toolbar reads "None Selected"

#### Scenario: Larger list with unavailable files
- **WHEN** the list has three available files and one scheduled file, all three available files are selected, and the user activates select-all
- **THEN** no file is selected, including the scheduled file, and the toolbar reads "None Selected"

#### Scenario: Clearing emits one empty selection event
- **WHEN** every selectable file is selected and the user activates select-all
- **THEN** exactly one `tins-selection-change` event is dispatched, its detail lists no files, and the selection property returns an empty list

#### Scenario: Toggle round-trip
- **WHEN** every selectable file is selected and the user activates select-all twice
- **THEN** after the first activation no file is selected, and after the second every selectable file is selected and select-all is checked

#### Scenario: Focus stays on select-all
- **WHEN** a keyboard user clears the selection by pressing Space on select-all
- **THEN** focus remains on the select-all checkbox

### Requirement: Selection count
The toolbar SHALL show "None Selected" when no file is selected and "Selected N" when N files are selected, where N is the number of currently selected files that are present and available. The text SHALL update after every selection change, whether made by the user or caused by the host changing `files`, and SHALL expose count changes to assistive technology as a polite status message without moving focus.

#### Scenario: Count after selecting two files
- **WHEN** the user selects agent.exe and libcore.dll
- **THEN** the toolbar reads "Selected 2" and screen readers announce the new count

#### Scenario: Count follows each selection change
- **WHEN** nothing is selected and the user selects agent.exe, then libcore.dll, then unselects agent.exe
- **THEN** the toolbar reads "Selected 1", then "Selected 2", then "Selected 1"

#### Scenario: Count when empty
- **WHEN** no file is selected
- **THEN** the toolbar reads "None Selected"

#### Scenario: Count returns to empty after the last file is unselected
- **WHEN** only agent.exe is selected and the user unselects it
- **THEN** the toolbar reads "None Selected"

#### Scenario: Count reflects host data changes
- **WHEN** agent.exe and libcore.dll are selected and the host replaces `files` so that agent.exe is no longer available
- **THEN** the toolbar reads "Selected 1"

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
Every control SHALL be operable by keyboard alone using native semantics: Tab moves through select-all, "Download Selected" (when enabled) and each enabled row checkbox in order; Space or Enter toggles the focused checkbox (Enter never submits an enclosing form, and does nothing on a disabled checkbox); Enter or Space activates the button. Disabled row checkboxes SHALL be skipped by Tab.

#### Scenario: Keyboard-only download
- **WHEN** a keyboard user tabs to the agent.exe checkbox, presses Space, tabs back to "Download Selected" and presses Enter
- **THEN** a `tins-download` event is dispatched containing agent.exe

#### Scenario: Enter toggles a checkbox
- **WHEN** a keyboard user focuses the agent.exe checkbox and presses Enter, then presses Enter again
- **THEN** agent.exe is selected after the first press and unselected after the second, and focus stays on the checkbox

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

### Requirement: Shared availability predicate
The file table entry point SHALL export a pure function `isDownloadable(file)` that returns `true` exactly when the component would treat that file as available, so hosts can apply the identical rule. It SHALL NOT throw for any input object, including one with a missing or non-string status.

#### Scenario: Predicate matches the component
- **WHEN** a host calls `isDownloadable` on each entry of a list given to the component
- **THEN** it returns `true` for exactly the rows whose checkboxes are enabled

#### Scenario: Malformed entry
- **WHEN** a host calls `isDownloadable({ name: 'x', device: 'd', path: 'p' })` with no status
- **THEN** it returns `false` without throwing

### Requirement: Download never includes unavailable files
The `tins-download` event detail and the read-only selection property SHALL contain only files that are available at the moment they are read, even if `files` changed after the user selected and before the component re-rendered.

#### Scenario: Status changes just before download
- **WHEN** agent.exe and libcore.dll are selected, the host replaces `files` so that agent.exe is `scheduled`, and "Download Selected" is activated before the component has re-rendered
- **THEN** the dispatched `tins-download` detail contains only libcore.dll

#### Scenario: Every selected file became unavailable
- **WHEN** all selected files change to a non-available status
- **THEN** activating "Download Selected" dispatches no `tins-download` event

### Requirement: Hovered row changes colour
When the pointer is over an unselected file row, whether or not its file is available, the component SHALL show that row with a background colour different from the default row background. The colour SHALL return to the default when the pointer leaves.

#### Scenario: Hover an available row
- **WHEN** the pointer moves over the unselected agent.exe row
- **THEN** its background colour differs from the background of an unhovered, unselected row

#### Scenario: Pointer leaves the row
- **WHEN** the pointer moves off the agent.exe row while it is unselected
- **THEN** its background returns to the default row background

### Requirement: Selected row has a distinct colour
A selected row SHALL have a background colour that differs from both the default row background and the hovered-row background, so selection can be told apart from hover.

#### Scenario: Selected versus hovered
- **WHEN** agent.exe is selected and the pointer is over the unselected libcore.dll row
- **THEN** the agent.exe background, the libcore.dll background and the default row background are three different colours

#### Scenario: Selection by keyboard shows the colour
- **WHEN** the user selects agent.exe by focusing its checkbox and pressing Space, with the pointer elsewhere
- **THEN** the agent.exe row shows the selected background colour

#### Scenario: Unselecting restores the default
- **WHEN** a selected row is unselected and the pointer is not over it
- **THEN** its background returns to the default row background

### Requirement: Hovered selected row changes colour
When the pointer is over a selected row, the component SHALL show a background colour different from both the selected colour and the hovered-unselected colour, so hover feedback stays visible on selected rows.

#### Scenario: Hover a selected row
- **WHEN** agent.exe is selected and the pointer moves over it
- **THEN** its background differs from the selected colour shown when the pointer is elsewhere and from the hovered-unselected colour

### Requirement: Unselectable rows show hover colour without a pointer cursor
Rows whose file is not available SHALL show the same hovered background colour as other unselected rows, and SHALL NOT show a pointer cursor because clicking them does nothing.

#### Scenario: Hover a scheduled row
- **WHEN** the pointer moves over the sync.exe row (status `scheduled`)
- **THEN** its background differs from the default row background and its cursor is not a pointer

### Requirement: Empty-state row shows no hover colour
The "No files" row shown for an empty list is not a file row and SHALL keep its default background and cursor when hovered.

#### Scenario: Hover the empty-state row
- **WHEN** the file list is empty and the pointer moves over the "No files" row
- **THEN** its background stays the default row background and its cursor is not a pointer

### Requirement: Row colours preserve contrast in every theme
In the `light`, `dark` and `high-contrast` themes, each row background (hovered, selected, and hovered while selected) SHALL keep text, muted text and link-coloured content at 7:1 contrast or more. Checkbox boundaries, the focus indicator and the status dot SHALL stay at 3:1 or more.

#### Scenario: Text on a hovered selected row
- **WHEN** the contrast checks run for every theme
- **THEN** body text and muted text on the hovered-selected row background each reach at least 7:1

#### Scenario: High-contrast theme shows the states
- **WHEN** the `high-contrast` theme is active and a row is hovered, selected, or hovered while selected
- **THEN** the row's background differs from the default black row background

### Requirement: Row states visible in forced colors
In forced-colors mode, where the system replaces backgrounds, a hovered selectable row and a selected row SHALL each be marked with an outline in a system colour. The selected outline SHALL look different from the hover outline.

#### Scenario: Windows High Contrast
- **WHEN** forced colors are active, agent.exe is selected and the pointer is over libcore.dll
- **THEN** both rows have an outline, and the two outlines differ in style
