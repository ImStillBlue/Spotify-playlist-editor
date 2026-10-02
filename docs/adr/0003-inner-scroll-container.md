# 0003 — The editor scrolls an inner container, not the window

Date: 2026-10-02 · Status: Accepted

## Context

Users reported that scrolling "sometimes grabs the background and moves the whole
page about". The original guess was overscroll/rubber-band behaviour.

Measurement found a better explanation. The page header's Discard/Save group was
collapsed with `w-0` but no `overflow-hidden`, so its children stayed at natural
width and painted outside the container. The document measured
`scrollWidth 496` against `clientWidth 375` — the page scrolled sideways by
about 120px. A horizontally scrollable document is exactly what lets a sideways
swipe shove the page around. The bug predates this work: it is in `Editor.tsx`
and `LikedSongs.tsx` at the commit before it.

Separately, `position: sticky` was never actually the problem the user believed
it was. The toolbar held position correctly; it grew from 64px to 172px on
selection, wrapped "Move to / Top" onto two lines at 390px, and ghosted rows
through its translucency.

## Decision

The editor and Liked Songs pages are a fixed-height flex column:
`h-[100dvh] flex flex-col overflow-hidden`, with `<main>` as
`flex-1 min-h-0 overflow-y-auto overscroll-none`. The window does not scroll.

This removes the grabbable background structurally rather than patching it, and
scopes `overscroll-behavior` and `touch-action` to the list. The sticky header
and the fixed action bar stop competing with a window scroller. The header
overflow is fixed with `overflow-hidden` on the collapsed group.

## Consequences

- **The mobile address bar no longer auto-hides.** The usable viewport is about
  10% shorter. This was accepted knowingly and is the main thing to revisit if
  it feels wrong in real use.
- Any future page that needs normal document scrolling must not copy this shell.
- `min-h-0` on the scrolling child is load-bearing. Without it a flex item
  refuses to shrink below its content and the page grows past the viewport,
  silently restoring window scrolling.
