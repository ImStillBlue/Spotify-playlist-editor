import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRedirectUri, isSpotifyAllowedOrigin, REDIRECT_URIS } from './spotify'

function stubOrigin(origin: string | undefined) {
  vi.stubGlobal('location', origin === undefined ? undefined : { origin })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

// Spotify matches the redirect URI exactly and rejects both plain http and the
// `localhost` hostname, so a mismatch surfaces as a bare
// "INVALID_CLIENT: Insecure redirect URI" with no explanation.
describe('getRedirectUri', () => {
  it('derives the callback from the origin the app is served on', () => {
    stubOrigin('https://127.0.0.1:5173')
    expect(getRedirectUri()).toBe('https://127.0.0.1:5173/Spotify-playlist-editor/callback')
  })

  it('follows the page to the deployed host instead of a hardcoded domain', () => {
    stubOrigin('https://imstillblue.github.io')
    expect(getRedirectUri()).toBe(
      'https://imstillblue.github.io/Spotify-playlist-editor/callback'
    )
  })

  it('preserves a non-default port so the origin round-trips exactly', () => {
    stubOrigin('https://my-fork.example:8443')
    expect(getRedirectUri()).toBe(
      'https://my-fork.example:8443/Spotify-playlist-editor/callback'
    )
  })

  it('falls back to the registered constants when there is no location', () => {
    stubOrigin(undefined)
    vi.stubEnv('DEV', true)
    expect(getRedirectUri()).toBe(REDIRECT_URIS.local)
    vi.stubEnv('DEV', false)
    expect(getRedirectUri()).toBe(REDIRECT_URIS.live)
  })

  it('keeps the app subpath so the router basename still matches', () => {
    for (const uri of Object.values(REDIRECT_URIS)) {
      const { pathname } = new URL(uri)
      expect(pathname.startsWith('/Spotify-playlist-editor/callback')).toBe(true)
    }
  })
})

describe('isSpotifyAllowedOrigin', () => {
  it('accepts every URI this app registers', () => {
    for (const uri of Object.values(REDIRECT_URIS)) {
      expect(isSpotifyAllowedOrigin(uri)).toBe(true)
    }
  })

  it('rejects the localhost hostname, which Spotify refuses outright', () => {
    stubOrigin('https://localhost:5173')
    expect(isSpotifyAllowedOrigin()).toBe(false)
  })

  it('allows plain http on a loopback IP, which is Spotify\'s documented exception', () => {
    expect(isSpotifyAllowedOrigin('http://127.0.0.1:5173/callback')).toBe(true)
    expect(isSpotifyAllowedOrigin('http://[::1]:5173/callback')).toBe(true)
  })

  it('still rejects plain http on a routable host', () => {
    expect(isSpotifyAllowedOrigin('http://my-fork.example/callback')).toBe(false)
  })
})
