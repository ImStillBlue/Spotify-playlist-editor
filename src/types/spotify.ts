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

export interface PlaylistTrack {
  added_at: string
  track: Track | null
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  images: SpotifyImage[]
  owner: SpotifyUser
  collaborative: boolean
  tracks: {
    total: number
    href: string
  }
}

export interface PlaylistDetails extends Playlist {
  tracks: {
    total: number
    href: string
    items: PlaylistTrack[]
  }
}

export interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: number
}
