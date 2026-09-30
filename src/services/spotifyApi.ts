import { SPOTIFY_CONFIG } from '../config/spotify'
import { getValidAccessToken } from './auth'
import { Playlist, PlaylistItem, SavedTrack, SpotifyUser } from '../types/spotify'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidAccessToken()

  const response = await fetch(`${SPOTIFY_CONFIG.apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const err = new Error(
      error.error?.message || `API error: ${response.status}`
    ) as Error & { status?: number }
    err.status = response.status
    throw err
  }

  return response
}

export async function getCurrentUser(): Promise<SpotifyUser> {
  const response = await fetchWithAuth('/me')
  return response.json()
}

export async function getUserPlaylists(): Promise<Playlist[]> {
  const playlists: Playlist[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const response = await fetchWithAuth(`/me/playlists?limit=${limit}&offset=${offset}`)
    const data = await response.json()

    playlists.push(...data.items)

    if (data.items.length < limit || playlists.length >= data.total) {
      break
    }
    offset += limit
  }

  return playlists
}

export async function getPlaylist(playlistId: string): Promise<Playlist> {
  const response = await fetchWithAuth(`/playlists/${playlistId}`)
  const playlist: Playlist = await response.json()

  // Playlist contents are paged at 100 items. `items` (and the contents inside
  // it) is absent entirely for playlists the user neither owns nor collaborates
  // on, in which case there is nothing to page through.
  const page = playlist.items
  if (page?.items && page.items.length < page.total) {
    const remainingItems = await fetchAllPlaylistItems(playlistId, page.items.length)
    page.items = [...page.items, ...remainingItems]
  }

  return playlist
}

async function fetchAllPlaylistItems(
  playlistId: string,
  startOffset: number
): Promise<PlaylistItem[]> {
  const items: PlaylistItem[] = []
  let offset = startOffset
  const limit = 100

  while (true) {
    const response = await fetchWithAuth(
      `/playlists/${playlistId}/items?limit=${limit}&offset=${offset}`
    )
    const data = await response.json()

    items.push(...data.items)

    if (data.items.length < limit) {
      break
    }
    offset += limit

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return items
}

export async function replacePlaylistItems(
  playlistId: string,
  uris: string[]
): Promise<void> {
  // Spotify API limits to 100 items per request
  // For replace, we need to clear first then add in batches

  if (uris.length <= 100) {
    await fetchWithAuth(`/playlists/${playlistId}/items`, {
      method: 'PUT',
      body: JSON.stringify({ uris }),
    })
    return
  }

  // Clear playlist first
  await fetchWithAuth(`/playlists/${playlistId}/items`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [] }),
  })

  // Add items in batches
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100)
    await fetchWithAuth(`/playlists/${playlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ uris: batch }),
    })

    // Small delay to avoid rate limiting
    if (i + 100 < uris.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

// --- Liked Songs (Saved Tracks) ---
// Note: the Saved Tracks library cannot be reordered via the API — it is always
// returned in date-added order — so the Liked Songs view only supports removal.

export async function getLikedSongsTotal(): Promise<number> {
  const response = await fetchWithAuth('/me/tracks?limit=1')
  const data = await response.json()
  return data.total
}

export async function getLikedSongs(): Promise<SavedTrack[]> {
  const tracks: SavedTrack[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const response = await fetchWithAuth(`/me/tracks?limit=${limit}&offset=${offset}`)
    const data = await response.json()

    tracks.push(...data.items)

    if (data.items.length < limit || tracks.length >= data.total) {
      break
    }
    offset += limit

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return tracks
}

export async function removeSavedTracks(uris: string[]): Promise<void> {
  // DELETE /me/library takes Spotify URIs as a comma-separated list, max 40
  // per request. The entity-specific DELETE /me/tracks was removed in Feb 2026.
  for (let i = 0; i < uris.length; i += 40) {
    const batch = uris.slice(i, i + 40)
    await fetchWithAuth(
      `/me/library?uris=${encodeURIComponent(batch.join(','))}`,
      { method: 'DELETE' }
    )

    if (i + 40 < uris.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

export async function removePlaylistItems(
  playlistId: string,
  uris: string[]
): Promise<void> {
  // Remove in batches of 100
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100)
    await fetchWithAuth(`/playlists/${playlistId}/items`, {
      method: 'DELETE',
      body: JSON.stringify({
        items: batch.map((uri) => ({ uri })),
      }),
    })

    if (i + 100 < uris.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}
