# Spec Delta

## ADDED Requirements

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
