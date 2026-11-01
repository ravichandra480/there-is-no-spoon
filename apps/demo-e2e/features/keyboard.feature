Feature: Keyboard-only use
  Everything in the demo works with the keyboard alone, focus is always visible (at least 2px with
  3:1 contrast), and focus never gets trapped. In WebKit "Tab" means Option+Tab, Safari's key for
  moving through every focusable element. Keyboard use of the file table itself is covered in
  file-table.feature.

  Scenario: The first Tab reaches the skip link, which moves focus to the main content
    Given the user opens the "/file-table" page
    When the user presses Tab
    Then the "Skip to main content" link is focused and in view
    And the focus indicator is visible
    When the user presses Enter
    Then the main content is focused
    And the address is "/file-table"
    When the user presses Tab
    Then focus is inside the main content
