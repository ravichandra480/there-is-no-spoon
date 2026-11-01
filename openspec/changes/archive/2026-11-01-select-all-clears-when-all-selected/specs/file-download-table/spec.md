# Spec Delta

## ADDED Requirements

### Requirement: Activating select-all clears the selection when every selectable file is selected
When at least one file is selectable and every selectable file is selected, however that came about, activating the select-all checkbox SHALL unselect every file. Afterwards select-all SHALL be unchecked and not indeterminate, the toolbar SHALL read "None Selected", and "Download Selected" SHALL be disabled. Pointer click and Space SHALL behave the same. Files that are not available do not count toward "every".

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
