export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyUser {
  id: string
  display_name: string | null
}

export interface Artist {
  id: string
  name: string
}

export interface Album {
  id: string
  name: string
  images: SpotifyImage[]
}

export interface Track {
  id: string
  name: string
  artists: Artist[]
  album: Album
  duration_ms: number
  uri: string
}

// An entry of a playlist, as returned by the playlist item endpoints. Since the
// February 2026 Web API update the wrapped entity is called `item`, not `track`.
export interface PlaylistItem {
  added_at: string
  item: Track | null
}

// An entry of the Saved Tracks library (GET /me/tracks), which still wraps the
// entity under `track`.
export interface SavedTrack {
  added_at: string
  track: Track | null
}

export interface PlaylistItemsPage {
  total: number
  href: string
  items?: PlaylistItem[]
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  owner: SpotifyUser
  collaborative: boolean
  // The contents (`items.items`) are only returned for playlists the current
  // user owns or collaborates on — other playlists carry metadata only.
  items?: PlaylistItemsPage
}

export interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: number
}
