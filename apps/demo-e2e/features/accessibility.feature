Feature: Accessibility scans
  Every demo page passes an automated WCAG 2.2 A/AA/AAA + best-practice scan (axe-core) in every
  shipped theme, including states that only appear after user input. Each scan attaches its report
  as "axe:<path>:<theme>". WebKit scans the light theme; Chromium scans all themes.

  @per-route
  Scenario Outline: <path> has no accessibility violations in the <theme> theme
    Given the user opens the "<path>" page in the "<theme>" theme
    Then the page has no accessibility violations

    Examples: Light theme
      | path        | theme |
      | /file-table | light |

    @chromium-only
    Examples: Dark and high-contrast themes
      | path        | theme         |
      | /file-table | dark          |
      | /file-table | high-contrast |

  Scenario: The theme menu offers exactly the scanned themes
    Given the user opens the "/file-table" page
    Then the theme menu offers every scanned theme and "match my device"
