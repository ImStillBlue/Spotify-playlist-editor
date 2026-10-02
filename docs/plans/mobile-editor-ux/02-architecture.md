# Architecture: Mobile editor UX (sticky actions, scroll containment, fuzzy search)

## Fit

Four existing files change, two are added. No new dependencies, no backend, no
build changes.

| File | Change |
|---|---|
| `src/index.css` | scroll/overscroll/touch-action rules; drop the global `scroll-behavior: smooth` |
| `src/pages/Editor.tsx` | list becomes its own scroll container; selection keyed by stable row key; search field; action bar extracted; `<DragOverlay>` added |
| `src/pages/LikedSongs.tsx` | same treatment minus reordering and drag |
| `src/components/SortableTrackItem.tsx` | row becomes a stable-keyed row; `touch-action` and no text selection while dragging |
| `src/components/SelectionActionBar.tsx` | **new** — the opaque fixed action bar, shared by both pages |
| `src/utils/trackSearch.ts` | **new** — pure ranked fuzzy matcher + pure reorder helpers |

Untouched: `services/`, `types/spotify.ts`, `config/`, routing, auth.

The two new modules exist so the logic is testable without a DOM. Today
`moveToTop`, `moveToBottom` and `removeSelected` are inline closures in
`Editor.tsx` operating on array indices; they are the behaviour we most need to
prove, and they are currently untestable.

## Endpoints

**None.** No new routes, no new Spotify calls, no server.

- `getPlaylist` already pages **all** items (`fetchAllPlaylistItems` loops until
  exhausted), so a 300-track playlist is fully in memory and search is a local
  array pass. No search endpoint is needed and none exists in the Spotify API.
- `replacePlaylistItems` and `removeSavedTracks` are called exactly as they are
  today, with the same batching.

## Data

No tables, no collections, no persistence, **no new localStorage keys**. The
search query is ephemeral component state and is deliberately not persisted —
a stale query on return would hide songs the user expects to see.

### Row model (the one real data decision)

Selection is currently `Set<number>` of **array indices**, and the render order
is the array order. That breaks the moment a filter exists between the model and
the screen: a filtered list showing 4 of 128 rows makes every index ambiguous,
and any reorder silently re-points the selection at different songs.

So the row model gains a stable key:

```ts
// one row per song, stable across filtering AND reordering
interface TrackRow {
  key: string        // `${track.id}:${originalIndex}` — unique even for duplicates
  item: PlaylistItem // unchanged, still carries the Spotify payload
}
```

- `selectedKeys: Set<string>` replaces `selectedIndices: Set<number>`.
- A reorder permutes `rows`; a filter derives a *display* array from `rows`.
  Neither touches the selection, so selecting from a filtered list and then
  clearing the filter keeps the right songs selected.
- The key embeds the original index because a playlist may legitimately contain
  the same song twice and the Spotify payloads are otherwise identical.

### Queries

Only one, in memory over the rows already held:

```
rankMatches(rows: TrackRow[], query: string): TrackRow[]
```

## Flow

Main path — select, filter, act:

```
Editor.tsx
  ├─ tap row checkbox ──────────────► toggleSelect(key) ─► setSelectedKeys
  │                                     └─ selection drives SelectionActionBar visibility
  ├─ type in search ────────────────► setQuery ─► rankMatches(rows, query)
  │                                     └─ displayRows = ranked slice; rows themselves untouched
  ├─ tap Top / Bottom / Remove ────► moveSelectedToTop / moveSelectedToBottom /
  │                                    removeSelected(rows, keys)   [pure, trackSearch.ts]
  │                                     └─ new rows; displayRows re-derived
  └─ tap Save ─────────────────────► replacePlaylistItems(playlistId, uris)
```

Drag path (Editor only):

```
DndContext onDragStart ─► setActiveRow
DndContext onDragEnd   ─► reorderRows(rows, activeKey, overKey)   [pure]
                         └─ <DragOverlay> renders the lifted row
```

Search never triggers a network call. Save is the only writer.

## Scroll containment — the decision that needs your sign-off

The "grab the background and shove the page" bug has two candidate fixes.

**Option 1 (recommended) — make the list its own scroll container.**
`<main>` gets `overflow-y: auto; overscroll-behavior: none; height: 100dvh`
inside a `display: flex; flex-direction: column` page shell, and the window
stops scrolling entirely.

- `overscroll-behavior` and `touch-action` become scoped to the list, so no
  gesture that starts outside the list can scroll anything.
- "There is no background to grab" becomes structural, not a CSS patch.
- A sticky header and a fixed dock stop fighting the window scroller.
- **Cost:** the browser's address bar no longer auto-hides on scroll, so the
  usable viewport is ~10% shorter. On a phone, in an app-like tool, I think that
  is the right trade — but it is a real change in feel.

**Option 2 — keep window scrolling.** Add `overscroll-behavior-y: none` on
`html`, `touch-action: pan-y` on rows, and a `<DragOverlay>`.

- Smaller diff, browser chrome still auto-hides.
- **Cost:** the background still exists and is still grabbable; this patches the
  symptom rather than removing the surface. It also leaves the fixed dock and
  the dynamic mobile viewport fighting each other.

I recommend Option 1.

## External

None. No new env vars, no webhooks, no third-party services. The Spotify Web
API surface used is exactly what the app uses today.
