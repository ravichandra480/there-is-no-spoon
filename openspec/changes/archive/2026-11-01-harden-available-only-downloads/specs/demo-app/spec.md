# Spec Delta

## ADDED Requirements

### Requirement: Showcase download lists only available files
When the file table showcase receives a `tins-download` event, the demo SHALL re-check each file with the library's shared availability predicate. Its download dialog SHALL list only the files that pass, showing each one's device and path. If no file passes, the demo SHALL NOT open the dialog.

#### Scenario: Select all then download
- **WHEN** a user selects all files on `/file-table` and activates "Download Selected"
- **THEN** the dialog lists exactly agent.exe (Birch) and libcore.dll (Cedar) and no scheduled file

#### Scenario: Event carrying an unavailable file
- **WHEN** the showcase receives a `tins-download` event whose detail includes sync.exe (status `scheduled`) and agent.exe
- **THEN** the dialog lists only agent.exe

#### Scenario: Event with no available files
- **WHEN** the showcase receives a `tins-download` event whose files are all not available
- **THEN** no dialog opens
