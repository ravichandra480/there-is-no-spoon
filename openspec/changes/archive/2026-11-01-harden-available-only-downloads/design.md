# Design

## Context

`file-table.ts` holds the availability rule in one private arrow function: `isSelectable = (f) => f.status === 'available'`. Every path goes through it: rendering, `willUpdate`'s stale-selection pruning, select-all, `#toggle`, and the `selected` getter used by `#onDownload`. The `selected` getter recomputes from `this.files` on every read, so a download fired before re-render already excludes files whose status just changed. Nothing tests this yet. `statusLabel` only uppercases the first character. The demo's `onDownload` copies `detail.files` straight into the dialog. See proposal.md (Why) for the motivation.

## Goals / Non-Goals

**Goals:**
- Keep one definition of "available", shared by the component and hosts.
- Never throw on malformed `status` values (`files` can come from a JSON attribute or an untyped API).

**Non-Goals:**
- Making the set of downloadable statuses configurable (for example, a `downloadable-statuses` attribute). It can be added later on top of the same predicate if needed.
- Changing the `FileStatus` type or the `tins-download` / `tins-selection-change` payload shapes.

## Decisions

1. **Normalize inside a public predicate.** Add `normalizeStatus(s: unknown): string` (`typeof s === 'string' ? s.trim().toLowerCase() : ''`) and `export function isDownloadable(file: Pick<FileEntry, 'status'>): boolean`. Both are module-level in `file-table.ts`. The private `isSelectable` is replaced by `isDownloadable` everywhere, so the component and hosts cannot drift apart. `index.ts` re-exports it. Because it is a value export, it also appears in the Custom Elements Manifest and README. *Alternative:* a static method on `TinsFileTable`. Rejected: hosts would have to import the class (which runs `define`) just to call a pure function, and a free function tree-shakes better.

2. **Do not mutate input data.** Normalization is used only for comparison and labels. The `FileEntry` objects in `tins-download` / `selected` are the host's originals, unchanged, so a host that keys on its own status values keeps working.

3. **Canonical labels via a small map.** `statusLabel` looks up the normalized value in `{ available: 'Available', scheduled: 'Scheduled' }`. Otherwise it shows the trimmed original with its first character uppercased, as today, so "In review" keeps its casing. Non-strings render an empty label.

4. **Selection keys stay `device + path`.** Status is not part of the key, so a case-only status change (`available` → `Available`) keeps the selection without extra code. A test pins this down.

5. **Demo guard filters and stops early.** `onDownload` runs `detail.files.filter(isDownloadable)`. If the result is empty it returns without calling `showModal()`. Otherwise it sets `requested` and opens the dialog. The demo test dispatches a hand-built `tins-download` event, because the real component can no longer produce an unavailable file.

## Risks / Trade-offs

- [Some existing consumer relies on `"Available"` being *non*-downloadable] → Unlikely, and it contradicts the spec's intent. It will be called out in the README and the changeset or commit as a behavior fix.
- [Status strings with internal variation such as `"avail able"` or a localized `"verfügbar"` still don't match] → This is intentional. Only trimming and case are forgiven. Broader mapping belongs in the host's data layer.
- [New public export expands the API surface] → It is small, pure and documented. `readme.node.spec.ts` enforces the docs for manifest members. If the manifest does not list free functions, the README entry is still added by hand.
