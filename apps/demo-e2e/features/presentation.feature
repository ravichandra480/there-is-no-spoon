Feature: Adaptable presentation and user preferences
  Pages stay usable when the user narrows the window, zooms, enlarges text, overrides text spacing,
  asks for reduced motion, or uses forced colors (Windows High Contrast).

  @per-route
  Scenario Outline: <path> reflows at 320 CSS px without horizontal scrolling or clipped text
    Given the user opens the "<path>" page
    Then the page reflows at a width of 320 CSS px

    Examples:
      | path        |
      | /file-table |

  @per-route
  Scenario Outline: <path> has no clipped text with WCAG 1.4.12 text spacing
    Given the user opens the "<path>" page
    Then no text is clipped with increased text spacing

    Examples:
      | path        |
      | /file-table |

  @per-route
  Scenario Outline: <path> has no clipped text with WCAG 1.4.12 text spacing at 320 CSS px
    Given the user opens the "<path>" page
    When the viewport is 320 by 800 CSS px
    Then no text is clipped with increased text spacing

    Examples:
      | path        |
      | /file-table |

  @per-route
  Scenario Outline: <path> stays usable at 200% zoom
    A 1280px window at 200% zoom is 640 CSS px wide.

    Given the viewport is 640 by 400 CSS px
    And the user opens the "<path>" page
    Then the page has no layout problems

    Examples:
      | path        |
      | /file-table |

  @per-route
  Scenario Outline: <path> stays usable at 200% text size
    Given the user opens the "<path>" page
    When the root font size is doubled
    Then the page has no layout problems

    Examples:
      | path        |
      | /file-table |

  @reduced-motion
  Scenario: With reduced motion, no transitions or animations run when interacting
    Given the user opens the "/file-table" page
    When the user presses Tab until the "Select agent.exe" check box is focused
    And the user presses Space
    And the user hovers over the "Download Selected" button, moves away and hovers again
    Then no animations or transitions are running
    And buttons have no transition duration
