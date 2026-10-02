# Product: Mobile editor UX (sticky actions, scroll containment, fuzzy search)

## Problem

I use this on my phone. Three things make it annoying:

1. **The buttons I need after selecting songs are hard to reach and hard to see.**
   When I select a song, a panel with "Move to Top", "Move to Bottom" and
   "Remove" appears at the top of the screen. It is a big block — it takes up
   about a fifth of my screen — and while I scroll, the songs underneath show
   through it, so I lose track of it. On a narrow phone the words "Move to Top"
   and "Move to Bottom" wrap onto two lines each, which makes the whole thing
   look broken. I want those controls to stay put and stay readable, so I can
   select a song anywhere in a long playlist and act on it without scrolling
   back up.

2. **The page itself moves when I am trying to scroll or drag.** Sometimes a
   swipe that I meant as "scroll the list" instead shoves the whole page
   sideways or bounces it, and the page drifts out of position. This app is
   one long vertical list of songs that I scroll a lot. Scrolling should do one
   thing: move the list up and down. Nothing else.

3. **Finding one song in a 300-track playlist is a scrollfest.** I have to read
   every row until I spot it, then tap the tiny checkbox. I want to type a few
   letters of the title or the artist, see the matches right away, and tap to
   select — without losing my place in the list.

## Success metric

This is a static site with no analytics, so the metric is a benchmark I run by
hand on a real phone, before and after:

- **Primary:** time to move 3 selected songs from the middle of a 100-track
  playlist to the top, measured with a screen recording. Target: under 8
  seconds, and zero instances of the action buttons being scrolled out of reach
  or unreadable.
- **Secondary:** time to find and select a named song in a 300-track playlist.
  Target: under 5 seconds, with no scrolling past the search field needed.
- **Guardrail:** zero unintended horizontal or rubber-band page movement during
  a normal vertical scroll on a phone. Verified by screen recording a normal
  scroll session.

## Announcement — the blog post before the feature

Your phone is a phone, not a desktop with a small window. This release treats it
that way. The controls that act on your selection — move to top, move to
bottom, remove — now live in a solid bar that stays exactly where it is while
you scroll, so you can pick a song at the bottom of a 300-track playlist and
send it to the top without ever scrolling back up. Scrolling now scrolls the
list and nothing else: no more grabbing the background and shoving the page
sideways. And you can type a few letters of a song or an artist to jump
straight to it and select it on the spot. The playlist editor, finally usable
with one thumb.

## Screens

Mockups in `./mockups/` — each is a plain, throwaway HTML file, sized to a
390x844 phone.

- `mockups/01-editor-top-bar.html` — **Variant A**: selection actions stay at
  the TOP, as a single compact opaque bar (one row, no wrapping). Includes the
  search field.
- `mockups/02-editor-bottom-bar.html` — **Variant B**: selection actions become a
  fixed bar at the BOTTOM of the screen, within thumb reach. Includes the same
  search field.
- `mockups/03-search-results.html` — the search field with matches ranked and
  filtered, showing that a tap on a result selects the song.
