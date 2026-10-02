# Slices: Mobile editor UX

Build order. One slice at a time; each ends in a working, demonstrable state and
gets checked off in `00-status.md` before the next begins.

Baseline before slice 1: `npx vitest run` → 4 files, 31 tests, passing.
`npx tsc -b` → clean. Nothing in `src/` has been touched yet.

---

## Slice 1 — Tracer bullet: the bar exists and stays put

Add `src/components/SelectionActionBar.tsx` rendering `null` at count 0, and
mount it in `Editor.tsx` in a `position: fixed` dock with a **hardcoded** count
and no-op handlers. No logic, no tests, no data changes.

**Proves:** the bar renders, sits at the bottom of the viewport, survives a
scroll, and its three buttons do not wrap or overflow at 390px.

**Do:** open the editor, select a song, scroll to row 100, screenshot. The bar is
still there and the labels are on one line. Measure the buttons' bounding boxes —
they must fit inside the viewport with no wrap, matching the mockup measurement
(86px wide, 36-40px tall, three equal buttons plus a fixed-width icon Clear).

---

## Slice 2 — Real selection: row keys and the three actions

Introduce `src/types/track.ts` and `src/utils/trackSearch.ts` with `toTrackRows`
plus `moveSelectedToTop`, `moveSelectedToBottom`, `removeSelected`. Convert
`Editor.tsx` from `selectedIndices: Set<number>` to `selectedKeys: Set<string>`,
and extend `SortableTrackItem` to take a `TrackRow`. Wire the bar to real
handlers.

**Proves:** the selection now survives a reorder, because it is keyed by
identity rather than position. Select songs 3 and 1, move them to the top, and
confirm they end up as 1 then 3 — the index-keyed version could not do this.

**Do:** `npx vitest run` — the reorder and `toTrackRows` tests from Gate 3 cases
1-4 and 21-28 pass. Then in the browser: select two songs in the middle of a
long list, scroll away, scroll back, hit Top, and confirm the right two songs
moved and the rest kept their order.

---

## Slice 3 — Search: `rankMatches` and the field

Add `fuzzyIndices`, `artistName` and `rankMatches`. Add the search `<input>` to
the editor header. Render the display array from `rankMatches(rows, query)`. Add
the full `trackSearch.test.ts` suite (Gate 3 cases 1-20).

**Proves:** ranked fuzzy search works and the density gate holds. This is also
the slice where the `query.length * 4` constant gets tested against a real
300-track playlist rather than 16 fake songs — if the tradeoff curve is ugly in
practice, replace the constant with a real scoring function here, not later.

**Do:** `npx vitest run` — all 20 search cases pass, including case 6
(`"vampire weekend"` must NOT match `"mid"`), which fails if the gate is removed.
Then in the browser, against a real playlist: `mid` returns the Midnight songs and
nothing absurd; `mdc` still finds Midnight City; `foals` finds the artist;
`zzz` returns the empty state. Record the real-playlist observations in the
journal — they are the evidence for the constant.

---

## Slice 4 — Selecting from a filtered list

Make the checkbox work on filtered rows, keyed by `row.key`. Clearing the query
restores the full list.

**Proves:** selection is independent of the filter — the reason selection moved
off array indices. Select three songs out of the filtered results, clear the
search box, and confirm those same three are still selected.

**Do:** browser check, and note it as manual check #29 from Gate 3. This is the
slice that would have been impossible on the old index-based model.

---

## Slice 5 — Scroll containment and drag

Convert the page to the inner scroll container: flex column shell, `main` with
`overflow-y: auto; overscroll-behavior: none`, window no longer scrolls. Add the
scroll/overscroll/touch-action rules to `index.css` and drop the global
`scroll-behavior: smooth`. Add `reorderRows` and a dnd-kit `<DragOverlay>` so
the dragged row lifts out of the list instead of transforming in place. Pad the
bottom of the list by the bar's height.

**Proves:** there is no grabbable background, a vertical swipe only scrolls the
list, and a drag no longer shoves the page. Also manual check #30 — the last row
is fully visible above the bar.

**Do:** browser at 390x844, and a real phone if you have one — this is the slice
that cashes in the approved address-bar trade, so it is the one most worth
feeling rather than just seeing. `npx tsc -b` clean, `npx vitest run` green
(case 27-28 for `reorderRows`). Confirm a drag reorders the list and that the
selection survives it (decision #5).

---

## Slice 6 — Liked Songs parity

Same shell, same search, same bar in `Editor`'s style but with the purple accent
and without the two move buttons. `toTrackRows(data.items, i => i.track)` and
`removeSelected`. Reuse `SelectionActionBar`; do not fork it.

**Proves:** the shared component really is shared. Remove the editor's bar and
the Liked Songs one should be a two-line change.

**Do:** browser check on `/liked`: search filters, selecting works, Remove
works, the bar is opaque and pinned.

---

## Slice 7 — Polish and full verification

Render the highlight runs from `Match.titleHits` / `artistHits` (drop the
now-redundant substring highlighting). Safe-area insets on the bar. Respect
`prefers-reduced-motion` for the bar's show/hide. Desktop check at 1280px.
Full run: `npx tsc -b`, `npx vitest run`, `npm run build`.

**Proves:** it is finished and nothing regressed.

**Do:** screenshot mobile and desktop, run the whole suite, run the build, and
walk the Gate 1 success metric by hand: move 3 selected songs from the middle of
a 100-track playlist to the top in under 8 seconds, and find a named song in a
300-track playlist in under 5.

---

## Not in scope

- No desktop-only layout redesign. The bar is bottom-anchored everywhere; a
  separate desktop treatment is a future feature.
- No persisting the search query.
- No new Spotify endpoints, env vars, or dependencies.
- No component or DOM tests — the repo runs vitest in a node environment with no
  jsdom, and adding one is a bigger decision than this feature.
