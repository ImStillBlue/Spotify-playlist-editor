# 0004 — Fuzzy search uses a span-ratio density gate

Date: 2026-10-02 · Status: Accepted

## Context

Ranking is ordered: exact title, title prefix, artist prefix, title contains,
artist contains, fuzzy title, fuzzy artist. Ties break on title length, so `mid`
puts "Midnight" above "Midnight City".

The fuzzy tier is the problem. Plain subsequence matching is useless at short
query lengths: `mid` is a subsequence of "Vampire Weekend" (m at 2, i at 4, d
at 14), so a three-letter query matched a song with nothing to do with it. This
was caught building the mockup, before any production code existed.

## Decision

A fuzzy match must also pass a **density gate**: the matched characters have to
sit within a window proportional to the query. `fuzzyIndices` rejects a match
whose span exceeds `needle.length * FUZZY_SPAN_RATIO`, currently 4.

Measured behaviour on a 30-track playlist: `mid` returns the four Midnight songs
and nothing else; `mdc` still finds Midnight City; `zzz` returns nothing. A
single-character query never fuzzy-matches.

Hit indices are returned alongside the match so highlighting is derived from the
same computation rather than recomputed in a component.

## Consequences

- `FUZZY_SPAN_RATIO` is a tuned constant, not a derived truth. The tradeoff is
  real: tighten it and acronym queries like `mdc` stop working; loosen it and
  `mid` drifts back toward matching anything.
- It is currently tuned against a small fixture. **It should be re-checked
  against a real 300-track playlist**, and if the curve is ugly in practice the
  honest fix is a real scoring function (consecutive-run and word-start bonuses,
  fzf-style) rather than a bigger constant.
- Hit indices point into the *lowercased* field. `segmentByHits` refuses to
  highlight when lowercasing changes the string's length, so a mismatch degrades
  to no highlighting instead of highlighting the wrong characters.
