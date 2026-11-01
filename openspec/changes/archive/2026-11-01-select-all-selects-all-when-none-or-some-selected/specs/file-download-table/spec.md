# Spec Delta

## ADDED Requirements

### Requirement: Activating select-all selects every selectable file unless all are selected
When the user activates the select-all checkbox while no selectable file is selected, or while some but not all are, every selectable file SHALL become selected. Files already selected SHALL stay selected, and files that are not available SHALL stay unselected. Only when every selectable file is already selected SHALL activating it clear the selection. Pointer click and Space SHALL behave the same.

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
