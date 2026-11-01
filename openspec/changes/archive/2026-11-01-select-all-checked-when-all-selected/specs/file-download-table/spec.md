# Spec Delta

## ADDED Requirements

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
