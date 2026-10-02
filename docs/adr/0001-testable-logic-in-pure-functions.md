# 0001 — Testable logic lives in pure functions, not components

Date: 2026-10-02 · Status: Accepted

## Context

`vitest.config.ts` sets `environment: 'node'`. There is no jsdom, and
`src/test/setup.ts` argues against adding one: "pulling in jsdom for two maps
would be a heavier dependency than the tests justify."

That means the repo cannot test components or the DOM at all. The risk is that
behaviour which *should* be verified ends up trapped inside `.tsx` files where
it can only be checked by hand — and hand-checking is exactly how
`moveSelectedToTop` came to be an untested inline closure in `Editor.tsx` for the
life of the feature.

## Decision

Any logic worth proving is extracted into a pure function under `src/utils/`,
taking and returning plain data. Components hold no business logic.

The mobile-editor-ux feature follows this: `src/utils/trackSearch.ts` owns row
construction, fuzzy matching, ranking and every reorder, all covered by
`src/utils/trackSearch.test.ts` in the node environment.

## Consequences

- Ordering, filtering and search behaviour are testable without a browser.
- Components stay thin, but there is more indirection: a behaviour change often
  means editing a util and its callers.
- UI verification is manual. That is a real gap, not an oversight — it is the
  accepted price of not taking on jsdom.
- If the team ever wants component tests, this ADR is the thing to supersede.
  Adding jsdom is a bigger decision than any single feature, and should be made
  deliberately rather than as a side effect.
