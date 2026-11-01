Feature: File table
  The file table lists files; only available files can be chosen. Choosing files and asking to
  download them works with the keyboard alone, and the demo shows an alert with the path and device
  of each file that would be downloaded.

  Background:
    Given the user opens the "/file-table" page

  Scenario: Files that are not available cannot be chosen
    Then the "Select sync.exe" check box is disabled
    And the "Select agent.exe" check box is enabled
    And the "Download Selected" button is disabled
    And the selection count reads "None Selected"
    And the "Select all available files" check box is not checked

  Scenario: Unchecking the only chosen file leaves select all unchecked
    When the user presses Tab until the "Select agent.exe" check box is focused
    And the user presses Space
    Then the "Select all available files" check box is partly checked
    When the user presses Space
    Then the selection count reads "None Selected"
    And the "Select all available files" check box is not checked

  Scenario: Choosing files and downloading them with the keyboard only
    When the user presses Tab until the "Select agent.exe" check box is focused
    Then the focus indicator is visible
    And no disabled control was focused on the way
    When the user presses Space
    Then the selection count reads "Selected 1"
    And the "Select all available files" check box is partly checked
    When the user presses Tab until the "Select libcore.dll" check box is focused
    And the user presses Space
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked
    When the user presses Shift+Tab until the "Download Selected" button is focused
    Then the focus indicator is visible
    When the user presses Enter
    Then the "Close" button in the download alert is focused
    # Backslashes are doubled because "\" is the escape character in Gherkin tables.
    And the download alert lists these files:
      | device | path                                  |
      | Birch  | \\srv\\share2\\apps\\bin\\agent.exe   |
      | Cedar  | \\srv\\share1\\apps\\bin\\libcore.dll |
    When the user presses Escape
    Then the download alert is closed
    And the "Download Selected" button is focused

  Scenario: Rows change colour on hover and when chosen
    Then the "agent.exe" row changes colour when hovered
    And the "sync.exe" row changes colour when hovered
    When the user clicks the "Select agent.exe" check box
    Then the "agent.exe" row and the hovered "libcore.dll" row have different colours
    And the "agent.exe" row changes colour when hovered

  Scenario: Select all chooses every available file and clears them again
    When the user presses Tab until the "Select all available files" check box is focused
    And the user presses Space
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked
    When the user presses Space
    Then the selection count reads "None Selected"
    And the "Select all available files" check box is not checked

  Scenario: Unchecking one file after select all leaves select all partly checked
    When the user presses Tab until the "Select all available files" check box is focused
    And the user presses Space
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked
    When the user presses Tab until the "Select agent.exe" check box is focused
    And the user presses Space
    Then the selection count reads "Selected 1"
    And the "Select all available files" check box is partly checked
    When the user presses Shift+Tab until the "Select all available files" check box is focused
    And the user presses Space
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked

  Scenario: Clicking select all with nothing chosen chooses every available file
    When the user clicks the "Select all available files" check box
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked

  Scenario: Clicking select all with some files chosen chooses the rest
    When the user clicks the "Select agent.exe" check box
    Then the "Select all available files" check box is partly checked
    When the user clicks the "Select all available files" check box
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked
    And the "Select agent.exe" check box is checked

  Scenario: Clicking select all when every file is chosen clears them
    When the user clicks the "Select all available files" check box
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked
    When the user clicks the "Select all available files" check box
    Then the selection count reads "None Selected"
    And the "Select all available files" check box is not checked
    And the "Download Selected" button is disabled

  Scenario: Clicking select all after choosing every file one by one clears them
    When the user clicks the "Select agent.exe" check box
    And the user clicks the "Select libcore.dll" check box
    Then the "Select all available files" check box is checked
    When the user clicks the "Select all available files" check box
    Then the selection count reads "None Selected"
    And the "Select all available files" check box is not checked
    And the "Select agent.exe" check box is not checked

  Scenario: Select all then download lists only the available files
    When the user presses Tab until the "Select all available files" check box is focused
    And the user presses Space
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked
    When the user presses Tab
    Then the "Download Selected" button is focused
    When the user presses Enter
    Then the download alert lists these files:
      | device | path                                  |
      | Birch  | \\srv\\share2\\apps\\bin\\agent.exe   |
      | Cedar  | \\srv\\share1\\apps\\bin\\libcore.dll |

  Scenario: Choosing one file and downloading lists its path and device
    When the user presses Tab until the "Select libcore.dll" check box is focused
    And the user presses Space
    Then the selection count reads "Selected 1"
    When the user presses Shift+Tab until the "Download Selected" button is focused
    And the user presses Enter
    Then the "Close" button in the download alert is focused
    And the download alert lists these files:
      | device | path                                  |
      | Cedar  | \\srv\\share1\\apps\\bin\\libcore.dll |
    When the user presses Enter
    Then the download alert is closed
    And the "Download Selected" button is focused

  Scenario: On a narrow screen the download alert shows every path in full
    When the viewport is 320 by 800 CSS px
    And the user presses Tab until the "Select all available files" check box is focused
    And the user presses Space
    And the user presses Tab
    Then the "Download Selected" button is focused
    When the user presses Enter
    Then every path in the download alert is fully visible without horizontal page scroll

  Scenario: On a narrow screen the table is in a labelled region that keyboard users can reach
    When the viewport is 320 by 800 CSS px
    And the user presses Tab until the "Files ready to download" table region is focused
    Then the focus indicator is visible

  # Playwright's WebKit build does not scroll overflow elements with arrow keys (not even in plain
  # light DOM, unlike Safari), so the scrolling itself is checked in Chromium.
  @chromium-only
  Scenario: On a narrow screen the table scrolls sideways with the arrow keys
    When the viewport is 320 by 800 CSS px
    And the user presses Tab until the "Files ready to download" table region is focused
    And the user presses ArrowRight 10 times
    Then the "Files ready to download" table region has scrolled sideways

  Scenario: Enter checks and unchecks the focused check box
    When the user presses Tab until the "Select agent.exe" check box is focused
    And the user presses Enter
    Then the selection count reads "Selected 1"
    And the "Select agent.exe" check box is checked
    When the user presses Enter
    Then the selection count reads "None Selected"
    And the "Select agent.exe" check box is not checked
    When the user presses Tab until the "Select all available files" check box is focused
    And the user presses Enter
    Then the selection count reads "Selected 2"
    And the "Select all available files" check box is checked
