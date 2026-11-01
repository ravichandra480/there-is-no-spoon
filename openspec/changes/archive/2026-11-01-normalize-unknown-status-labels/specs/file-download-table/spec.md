# Spec Delta

## MODIFIED Requirements

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
