## What changed

<!-- What and why. Link the OpenSpec change if there is one (openspec/changes/<name>). -->

## Checks

CI runs `nx affected -t lint test build e2e`, `npm run verify` and the A11Y.md review check.
Merge only when all of them pass.

## Accessibility (WCAG 2.2 AAA)

Complete this section if the PR changes a component, a demo page, tokens or global styles.
Otherwise write "No UI change" and delete the checklist.

Updated review records (one per changed component):

<!-- e.g. libs/ui/components/src/button/A11Y.md -->

- [ ] Automated checks pass: component unit tests (axe AAA, target size, focus) and the demo e2e scans in every theme
- [ ] Tested with **NVDA + Firefox**: name, role, state and errors are announced; results recorded in `A11Y.md`
- [ ] Tested with **VoiceOver + Safari**: same checks; results recorded in `A11Y.md`
- [ ] Keyboard only: every action works, focus order is logical, focus is always visible, no traps
- [ ] 2.4.9 Link purpose: every link makes sense on its own
- [ ] 2.4.10 Section headings: content is organised with headings
- [ ] 3.1.3 / 3.1.6 Unusual words and pronunciation: none, or explained
- [ ] 3.1.5 Reading level: text is plain (lower-secondary level) or a simpler version is given
- [ ] Windows High Contrast / forced colors checked (boundaries, focus, selected states visible)
- [ ] Not-applicable criteria are listed in `A11Y.md` with a reason
- [ ] No axe rule disabled except through `excludeRule({ rule, selector, reason, issue })`

See `ACCESSIBILITY.md` in the repository for how to do each check.
