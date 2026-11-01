# Proposal

## Why

Statuses other than `available` and `scheduled` are shown exactly as the host sent them, apart from trimming and an upper-cased first letter. Raw backend values such as `IN_PROGRESS`, `pending-review` or `failed   verification` therefore reach users as "IN_PROGRESS", "Pending-review" and "Failed   verification", which looks inconsistent next to the canonical "Available" / "Scheduled" labels.

## What Changes

- Unknown statuses are displayed in sentence case: lower-cased, with `_` and `-` replaced by spaces, runs of whitespace collapsed to one space, trimmed, and the first letter capitalized (`IN_PROGRESS` → "In progress", `pending-review` → "Pending review").
- Canonical labels for `available` and `scheduled`, the availability rule (`isDownloadable`), and the handling of empty / missing / non-string statuses are unchanged.
- Only the displayed label changes; the `files` objects, `selected`, and `tins-download` payloads keep the original status string.
- Hosts that relied on an unknown status keeping its inner casing (e.g. an acronym like `QA hold` → now "Qa hold") will see different text. Not marked breaking: it is display-only and the API is unchanged.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `file-download-table`: "Canonical status labels" changes how statuses other than the known ones are formatted for display.

## Impact

- `libs/ui/components/src/file-table/file-table.ts` — `statusLabel` (and the `FileStatus` doc comment).
- `libs/ui/components/src/file-table/file-table.spec.ts` — unit tests for the new formatting.
- `libs/ui/components/README.md` — the `files` description of how statuses are shown.
- No API, token, styling, or accessibility-semantics changes; the demo's sample data only uses known statuses.
