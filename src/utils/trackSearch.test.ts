import { describe, expect, it } from 'vitest'
import type { Track, PlaylistItem } from '../types/spotify'
import type { TrackRow } from '../types/track'
import {
  artistName,
  fuzzyIndices,
  moveSelectedTo,
  moveSelectedToBottom,
  moveSelectedToTop,
  rankMatches,
  removeSelected,
  reorderRows,
  segmentByHits,
  toTrackRows,
} from './trackSearch'

function makeTrack(id: string, name: string, artistNames: string[] = ['Artist']): Track {
  return {
    id,
    name,
    artists: artistNames.map((n, i) => ({ id: `a${i}`, name: n })),
    album: { id: `al${id}`, name: 'Album', images: [] },
    duration_ms: 210000,
    uri: `spotify:track:${id}`,
  }
}

function makeRows(...names: string[]): TrackRow[] {
  return names.map((name, i) => ({
    key: `t${i}:${i}`,
    track: makeTrack(`t${i}`, name),
  }))
}

const keysOf = (rows: readonly TrackRow[]) => rows.map((r) => r.key)
const namesOf = (rows: readonly TrackRow[]) => rows.map((r) => r.track.name)

describe('toTrackRows', () => {
  const item = (id: string | null, addedAt = '2026-01-01'): PlaylistItem => ({
    added_at: addedAt,
    item: id === null ? null : makeTrack(id, `Song ${id}`),
  })

  const rowsOf = (items: PlaylistItem[]) => toTrackRows(items, (i) => i.item)

  it('drops entries whose payload is null', () => {
    expect(rowsOf([item('a'), item(null), item('b')])).toHaveLength(2)
  })

  it('gives duplicate songs distinct keys', () => {
    const rows = rowsOf([item('same'), item('same')])
    expect(rows).toHaveLength(2)
    expect(rows[0].key).not.toBe(rows[1].key)
  })

  it('gives distinct songs distinct keys and preserves input order', () => {
    expect(keysOf(rowsOf([item('a'), item('b'), item('c')]))).toEqual([
      'a:0',
      'b:1',
      'c:2',
    ])
  })

  it('carries the unwrapped track and the artist list on the row', () => {
    const rows = rowsOf([
      { added_at: '2026-05-05', item: makeTrack('x', 'Song', ['First', 'Second']) },
    ])
    expect(rows[0].track.name).toBe('Song')
    expect(artistName(rows[0].track)).toBe('First, Second')
  })
})

describe('reorder helpers are no-ops without a selection', () => {
  const rows = makeRows('a', 'b', 'c')

  it('returns the input array unchanged for an empty selection', () => {
    const empty = new Set<string>()
    expect(moveSelectedToTop(rows, empty)).toBe(rows)
    expect(moveSelectedToBottom(rows, empty)).toBe(rows)
    expect(removeSelected(rows, empty)).toBe(rows)
  })

  it('returns the input array unchanged when no key matches', () => {
    const stale = new Set(['nope'])
    expect(moveSelectedToTop(rows, stale)).toBe(rows)
    expect(moveSelectedToBottom(rows, stale)).toBe(rows)
    expect(removeSelected(rows, stale)).toBe(rows)
  })
})

describe('moveSelectedToTop', () => {
  it('keeps the moved block in its original relative order', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const picked = moveSelectedToTop(rows, new Set(['t2:2', 't0:0']))
    expect(namesOf(picked)).toEqual(['a', 'c', 'b', 'd'])
  })

  it('keeps the unmoved rows in their original relative order', () => {
    const rows = makeRows('a', 'b', 'c', 'd', 'e')
    const picked = moveSelectedToTop(rows, new Set(['t1:1', 't3:3']))
    expect(namesOf(picked)).toEqual(['b', 'd', 'a', 'c', 'e'])
  })

  it('loses and duplicates nothing', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const picked = moveSelectedToTop(rows, new Set(['t1:1', 't2:2']))
    expect(picked).toHaveLength(4)
    expect(new Set(keysOf(picked)).size).toBe(4)
  })

  it('ignores a stale key without crashing', () => {
    const rows = makeRows('a', 'b')
    const picked = moveSelectedToTop(rows, new Set(['t0:0', 'gone']))
    expect(namesOf(picked)).toEqual(['a', 'b'])
  })
})

describe('moveSelectedToBottom', () => {
  it('keeps the moved block in its original relative order', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const picked = moveSelectedToBottom(rows, new Set(['t2:2', 't0:0']))
    expect(namesOf(picked)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('keeps the unmoved rows in their original relative order', () => {
    const rows = makeRows('a', 'b', 'c', 'd', 'e')
    const picked = moveSelectedToBottom(rows, new Set(['t1:1', 't3:3']))
    expect(namesOf(picked)).toEqual(['a', 'c', 'e', 'b', 'd'])
  })
})

describe('removeSelected', () => {
  it('leaves the rest untouched', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const left = removeSelected(rows, new Set(['t1:1', 't2:2']))
    expect(namesOf(left)).toEqual(['a', 'd'])
  })

  it('can empty the list', () => {
    const rows = makeRows('a', 'b')
    expect(removeSelected(rows, new Set(['t0:0', 't1:1']))).toEqual([])
  })
})

describe('fuzzyIndices', () => {
  it('matches a subsequence and returns the matched indices', () => {
    expect(fuzzyIndices('midnight city', 'mdc')).toEqual([0, 2, 9])
  })

  it('rejects a match spread too far apart', () => {
    expect(fuzzyIndices('vampire weekend', 'mid')).toBeNull()
  })

  it('rejects a needle that is not a subsequence at all', () => {
    expect(fuzzyIndices('midnight', 'mdc')).toBeNull()
  })

  it('is case-insensitive once the caller has lowercased', () => {
    expect(fuzzyIndices('midnight city', 'mdc')).toEqual(
      fuzzyIndices('Midnight City'.toLowerCase(), 'mdc')
    )
  })

  it('ignores spaces in the needle', () => {
    expect(fuzzyIndices('midnight city', 'm c')).toEqual([0, 9])
  })

  it('rejects a one-character needle', () => {
    expect(fuzzyIndices('midnight', 'm')).toBeNull()
  })

  it('treats an empty needle as no match', () => {
    expect(fuzzyIndices('midnight', '')).toBeNull()
  })
})

describe('rankMatches', () => {
  const library = makeRows(
    'Midnight City',
    'A-Punk',
    'Young Blood',
    'Midnight Blue',
    'City of Stars',
    'Midnight',
    'Pumped Up Kicks',
    'Vienna',
    'Sundown'
  ).map((row, i) =>
    i === 0
      ? { ...row, track: makeTrack('t0', 'Midnight City', ['M83']) }
      : i === 6
        ? { ...row, track: makeTrack('t6', 'Pumped Up Kicks', ['Foals']) }
        : i === 7
          ? { ...row, track: makeTrack('t7', 'Vienna', ['Billy Joel']) }
          : i === 8
            ? { ...row, track: makeTrack('t8', 'Sundown', ['Midlake']) }
            : row
  )

  const kinds = (q: string) => rankMatches(library, q).map((m) => m.kind)

  it('returns every row in original order for an empty query', () => {
    expect(rankMatches(library, '').map((m) => m.row.track.name)).toEqual(
      library.map((r) => r.track.name)
    )
    expect(rankMatches(library, '   ').map((m) => m.row.track.name)).toEqual(
      library.map((r) => r.track.name)
    )
  })

  it('ranks an exact title match first', () => {
    expect(rankMatches(library, 'Vienna')[0].kind).toBe('exact-title')
  })

  it('prefers a title prefix over an artist contains', () => {
    // "Midnight" matches by title prefix; "Sundown" only matches inside its
    // artist. The kind ranking has to put the title hit first regardless.
    const names = rankMatches(library, 'mid').map((m) => m.row.track.name)
    expect(names.indexOf('Midnight')).toBeLessThan(names.indexOf('Sundown'))
    expect(rankMatches(library, 'mid').find((m) => m.row.track.name === 'Sundown')?.kind).toBe(
      'artist-prefix'
    )
  })

  it('prefers a shorter title within the same kind', () => {
    const mid = rankMatches(library, 'mid').filter((m) => m.kind === 'title-prefix')
    expect(mid[0].row.track.name).toBe('Midnight')
    expect(mid.map((m) => m.row.track.name).sort()).toEqual([
      'Midnight',
      'Midnight Blue',
      'Midnight City',
    ])
  })

  it('finds a song by artist', () => {
    const byArtist = rankMatches(library, 'foals')
    expect(byArtist).toHaveLength(1)
    expect(byArtist[0].row.track.name).toBe('Pumped Up Kicks')
    expect(byArtist[0].kind).toBe('artist-prefix')
    expect(byArtist[0].artistHits).toEqual([0, 1, 2, 3, 4])
  })

  it('excludes non-matches', () => {
    expect(rankMatches(library, 'zzz')).toEqual([])
  })

  it('puts title hits on the title and never on the artist', () => {
    const [first] = rankMatches(library, 'midnight city')
    expect(first.titleHits).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(first.artistHits).toEqual([])
  })

  it('returns hit indices that stay inside the field they belong to', () => {
    for (const q of ['mid', 'mdc', 'city', 'foals', 'm83', 'o']) {
      for (const m of rankMatches(library, q)) {
        const title = m.row.track.name.toLowerCase()
        const artist = artistName(m.row.track).toLowerCase()
        for (const i of m.titleHits) expect(i).toBeLessThan(title.length)
        for (const i of m.artistHits) expect(i).toBeLessThan(artist.length)
      }
    }
  })

  it('does not mutate the input array', () => {
    const before = library.map((r) => r.key)
    rankMatches(library, 'mid')
    expect(library.map((r) => r.key)).toEqual(before)
  })

  it('exposes the ranking order through the kinds it returns', () => {
    expect(kinds('mid').slice(0, 3)).toEqual([
      'title-prefix',
      'title-prefix',
      'title-prefix',
    ])
    expect(kinds('mid')).toContain('artist-prefix')
  })
})

describe('segmentByHits', () => {
  it('returns a single unhit segment when there are no hits', () => {
    expect(segmentByHits('Midnight', [])).toEqual([{ text: 'Midnight', hit: false }])
  })

  it('splits into alternating hit and plain runs', () => {
    expect(segmentByHits('Midnight', [0, 1, 2])).toEqual([
      { text: 'Mid', hit: true },
      { text: 'night', hit: false },
    ])
  })

  it('merges non-contiguous hits into separate runs', () => {
    expect(segmentByHits('abcde', [0, 2])).toEqual([
      { text: 'a', hit: true },
      { text: 'b', hit: false },
      { text: 'c', hit: true },
      { text: 'de', hit: false },
    ])
  })

  it('rebuilds the original string exactly', () => {
    const text = 'Mystery of Love'
    for (const hits of [[0], [0, 8, 10], [7], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]]) {
      expect(segmentByHits(text, hits).map((s) => s.text).join('')).toBe(text)
    }
  })

  it('refuses to highlight when lowercasing changes the length', () => {
    expect(segmentByHits('İstanbul', [0])).toEqual([{ text: 'İstanbul', hit: false }])
  })
})

describe('moveSelectedTo', () => {
  it('drops the block just above the target row', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const moved = moveSelectedTo(rows, new Set(['t0:0']), 't3:3')
    expect(namesOf(moved)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('keeps the moved block in its original relative order', () => {
    const rows = makeRows('a', 'b', 'c', 'd', 'e')
    const moved = moveSelectedTo(rows, new Set(['t0:0', 't1:1']), 't4:4')
    expect(namesOf(moved)).toEqual(['c', 'd', 'a', 'b', 'e'])
  })

  it('appends when the target is not in the list', () => {
    const rows = makeRows('a', 'b', 'c')
    expect(namesOf(moveSelectedTo(rows, new Set(['t0:0']), 'gone'))).toEqual([
      'b',
      'c',
      'a',
    ])
  })

  it('handles a target that is itself selected', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const moved = moveSelectedTo(rows, new Set(['t0:0', 't1:1']), 't1:1')
    expect(moved).toHaveLength(4)
    expect(namesOf(moved)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('is a no-op for an empty or non-matching selection', () => {
    const rows = makeRows('a', 'b', 'c')
    expect(moveSelectedTo(rows, new Set(), 't2:2')).toBe(rows)
    expect(moveSelectedTo(rows, new Set(['gone']), 't2:2')).toBe(rows)
  })
})

describe('reorderRows', () => {
  it('moves the active row to the index the over row occupies', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const moved = reorderRows(rows, 't0:0', 't2:2')
    expect(namesOf(moved)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves a row backwards', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const moved = reorderRows(rows, 't3:3', 't1:1')
    expect(namesOf(moved)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('is a no-op when active and over are the same row', () => {
    const rows = makeRows('a', 'b', 'c')
    expect(reorderRows(rows, 't1:1', 't1:1')).toBe(rows)
  })

  it('is a no-op when a key is absent', () => {
    const rows = makeRows('a', 'b', 'c')
    expect(reorderRows(rows, 'gone', 't1:1')).toBe(rows)
    expect(reorderRows(rows, 't1:1', 'gone')).toBe(rows)
  })
})

describe('no helper mutates its input', () => {
  it('leaves the source array and its rows untouched', () => {
    const rows = makeRows('a', 'b', 'c', 'd')
    const before = keysOf(rows)
    const snapshot = JSON.stringify(rows)

    moveSelectedToTop(rows, new Set(['t1:1']))
    moveSelectedToBottom(rows, new Set(['t1:1']))
    moveSelectedTo(rows, new Set(['t1:1']), 't3:3')
    removeSelected(rows, new Set(['t1:1']))
    reorderRows(rows, 't0:0', 't3:3')

    expect(keysOf(rows)).toEqual(before)
    expect(JSON.stringify(rows)).toBe(snapshot)
  })
})
