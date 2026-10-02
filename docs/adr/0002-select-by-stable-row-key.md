# 0002 — Selection is keyed by stable row identity, never array index

Date: 2026-10-02 · Status: Accepted

## Context

The editor used to track selection as `Set<number>` of array indices, with the
render order being the array order.

That is fine until anything sits between the model and the screen. Once a search
filter exists, the list shows 4 of 128 rows, every visible index is ambiguous,
and any reorder silently re-points the selection at different songs. Selecting
three songs out of a filtered view and then clearing the filter would have
selected the 1st, 2nd and 3rd songs of the full list instead.

## Decision

Every song is a `TrackRow` carrying a `key` that is stable across filtering *and*
reordering. Selection is `Set<string>` of those keys. The key embeds the
original array index — `${track.id}:${index}` — because a playlist may
legitimately contain the same song twice and the Spotify payloads are then
identical.

Filtering derives a display array and never mutates the rows. Reordering permutes
rows. Neither touches the selection.

`track.id` alone is *not* an acceptable key: it collides on duplicates.

## Consequences

- Selection survives reordering, filtering, and clearing the filter.
- Row identity must be preserved everywhere. Anything that rebuilds rows from
  scratch has to re-derive keys the same way or the selection silently empties.
- The row carries only what the app uses. `added_at` stays on the API types
  where it belongs, but is not copied onto the row.
