import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getLikedSongs,
  getLikedSongsTotal,
  getPlaylist,
  getUserPlaylists,
  removeSavedTracks,
  replacePlaylistItems,
} from './spotifyApi'
import { getTokenData, saveTokenData } from './auth'
import { Album, PlaylistItem, SavedTrack, Track } from '../types/spotify'

interface Recorded {
  method: string
  url: string
  body: string | null
}

interface Route {
  match: (url: string) => boolean
  respond: (url: string) => unknown
  status?: number
}

let recorded: Recorded[] = []
let routes: Route[] = []

const API = 'https://api.spotify.com/v1'

function track(id: string): Track {
  const album: Album = {
    id: 'album',
    name: 'Album',
    images: [{ url: 'http://img/cover.jpg', height: 64, width: 64 }],
  }
  return {
    id,
    name: `Song ${id}`,
    artists: [{ id: 'artist', name: 'Artist' }],
    album,
    duration_ms: 215000,
    uri: `spotify:track:${id}`,
  }
}

function playlistItems(ids: string[]): PlaylistItem[] {
  return ids.map((id) => ({ added_at: '2026-01-01T00:00:00Z', item: track(id) }))
}

function savedTracks(ids: string[]): SavedTrack[] {
  return ids.map((id) => ({ added_at: '2026-01-01T00:00:00Z', track: track(id) }))
}

function on(
  match: string | ((url: string) => boolean),
  respond: (url: string) => unknown,
  status = 200
) {
  routes.push({
    match: typeof match === 'string' ? (url) => url === match : match,
    respond,
    status,
  })
}

function urisSentIn(index: number): string[] {
  return JSON.parse(recorded[index].body ?? '{}').uris ?? []
}

beforeEach(() => {
  localStorage.clear()
  recorded = []
  routes = []

  saveTokenData({
    access_token: 'access',
    refresh_token: 'refresh',
    expires_at: Date.now() + 3_600_000,
  })

  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    recorded.push({
      method: init?.method ?? 'GET',
      url,
      body: typeof init?.body === 'string' ? init.body : null,
    })

    const route = routes.find((candidate) => candidate.match(url))
    const status = route?.status ?? 200

    return new Response(JSON.stringify(route?.respond(url) ?? null), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
})

describe('playlist contents', () => {
  it('pages through /playlists/{id}/items and merges every page', async () => {
    on(`${API}/playlists/p1`, () => ({
      id: 'p1',
      name: 'Road Trip',
      items: { total: 150, href: 'h', items: playlistItems(range(100)) },
    }))
    on((url) => url.includes('/playlists/p1/items'), () => ({
      items: playlistItems(range(50, 100)),
    }))

    const playlist = await getPlaylist('p1')

    expect(recorded.map((call) => call.url)).toEqual([
      `${API}/playlists/p1`,
      `${API}/playlists/p1/items?limit=100&offset=100`,
    ])
    expect(playlist.items?.items).toHaveLength(150)
    expect(playlist.items?.items?.[0].item?.uri).toBe('spotify:track:t0')
    expect(playlist.items?.items?.[0]).not.toHaveProperty('track')
  })

  it('skips paging when the caller has no access to the contents', async () => {
    on(`${API}/playlists/p2`, () => ({
      id: 'p2',
      name: 'Someone Elses',
      owner: { id: 'other', display_name: 'Them' },
    }))

    const playlist = await getPlaylist('p2')

    expect(recorded).toHaveLength(1)
    expect(playlist.items).toBeUndefined()
  })
})

describe('saving playlist items', () => {
  it('replaces the whole playlist in one request', async () => {
    on((url) => url.includes('/playlists/p1/items'), () => ({ snapshot_id: 's' }))

    await replacePlaylistItems('p1', ['spotify:track:a', 'spotify:track:b'])

    expect(recorded).toHaveLength(1)
    expect(recorded[0].method).toBe('PUT')
    expect(recorded[0].url).toBe(`${API}/playlists/p1/items`)
    expect(urisSentIn(0)).toEqual(['spotify:track:a', 'spotify:track:b'])
  })

  it('clears first, then appends in batches of 100', async () => {
    on((url) => url.includes('/playlists/p1/items'), () => ({ snapshot_id: 's' }))

    await replacePlaylistItems('p1', range(150).map((i) => `spotify:track:t${i}`))

    expect(recorded.map((call) => call.method)).toEqual(['PUT', 'POST', 'POST'])
    expect(urisSentIn(0)).toEqual([])
    expect(urisSentIn(1)).toHaveLength(100)
    expect(urisSentIn(2)).toHaveLength(50)
  })
})

describe('removing saved tracks', () => {
  it('uses DELETE /me/library with URIs, 40 per request', async () => {
    on((url) => url.includes('/me/library'), () => null)

    await removeSavedTracks(range(85).map((i) => `spotify:track:t${i}`))

    expect(recorded).toHaveLength(3)
    const batchSizes = recorded.map((call) => {
      expect(call.method).toBe('DELETE')
      expect(call.url.startsWith(`${API}/me/library?uris=`)).toBe(true)
      return decodeURIComponent(call.url).split('uris=')[1].split(',').length
    })
    expect(batchSizes).toEqual([40, 40, 5])
  })
})

describe('library reads', () => {
  it('pages through liked songs and keeps the track-wrapped shape', async () => {
    on(
      (url) => url.includes('/me/tracks'),
      () => ({ total: 120, items: savedTracks(range(50)) })
    )

    const first = await getLikedSongs()
    expect(first[0].track?.uri).toBe('spotify:track:t0')

    const total = await getLikedSongsTotal()
    expect(total).toBe(120)
    expect(recorded[0].url).toBe(`${API}/me/tracks?limit=50&offset=0`)
    expect(recorded[recorded.length - 1].url).toBe(`${API}/me/tracks?limit=1`)
  })

  it('pages through the current user playlists', async () => {
    on((url) => url.includes('/me/playlists'), (url) => {
      const offset = Number(new URL(url).searchParams.get('offset'))
      const count = offset === 100 ? 20 : 50
      return {
        total: 120,
        items: range(count, offset).map((i) => ({ id: `p${i}`, name: `Playlist ${i}` })),
      }
    })

    const playlists = await getUserPlaylists()

    expect(playlists).toHaveLength(120)
    expect(recorded.map((call) => call.url)).toEqual([
      `${API}/me/playlists?limit=50&offset=0`,
      `${API}/me/playlists?limit=50&offset=50`,
      `${API}/me/playlists?limit=50&offset=100`,
    ])
  })
})

describe('session handling', () => {
  it('clears the stored token when Spotify answers 401', async () => {
    on(`${API}/me/playlists?limit=50&offset=0`, () => ({ error: {} }), 401)

    await expect(getUserPlaylists()).rejects.toThrow(/log in again/i)
    expect(getTokenData()).toBeNull()
  })
})

describe('February 2026 endpoint restrictions', () => {
  it('only calls endpoints that still exist, and never the removed ones', async () => {
    on(
      (url) => url.includes('/playlists/p1/items'),
      () => ({ snapshot_id: 's', total: 0, items: [] })
    )
    on(`${API}/playlists/p1`, () => ({
      id: 'p1',
      name: 'Road Trip',
      items: { total: 0, href: 'h', items: [] },
    }))
    on((url) => url.includes('/me/'), () => ({ total: 0, items: [] }))

    await getPlaylist('p1')
    await getUserPlaylists()
    await getLikedSongs()
    await getLikedSongsTotal()
    await replacePlaylistItems('p1', ['spotify:track:a'])
    await removeSavedTracks(['spotify:track:a'])

    const allowed = [
      /\/v1\/me$/,
      /\/v1\/me\/playlists/,
      /\/v1\/me\/(tracks|albums|episodes|shows|audiobooks)\b/,
      /\/v1\/me\/library/,
      /\/v1\/playlists\/[^/]+$/,
      /\/v1\/playlists\/[^/]+\/items/,
    ]
    // The library reads survived; only the per-entity writes were replaced by
    // /me/library, so those paths are legal for GET and gone for everything else.
    const libraryEntityPattern =
      /\/v1\/me\/(tracks|albums|episodes|shows|audiobooks|following)\b/
    const removedRegardlessOfMethod = [
      /\/v1\/playlists\/[^/]+\/tracks/,
      /\/v1\/browse\//,
      /\/v1\/markets/,
      /\/v1\/users\//,
    ]

    for (const call of recorded) {
      const isRemoved =
        removedRegardlessOfMethod.some((pattern) => pattern.test(call.url)) ||
        (call.method !== 'GET' && libraryEntityPattern.test(call.url))

      expect(isRemoved, `${call.method} ${call.url}`).toBe(false)
    }
    expect(recorded.every((call) => allowed.some((pattern) => pattern.test(call.url)))).toBe(true)
  })
})

function range(count: number, start = 0): string[] {
  return Array.from({ length: count }, (_, i) => `t${start + i}`)
}
