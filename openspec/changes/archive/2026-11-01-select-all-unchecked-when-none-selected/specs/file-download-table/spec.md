# Spec Delta

## ADDED Requirements

### Requirement: Select-all is unchecked when nothing is selected
Whenever no file is selected, however the selection became empty, the select-all checkbox SHALL be neither checked nor indeterminate. It SHALL be visually unchecked (no check mark, no dash) and SHALL be exposed to assistive technology as not checked, not as mixed.

#### Scenario: Initial render
- **WHEN** the component first renders the sample files with nothing selected
- **THEN** select-all is unchecked, not indeterminate, and the toolbar reads "None selected"

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
- **THEN** select-all is unchecked and not indeterminate, and the toolbar reads "None selected"

#### Scenario: Disabled with nothing selected
- **WHEN** select-all was checked and the host replaces `files` with a list that has no available file
- **THEN** select-all is disabled, unchecked and not indeterminate
