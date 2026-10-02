# Status: Mobile editor UX (sticky actions, scroll containment, fuzzy search)

Feature slug: `mobile-editor-ux` — **all four gates approved, all seven slices
built and verified.**

- Gate 1 — Product: APPROVED 2026-10-02
- Gate 2 — Architecture: APPROVED 2026-10-02
- Gate 3 — Program Design: APPROVED 2026-10-02 (defaulted, see journal)
- Gate 4 — Slice plan: APPROVED 2026-10-02

## Slices
- [x] Slice 1 — tracer bullet: fixed bar exists, stays put, does not wrap at 390px
- [x] Slice 2 — real selection: `TrackRow`, `selectedKeys`, the three actions
- [x] Slice 3 — search: `rankMatches`, the field, the 20-case suite
- [x] Slice 4 — selecting from a filtered list, selection survives clearing it
- [x] Slice 5 — scroll containment: inner scroller, touch rules, `<DragOverlay>`
- [x] Slice 6 — Liked Songs parity reusing the same bar
- [x] Slice 7 — polish: highlight runs, safe areas, reduced motion, desktop

## Verification state

- `npx tsc -b` clean.
- `npx vitest run` — 5 files, 77 tests, all passing (was 31 before this work).
- `npm run build` succeeds.
- Driven in a real 390x844 browser against the **production bundle** with only
  the Spotify API stubbed, plus a 1280x900 desktop pass. Evidence per slice is in
  `05-journal.md`.

**Measured outcomes**

| Claim | Result |
|---|---|
| Action bar stays put while scrolling | `position: fixed`, `top: 700` at scrollY 0 and 4000 |
| No button wrap at 390px | three 84x40 buttons + 40px Clear, `overflow: false` |
| Bar height | 57px, against the old in-header toolbar's 172px |
| Selection survives a reorder | selected idx 2 and 0, pressed Top -> `0, 2, 1, 3, 4` |
| Selection survives filtering | 2 picked from a 4-row filtered view, still 2 after clearing |
| Page cannot be shoved sideways | `docScrollW === docClientW === 390`; `window.scrollTo(300,4000)` leaves `scrollY 0` |
| Last row clears the dock | lastRowBottom 661 < dockTop 700 |
| Density gate holds | `mid` -> 4 Midnight songs, no "A-Punk" |

**Bug found and fixed that predates this work:** the header's Discard/Save group
used `w-0` without `overflow-hidden`, so the document scrolled sideways by ~120px.
That was the real cause of "grab the background and move the whole page". Fixed
in both pages. Recorded in ADR 0003.

## Follow-ups (not blocking, deliberately out of scope)

1. `FUZZY_SPAN_RATIO = 4` is tuned against a small fixture — re-check it against
   a real 300-track playlist. See ADR 0004.
2. The address bar no longer auto-hides. Accepted trade, worth a feel on a real
   phone. See ADR 0003.
3. No desktop-specific layout; the bar is bottom-anchored at every width.

## Journal
See `05-journal.md` (append-only) for per-slice evidence and decisions.
ADRs in `docs/adr/`.
