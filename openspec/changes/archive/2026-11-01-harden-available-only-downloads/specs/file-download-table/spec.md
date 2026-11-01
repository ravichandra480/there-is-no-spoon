# Spec Delta

## MODIFIED Requirements

### Requirement: Status display
The component SHALL display each file's status as capitalized text (for example "Scheduled", "Available"). Known statuses (`available`, `scheduled`) SHALL be displayed with their canonical label regardless of the case or surrounding whitespace they were given in; other statuses SHALL be displayed trimmed with their first letter capitalized. Files that are available (see "Only available files are selectable") SHALL additionally show a green indicator dot before the text; the dot SHALL be decorative and SHALL meet 3:1 contrast against the row background in every theme.

#### Scenario: Available file
- **WHEN** a row's status is `available`
- **THEN** the row shows a green dot followed by the text "Available", and the dot is hidden from assistive technology

#### Scenario: Scheduled file
- **WHEN** a row's status is `scheduled`
- **THEN** the row shows the text "Scheduled" with no dot

#### Scenario: Unknown status
- **WHEN** a row's status is a value other than `available` or `scheduled`
- **THEN** the status text is shown capitalized and the row is treated as not available

#### Scenario: Known status in another case
- **WHEN** a row's status is `AVAILABLE` or ` Scheduled `
- **THEN** the row shows "Available" (with the dot) or "Scheduled" (without it) respectively

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

## ADDED Requirements

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
