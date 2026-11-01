# Design

## Context

`statusLabel` in `libs/ui/components/src/file-table/file-table.ts` maps the normalized status through `KNOWN_LABELS` and otherwise returns the trimmed string with its first character upper-cased. It is used only to render the Status cell; availability is decided separately by `isDownloadable` / `normalizeStatus`.

## Goals / Non-Goals

**Goals:** consistent sentence-case labels for unknown statuses; no change to known labels, availability, events, or the data hosts pass in.

**Non-Goals:** host-supplied label maps or i18n; title case; preserving acronyms; changing which statuses are downloadable (`in-progress` etc. stay not available).

## Decisions

- **Pure label function, rendering only.** Keep the change inside `statusLabel`: `status.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()`, then upper-case the first character. `normalizeStatus` is not reused for the lookup key change — the known-label lookup still uses the trimmed, lower-cased raw value, so `AVAILABLE` and ` Scheduled ` behave as today, and `in_progress` is not accidentally matched to anything.
- **Locale-independent casing.** Use `toLowerCase()` / `toUpperCase()` (not the `Locale` variants) so output does not vary with the user's locale (e.g. Turkish dotted i). Accepted trade-off: language-specific casing rules are not applied.
- **First letter, not first code unit.** Capitalize the first code point (`[...s][0]` or `String.fromCodePoint`/`codePointAt`) so a status starting with an astral character is not split. Strings starting with a non-letter (e.g. `2fa_pending` → "2fa pending") are left as is.
- **Hyphens become spaces.** Chosen by the requester; accepted trade-off that a deliberately hyphenated word (`re-scan`) displays as "Re scan".

## Risks / Trade-offs

- Acronyms in unknown statuses lose their casing ("QA hold" → "Qa hold"). Acceptable for now; a host label map would be the follow-up if needed.
- Visible text for unknown statuses changes for existing hosts; known statuses and sample data are unaffected.
