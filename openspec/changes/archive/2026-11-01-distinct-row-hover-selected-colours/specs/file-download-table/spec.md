# Spec Delta

## ADDED Requirements

### Requirement: Hovered selectable row changes colour
When the pointer is over a selectable, unselected row, the component SHALL show that row with a background colour different from the default row background. The colour SHALL return to the default when the pointer leaves.

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

### Requirement: Unselectable rows show no hover colour
Rows whose file is not available SHALL keep the default row background when hovered, and SHALL NOT show a pointer cursor.

#### Scenario: Hover a scheduled row
- **WHEN** the pointer moves over the sync.exe row (status `scheduled`)
- **THEN** its background stays the default row background

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
