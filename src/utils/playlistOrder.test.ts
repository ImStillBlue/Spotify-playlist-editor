import { beforeEach, describe, expect, it } from 'vitest'
import {
  applySavedOrder,
  getSavedPlaylistOrder,
  savePlaylistOrder,
} from './playlistOrder'

const ORDER_KEY = 'spotify_playlist_order'

beforeEach(() => {
  localStorage.clear()
})

describe('saved playlist order', () => {
  it('round-trips through local storage', () => {
    savePlaylistOrder(['a', 'b', 'c'])
    expect(getSavedPlaylistOrder()).toEqual(['a', 'b', 'c'])
    expect(localStorage.getItem(ORDER_KEY)).toBe('["a","b","c"]')
  })

  it('falls back to an empty order when storage holds junk', () => {
    localStorage.setItem(ORDER_KEY, 'not json')
    expect(getSavedPlaylistOrder()).toEqual([])
  })

  it('rejects a stored value that is not an array', () => {
    localStorage.setItem(ORDER_KEY, '{"a":1}')
    expect(getSavedPlaylistOrder()).toEqual([])
  })
})

describe('applySavedOrder', () => {
  const fetched = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('returns the fetched order untouched when nothing is saved', () => {
    expect(applySavedOrder(fetched, [])).toEqual(fetched)
  })

  it('applies the saved order', () => {
    expect(applySavedOrder(fetched, ['c', 'a'])).toEqual([
      { id: 'c' },
      { id: 'a' },
      { id: 'b' },
    ])
  })

  it('skips ids that no longer exist in the fetched list', () => {
    expect(applySavedOrder(fetched, ['gone', 'b'])).toEqual([{ id: 'b' }, { id: 'a' }, { id: 'c' }])
  })

  it('appends newly created playlists after the saved ones, in API order', () => {
    const withNew = [...fetched, { id: 'd' }]
    expect(applySavedOrder(withNew, ['c', 'a'])).toEqual([
      { id: 'c' },
      { id: 'a' },
      { id: 'b' },
      { id: 'd' },
    ])
  })
})
