# Program Design: Mobile editor UX (sticky actions, scroll containment, fuzzy search)

## Constraint that shapes this whole gate

`vitest.config.ts` sets `environment: 'node'`. There is no jsdom, and
`src/test/setup.ts` says in a comment that pulling jsdom in "would be a heavier
dependency than the tests justify". So there are **no DOM tests and no component
tests in this repo, and this feature will not add any.**

Consequence: every behaviour worth proving must live in a pure function under
`src/utils/`. UI verification is manual — rendered in a real browser at 390x844,
screenshotted, and checked against the approved mockups. This confirms the Gate 2
decision to extract `trackSearch.ts` rather than leave the logic in the pages.

Baseline before any change: **4 test files, 31 tests, all passing.**

## Files

| File | Why it lives there |
|---|---|
| `src/types/track.ts` | **new.** `TrackRow`, shared by two pages and two components. *One file beyond the Gate 2 list — see deviation note below.* |
| `src/utils/trackSearch.ts` | **new.** `toTrackRows`, `rankMatches`, `fuzzyIndices`, and the four pure reorder helpers. Node-testable, no React, no DOM. |
| `src/utils/trackSearch.test.ts` | **new.** The test plan below. |
| `src/components/SelectionActionBar.tsx` | **new.** The fixed bar. One component so the two pages cannot drift apart visually. |
| `src/components/SortableTrackItem.tsx` | changed: takes a `TrackRow`, drops the `item.item!` non-null assertion, gains `touch-action` and drag-time text suppression. |
| `src/components/LikedTrackItem.tsx` | changed: takes a `TrackRow`. Same shape, no drag handle. |
| `src/pages/Editor.tsx` | changed: page shell + inner scroll container, `selectedKeys`, search state, action bar, `<DragOverlay>`, all reorder logic delegated to `trackSearch`. |
| `src/pages/LikedSongs.tsx` | changed: same shell, same search, same action bar, minus reordering and drag. |
| `src/index.css` | changed: scroll, overscroll and touch-action rules; remove the global `scroll-behavior: smooth`. |

**Deviation from Gate 2, flagged for approval:** Gate 2 listed two new files; this
adds `src/types/track.ts` as a third. `TrackRow` has to be imported by four
callers, and putting a UI model type inside `src/utils/trackSearch.ts` would make
every component import the search module to get a type.

**No new component for the search input.** It is a controlled `<input>` with no
logic; two call sites do not justify a file, and Gate 2 did not list one.

## Types & signatures

```ts
// ---------- src/types/track.ts ----------
import type { Track } from './spotify'

// One row per song. `key` is stable across filtering AND reordering, which is
// what lets the selection survive both. `track` is already unwrapped and
// non-null, so no consumer needs an assertion.
export interface TrackRow {
  key: string
  track: Track
}
```

```ts
// ---------- src/utils/trackSearch.ts ----------
import type { Track, PlaylistItem, SavedTrack } from '../types/spotify'
import type { TrackRow } from '../types/track'

// How a row matched, best first. The order of this union IS the ranking.
export type MatchKind =
  | 'exact-title'
  | 'title-prefix'
  | 'artist-prefix'
  | 'title-contains'
  | 'artist-contains'
  | 'fuzzy-title'
  | 'fuzzy-artist'

export interface Match {
  row: TrackRow
  kind: MatchKind
  // Lower sorts first. Ties break on title length so "Midnight" outranks
  // "Midnight City" for the query "mid".
  score: number
  // Indices into row.track.name, for highlighting. Empty when the artist matched.
  titleHits: number[]
  // Indices into the joined artist string. Empty when the title matched.
  artistHits: number[]
}

// Drops null-payload entries and assigns keys. The original index is part of the
// key so the same song appearing twice stays distinguishable.
export function toTrackRows<T>(
  items: readonly T[],
  getTrack: (item: T) => Track | null
): TrackRow[]

// Case- and diacritic-insensitive subsequence match. Returns the matched
// indices, or null. Enforces a density gate: the matched span must fit within
// QUERY_SPAN_RATIO is named FUZZY_SPAN_RATIO in the implementation. Enforces a
// density gate: the matched span must fit within that x needle.length
// characters, so "mid" cannot reach across "Vampire Weekend".
export function fuzzyIndices(
  haystack: string,
  needle: string
): number[] | null

// Ranked filter. An empty or whitespace-only query returns every row in its
// original order (so clearing the box restores the full list).
export function rankMatches(
  rows: readonly TrackRow[],
  query: string
): Match[]

// The artist's display string, e.g. "A, B" — the same join the rows render.
export function artistName(track: Track): string
```

Reorder helpers. All four take the current rows plus the selection, return a new
array, never mutate, and are no-ops returning the input unchanged when the
selection is empty:

```ts
// Moves the selected block to the front, preserving its internal order and the
// relative order of everything else.
export function moveSelectedToTop(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>
): TrackRow[]

// Same, to the end.
export function moveSelectedToBottom(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>
): TrackRow[]

// Drops the selected rows; the rest keep their order.
export function removeSelected(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>
): TrackRow[]

// Single-row drag. Moves `activeKey` to the index `overKey` currently occupies.
// Selection is NOT touched — the caller decides whether to keep it. DECIDED:
// the caller keeps it, so a multi-select can be lined up and dragged, then
// adjusted and dragged again.
export function reorderRows(
  rows: readonly TrackRow[],
  activeKey: string,
  overKey: string
): TrackRow[]
```

```tsx
// ---------- src/components/SelectionActionBar.tsx ----------
interface SelectionActionBarProps {
  count: number
  onMoveToTop: () => void
  onMoveToBottom: () => void
  onRemove: () => void
  onClear: () => void
  // Liked Songs is purple, the editor is green. One prop, not two components.
  accent?: 'green' | 'purple'
}

// Renders null when count === 0. The page owns the fixed positioning; this
// component owns only the bar's contents and its internal layout, so it cannot
// fight the page over `position`.
export function SelectionActionBar(props: SelectionActionBarProps): JSX.Element | null
```

Layout rule the bar must satisfy, straight from the mockup measurements: at 390px
the three action buttons are `flex: 1 1 0` with `min-width: 0`, and Clear is a
fixed-width icon. Measured — no wrap, no overflow, 40px tall, safe-area padded.

## Call stack

```
Editor.tsx
  loadPlaylist()
    └─ getPlaylist(id)                        [unchanged, pages all items]
       └─ toTrackRows(data.items.items, i => i.item)   [new]
          └─ setRows(...)  ─► hasChanges = uris differ from originalRows

  tap row
    └─ toggleSelect(row.key) ─► setSelectedKeys(prev => symmetric difference)

  type in search
    └─ setQuery(q) ─► displayRows = rankMatches(rows, q)      [pure, per render]
                    ─► SearchField <input value={query} onChange={setQuery}>

  tap an action
    └─ moveSelectedToTop(rows, selectedKeys)     [pure] ─► setRows ─► setSelectedKeys(new Set())
    └─ moveSelectedToBottom / removeSelected      [pure] ─► same

  drag a row
    └─ DndContext onDragStart ─► setActiveKey
    └─ DndContext onDragEnd   ─► reorderRows(rows, activeKey, overKey)   [pure]
                                └─ <DragOverlay>{activeRow && <SortableTrackItem …/>}</DragOverlay>
    └─ KeyboardSensor path identical, via the same reorderRows

  tap Save
    └─ replacePlaylistItems(playlistId, rows.map(r => r.track.uri))   [unchanged service]
```

`LikedSongs.tsx` mirrors this minus the drag, the overlay, and the two move
buttons; it calls `toTrackRows(data.items, i => i.track)` and `removeSelected`.

## Test plan

Written before any of them exist. `src/utils/trackSearch.test.ts`, vitest, node
environment, matching the existing `describe`/`it` style.

**`toTrackRows`**
1. `drops entries whose payload is null` — a `PlaylistItem` with `item: null`
   is absent from the result.
2. `gives duplicate songs distinct keys` — two entries with the same
   `track.id` produce two rows with different `key`s and both survive.
3. `gives distinct songs distinct keys` and `preserves input order`.
4. `exposes the artist list and added_at on the row` — pins the unwrapping.

**`fuzzyIndices`**
5. `matches a subsequence and returns the matched indices` — `("midnight city",
   "mdc")` returns `[0, 2, 9]`.
6. `rejects a match spread too far apart` — `("vampire weekend", "mid")` returns
   null. **This is the test that fails if the density gate is ever removed.**
7. `rejects a needle that is not a subsequence at all` — `("midnight", "mdc")`
   returns null.
8. `is case-insensitive` — `("Midnight City", "mid")` behaves as `("midnight
   city", "mid")`.
9. `ignores spaces in the needle` — `("midnight city", "m c")` matches.
10. `rejects a one-character needle` — a single letter never fuzzy-matches.
11. `treats an empty needle as no match` — returns null, never an empty array,
    so callers cannot render a highlight run against a blank query.

**`rankMatches`**
12. `returns every row in original order for an empty query` — including a
    whitespace-only query.
13. `ranks an exact title match first`.
14. `prefers a title prefix over an artist contains` — the `MatchKind` order
    holds even when a song matches two ways.
15. `prefers a shorter title within the same kind` — for `mid`, "Midnight"
    outranks "Midnight City".
16. `finds a song by artist` — `foals` finds the Foals track.
17. `excludes non-matches` — `zzz` returns `[]`.
18. `puts title hits on the title and never on the artist` — for a title-only
    match, `artistHits` is `[]`. **Regression test for the mockup bug where a
    title's hit positions were replayed against the artist string.**
19. `returns hit indices that are all within the field they belong to` — every
    index in `titleHits` is `< row.track.name.length`, and every index in
    `artistHits` is `< artistName(row.track).length`. Guards the same bug class
    generically.
20. `does not mutate the input array`.

**Reorder helpers** (each of `moveSelectedToTop`, `moveSelectedToBottom`,
`removeSelected`, plus `reorderRows`)
21. `is a no-op for an empty selection` — returns the input array unchanged
    (identity, not just equality).
22. `keeps the moved block in its original relative order` — selecting rows
    3 and 1 and moving them to the top yields 1 then 3, not 3 then 1.
23. `keeps the unmoved rows in their original relative order`.
24. `moves only the selected rows` — every returned key is either selected or
    was already unselected-and-present; nothing is lost or duplicated.
25. `ignores keys that are not in the list` — a stale key in the set is not a
    crash and not a phantom row.
26. `removeSelected leaves the rest untouched` — lengths and order.
27. `reorderRows moves the active row to the over row's index` and
    `reorderRows is a no-op when active and over are the same key`.
28. `no helper mutates its input` — deep-equal the input before and after.

**Cross-cutting, in the page files (no test — manual, per the node-env constraint)**
29. Select from a filtered list, clear the filter, confirm the same songs are
    still selected. **This is the reason selection moved off indices.**
30. Scroll a filtered list to the bottom, confirm the last row is not hidden
    behind the fixed bar.

## Least confident decisions

Decisions 3 and 5 below were put to the user and, with no answer, taken as
recommended. They are recorded here as settled, not open, and either is a
one-line change.

1. **`query.length * 4` as the density ratio.** A magic constant tuned against
   the 16 fake songs in the mockup. It is a real tradeoff curve: tighten it and
   acronym queries like `mdc` stop finding "Midnight City"; loosen it and `mid`
   starts matching "Vampire Weekend" again. I want slice 3 to test it against a
   real 300-track playlist before we ship the number. If the curve is ugly in
   practice, the honest fix is a real scoring function (consecutive-run and
   word-start bonuses, fzf-style), not a bigger constant.
2. **Unwrapping to `TrackRow { track }`.** Drops the `PlaylistItem` /
   `SavedTrack` wrapper and changes the `replacePlaylistItems` call site from
   `t.item!.uri` to `r.track.uri`. It removes a non-null assertion and unifies
   two pages, but it is a wider change than "add a search box".
3. **`addedAt` on `TrackRow`.** **SETTLED 2026-10-02, then REVERSED by the user:
   cut.** It had no reader, so carrying it was cost without benefit. The API
   types in `src/types/spotify.ts` still model `added_at` where it belongs — it
   is simply not copied onto the row, and `toTrackRows` takes one accessor
   instead of two.
4. **Returning `Match[]` with hit positions rather than `TrackRow[]`.** It puts
   highlighting in the model layer, where it is testable, at the cost of a richer
   return type. The alternative — return rows, recompute hits in the component —
   moves the exact logic that has already produced one bug back under test
   reach.
5. **`reorderRows` does not clear the selection, changing today's behaviour.**
   `Editor.tsx` currently clears the selection after every drag. Keeping it means
   a multi-select drag can be repeated, but it also means the selected rows can
   drift from what the user sees mid-drag. **SETTLED 2026-10-02 and CONFIRMED by
   the user: the selection survives the drag.** `Editor.tsx` no longer clears the
   selection in `handleDragEnd`; the helper never touched the selection either
   way, so this is a change to the caller only.
6. **The inner scroll container (Gate 2 Option 1) is approved but unproven in
   the hand.** The address-bar trade is real, and only slice 5 will show whether
   it feels right on a real phone.
