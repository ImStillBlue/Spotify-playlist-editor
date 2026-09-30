import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getValidAccessToken, isLoggedIn, saveTokenData } from './auth'
import { setClientId } from '../config/spotify'

const TOKEN_URL = 'https://accounts.spotify.com/api/token'

let tokenRequests = 0
let calls: Array<{ url: string; body: string }> = []

beforeEach(() => {
  localStorage.clear()
  setClientId('0123456789abcdef0123456789abcdef')
  tokenRequests = 0
  calls = []
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function storeExpiredToken() {
  saveTokenData({
    access_token: 'stale',
    refresh_token: 'refresh-1',
    expires_at: Date.now() - 1000,
  })
}

function stubFetch() {
  vi.stubGlobal('fetch', async () => {
    tokenRequests += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return new Response(
      JSON.stringify({ access_token: 'fresh', expires_in: 3600 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  })
}

describe('getValidAccessToken', () => {
  it('returns the stored token while it is still valid', async () => {
    saveTokenData({
      access_token: 'valid',
      refresh_token: 'refresh-1',
      expires_at: Date.now() + 3_600_000,
    })

    await expect(getValidAccessToken()).resolves.toBe('valid')
  })

  it('refreshes once and shares the result across concurrent callers', async () => {
    storeExpiredToken()
    stubFetch()

    const tokens = await Promise.all([
      getValidAccessToken(),
      getValidAccessToken(),
      getValidAccessToken(),
    ])

    // Spotify rotates the refresh token, so a second concurrent exchange would
    // invalidate the first and log the user out.
    expect(tokenRequests).toBe(1)
    expect(tokens).toEqual(['fresh', 'fresh', 'fresh'])
  })

  it('refreshes again on the next call once the new token is stored', async () => {
    storeExpiredToken()
    stubFetch()

    await getValidAccessToken()
    await getValidAccessToken()

    expect(tokenRequests).toBe(1)
  })

  it('reports a missing session instead of trying to refresh', async () => {
    await expect(getValidAccessToken()).rejects.toThrow(/not logged in/i)
    expect(isLoggedIn()).toBe(false)
  })

  it('posts the refresh grant to the token endpoint', async () => {
    storeExpiredToken()
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), body: String(init?.body) })
      return new Response(JSON.stringify({ access_token: 'fresh', expires_in: 3600 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    await getValidAccessToken()

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(TOKEN_URL)
    expect(calls[0].body).toContain('grant_type=refresh_token')
    expect(calls[0].body).toContain('refresh_token=refresh-1')
  })
})

describe('refresh failures', () => {
  it('clears the stored session when Spotify rejects the refresh', async () => {
    storeExpiredToken()
    vi.stubGlobal(
      'fetch',
      async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })
    )

    await expect(getValidAccessToken()).rejects.toThrow(/failed to refresh/i)
    expect(isLoggedIn()).toBe(false)
  })
})
