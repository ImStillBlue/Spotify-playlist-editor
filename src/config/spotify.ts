// Spotify OAuth configuration
// Client ID is provided by the user (BYOK model)

const STORAGE_KEY = 'spotify_client_id'

// Spotify rejects `localhost` as a redirect URI outright ("Insecure redirect
// URI"), so local development must use an explicit loopback IP instead. Both
// of these have to be registered in the Spotify dashboard.
export const REDIRECT_URIS = {
  local: 'https://127.0.0.1:5173/Spotify-playlist-editor/callback',
  live: 'https://imstillblue.github.io/Spotify-playlist-editor/callback',
} as const

const APP_PATH = '/Spotify-playlist-editor'

// Deriving the URI from the live page origin keeps it consistent with whatever
// host the app is actually served from, so the callback can never point at a
// different origin than the one that started the flow. Spotify rejects the
// `localhost` hostname, so a page served there cannot complete a login.
export function getRedirectUri(): string {
  const origin = globalThis.location?.origin
  if (!origin || origin === 'null') {
    return import.meta.env.DEV ? REDIRECT_URIS.local : REDIRECT_URIS.live
  }
  return `${origin}${APP_PATH}/callback`
}

// Spotify requires https except on loopback addresses, where http is allowed,
// and it rejects the `localhost` hostname outright. A deployment on any real
// host passes; a dev server reached by name does not.
export function isSpotifyAllowedOrigin(uri: string = getRedirectUri()): boolean {
  const { hostname, protocol } = new URL(uri)
  if (hostname === 'localhost') return false
  return protocol === 'https:' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export const SPOTIFY_CONFIG = {
  authEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  apiBaseUrl: 'https://api.spotify.com/v1',
  scopes: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-library-read',
    'user-library-modify',
    'user-read-private',
  ],
}

export function getClientId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setClientId(clientId: string): void {
  localStorage.setItem(STORAGE_KEY, clientId)
}

export function hasClientId(): boolean {
  return !!getClientId()
}
