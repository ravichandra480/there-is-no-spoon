@chromium-only
Feature: Route coverage
  Every page of the demo has per-route scenarios (accessibility scans per theme, reflow, text
  spacing, zoom). These checks are browser independent, so they run once, in Chromium.

  Scenario: Per-route scenarios list exactly the routes in the route manifest
    Then every per-route scenario lists every route in the route manifest
    And no per-route scenario lists a path that is not in the route manifest

  Scenario: Every page linked in the app has an accessibility scan
    When the user follows every same-site link, starting from "/file-table"
    Then every page visited has a per-route accessibility scan
