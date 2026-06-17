import { SPOTIFY_CONFIG } from '../config/spotify'
import { getValidAccessToken } from './auth'
import { Playlist, PlaylistDetails, PlaylistTrack, SpotifyUser } from '../types/spotify'

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

export async function getPlaylist(playlistId: string): Promise<PlaylistDetails> {
  const response = await fetchWithAuth(`/playlists/${playlistId}`)
  const playlist = await response.json()

  // If more than 100 tracks, fetch remaining
  if (playlist.tracks.total > 100) {
    const remainingTracks = await fetchAllPlaylistTracks(playlistId, 100)
    playlist.tracks.items = [...playlist.tracks.items, ...remainingTracks]
  }

  return playlist
}

async function fetchAllPlaylistTracks(
  playlistId: string,
  startOffset: number
): Promise<PlaylistTrack[]> {
  const tracks: PlaylistTrack[] = []
  let offset = startOffset
  const limit = 100

  while (true) {
    const response = await fetchWithAuth(
      `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`
    )
    const data = await response.json()

    tracks.push(...data.items)

    if (data.items.length < limit) {
      break
    }
    offset += limit

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return tracks
}

export async function replacePlaylistTracks(
  playlistId: string,
  uris: string[]
): Promise<void> {
  // Spotify API limits to 100 tracks per request
  // For replace, we need to clear first then add in batches

  if (uris.length <= 100) {
    await fetchWithAuth(`/playlists/${playlistId}/tracks`, {
      method: 'PUT',
      body: JSON.stringify({ uris }),
    })
    return
  }

  // Clear playlist first
  await fetchWithAuth(`/playlists/${playlistId}/tracks`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [] }),
  })

  // Add tracks in batches
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100)
    await fetchWithAuth(`/playlists/${playlistId}/tracks`, {
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

export async function getLikedSongs(): Promise<PlaylistTrack[]> {
  const tracks: PlaylistTrack[] = []
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

export async function removeSavedTracks(ids: string[]): Promise<void> {
  // DELETE /me/tracks takes track IDs (not URIs), max 50 per request
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    await fetchWithAuth('/me/tracks', {
      method: 'DELETE',
      body: JSON.stringify({ ids: batch }),
    })

    if (i + 50 < ids.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

export async function removeTracksFromPlaylist(
  playlistId: string,
  uris: string[]
): Promise<void> {
  // Remove in batches of 100
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100)
    await fetchWithAuth(`/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({
        tracks: batch.map((uri) => ({ uri })),
      }),
    })

    if (i + 100 < uris.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}
