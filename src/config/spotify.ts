// Spotify OAuth configuration
// Client ID is provided by the user (BYOK model)

const STORAGE_KEY = 'spotify_client_id'

export const SPOTIFY_CONFIG = {
  authEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  apiBaseUrl: 'https://api.spotify.com/v1',
  redirectUri: 'https://imstillblue.github.io/Spotify-playlist-editor/callback',
  scopes: [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-library-read',
    'user-read-private',
  ],
}

export function getClientId(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setClientId(clientId: string): void {
  localStorage.setItem(STORAGE_KEY, clientId)
}

export function clearClientId(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasClientId(): boolean {
  return !!getClientId()
}
