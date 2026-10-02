import type { Track } from '../types/spotify'
import type { TrackRow } from '../types/track'

// The order of this union IS the ranking. `all` is the unfiltered case, which
// is a real state rather than a fake exact match.
export type MatchKind =
  | 'all'
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
  /** Lower sorts first. Kind dominates; title length breaks ties. */
  score: number
  /** Indices into the lowercased title. Empty when the artist matched. */
  titleHits: number[]
  /** Indices into the lowercased artist string. Empty when the title matched. */
  artistHits: number[]
}

const RANK: Record<MatchKind, number> = {
  all: 0,
  'exact-title': 1,
  'title-prefix': 2,
  'artist-prefix': 3,
  'title-contains': 4,
  'artist-contains': 5,
  'fuzzy-title': 6,
  'fuzzy-artist': 7,
}

// Without a span limit a 3-letter query matches nearly everything: "mid" hits
// m-i-d inside "Vampire Weekend". Requiring the matched characters to sit within
// a window proportional to the query is what keeps short queries usable. This
// constant is the knob; slice 3 tunes it against a real playlist.
const FUZZY_SPAN_RATIO = 4

export function artistName(track: Track): string {
  return track.artists.map((a) => a.name).join(', ')
}

function span(start: number, length: number): number[] {
  return Array.from({ length }, (_, i) => start + i)
}

// Subsequence match over an already-lowercased string, returning the matched
// indices. Returns null rather than an empty array so callers can never render
// a highlight run against a blank query.
export function fuzzyIndices(haystack: string, needle: string): number[] | null {
  if (needle.length < 2) return null

  const hits: number[] = []
  let from = 0
  for (const ch of needle) {
    if (ch === ' ') continue
    const at = haystack.indexOf(ch, from)
    if (at === -1) return null
    hits.push(at)
    from = at + 1
  }

  if (hits.length < 2) return null
  const width = hits[hits.length - 1] - hits[0] + 1
  return width <= needle.length * FUZZY_SPAN_RATIO ? hits : null
}

export function rankMatches(
  rows: readonly TrackRow[],
  query: string
): Match[] {
  const q = query.trim().toLowerCase()

  if (q === '') {
    return rows.map((row) => ({
      row,
      kind: 'all' as const,
      score: 0,
      titleHits: [],
      artistHits: [],
    }))
  }

  const matches: Match[] = []

  for (const row of rows) {
    const title = row.track.name.toLowerCase()
    const artist = artistName(row.track).toLowerCase()

    let kind: MatchKind | null = null
    let titleHits: number[] = []
    let artistHits: number[] = []

    if (title === q) {
      kind = 'exact-title'
      titleHits = span(0, q.length)
    } else if (title.startsWith(q)) {
      kind = 'title-prefix'
      titleHits = span(0, q.length)
    } else if (artist.startsWith(q)) {
      kind = 'artist-prefix'
      artistHits = span(0, q.length)
    } else if (title.includes(q)) {
      kind = 'title-contains'
      titleHits = span(title.indexOf(q), q.length)
    } else if (artist.includes(q)) {
      kind = 'artist-contains'
      artistHits = span(artist.indexOf(q), q.length)
    } else {
      const inTitle = fuzzyIndices(title, q)
      const inArtist = inTitle ? null : fuzzyIndices(artist, q)
      if (inTitle) {
        kind = 'fuzzy-title'
        titleHits = inTitle
      } else if (inArtist) {
        kind = 'fuzzy-artist'
        artistHits = inArtist
      }
    }

    if (kind === null) continue

    matches.push({
      row,
      kind,
      score: RANK[kind] * 1000 + row.track.name.length,
      titleHits,
      artistHits,
    })
  }

  return matches.sort(
    (a, b) => a.score - b.score || a.row.track.name.localeCompare(b.row.track.name)
  )
}

export function toTrackRows<T>(
  items: readonly T[],
  getTrack: (item: T) => Track | null
): TrackRow[] {
  const rows: TrackRow[] = []
  items.forEach((item, index) => {
    const track = getTrack(item)
    if (track === null) return
    rows.push({ key: `${track.id}:${index}`, track })
  })
  return rows
}

function partition(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>
): { picked: TrackRow[]; rest: TrackRow[] } {
  const picked: TrackRow[] = []
  const rest: TrackRow[] = []
  for (const row of rows) {
    if (selected.has(row.key)) picked.push(row)
    else rest.push(row)
  }
  return { picked, rest }
}

export function moveSelectedToTop(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>
): TrackRow[] {
  if (selected.size === 0) return rows as TrackRow[]
  const { picked, rest } = partition(rows, selected)
  if (picked.length === 0) return rows as TrackRow[]
  return [...picked, ...rest]
}

export function moveSelectedToBottom(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>
): TrackRow[] {
  if (selected.size === 0) return rows as TrackRow[]
  const { picked, rest } = partition(rows, selected)
  if (picked.length === 0) return rows as TrackRow[]
  return [...rest, ...picked]
}

export function removeSelected(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>
): TrackRow[] {
  if (selected.size === 0) return rows as TrackRow[]
  const { rest } = partition(rows, selected)
  if (rest.length === rows.length) return rows as TrackRow[]
  return rest
}

export function moveSelectedTo(
  rows: readonly TrackRow[],
  selected: ReadonlySet<string>,
  overKey: string
): TrackRow[] {
  if (selected.size === 0) return rows as TrackRow[]
  const { picked, rest } = partition(rows, selected)
  if (picked.length === 0) return rows as TrackRow[]

  const overIndex = rows.findIndex((r) => r.key === overKey)
  if (overIndex === -1) return [...rest, ...picked]

  // Count the UNPICKED rows before the target: that is the index the block has
  // to be spliced into once the picked rows are lifted out of the list.
  let insertAt = 0
  for (let i = 0; i < overIndex; i++) {
    if (!selected.has(rows[i].key)) insertAt++
  }
  return [...rest.slice(0, insertAt), ...picked, ...rest.slice(insertAt)]
}

export interface HighlightSegment {
  text: string
  hit: boolean
}

// Renders nothing highlighted when lowercasing changed the string's length,
// because the hit indices are positions in the lowercased form and would then
// point at the wrong characters.
export function segmentByHits(text: string, hits: readonly number[]): HighlightSegment[] {
  if (hits.length === 0) return [{ text, hit: false }]
  if (text.toLowerCase().length !== text.length) return [{ text, hit: false }]

  const marked = new Set(hits)
  const segments: HighlightSegment[] = []
  for (let i = 0; i < text.length; i++) {
    const hit = marked.has(i)
    const last = segments[segments.length - 1]
    if (last && last.hit === hit) last.text += text[i]
    else segments.push({ text: text[i], hit })
  }
  return segments
}

export function reorderRows(
  rows: readonly TrackRow[],
  activeKey: string,
  overKey: string
): TrackRow[] {
  const from = rows.findIndex((r) => r.key === activeKey)
  const to = rows.findIndex((r) => r.key === overKey)
  if (from === -1 || to === -1 || from === to) return rows as TrackRow[]

  const next = [...rows]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
