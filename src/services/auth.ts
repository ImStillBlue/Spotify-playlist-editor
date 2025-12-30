import { SPOTIFY_CONFIG, getClientId } from '../config/spotify'
import { TokenData } from '../types/spotify'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  storeCodeVerifier,
  getStoredCodeVerifier,
  clearCodeVerifier,
} from '../utils/pkce'

const TOKEN_STORAGE_KEY = 'spotify_token_data'

export async function initiateLogin(): Promise<void> {
  const clientId = getClientId()
  if (!clientId) {
    throw new Error('No client ID configured')
  }

  const verifier = await generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  storeCodeVerifier(verifier)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    scope: SPOTIFY_CONFIG.scopes.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `${SPOTIFY_CONFIG.authEndpoint}?${params.toString()}`
}

export async function handleCallback(code: string): Promise<TokenData> {
  const clientId = getClientId()
  const verifier = getStoredCodeVerifier()

  if (!clientId) {
    throw new Error('No client ID configured')
  }
  if (!verifier) {
    throw new Error('No code verifier found')
  }

  const response = await fetch(SPOTIFY_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
      code_verifier: verifier,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error_description || 'Failed to exchange code for token')
  }

  const data = await response.json()
  clearCodeVerifier()

  const tokenData: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }

  saveTokenData(tokenData)
  return tokenData
}

export async function refreshAccessToken(): Promise<TokenData> {
  const clientId = getClientId()
  const currentToken = getTokenData()

  if (!clientId) {
    throw new Error('No client ID configured')
  }
  if (!currentToken?.refresh_token) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(SPOTIFY_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: currentToken.refresh_token,
    }),
  })

  if (!response.ok) {
    clearTokenData()
    throw new Error('Failed to refresh token')
  }

  const data = await response.json()

  const tokenData: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || currentToken.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }

  saveTokenData(tokenData)
  return tokenData
}

export function saveTokenData(tokenData: TokenData): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData))
}

export function getTokenData(): TokenData | null {
  const data = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function clearTokenData(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function isLoggedIn(): boolean {
  const tokenData = getTokenData()
  return !!tokenData?.access_token
}

export function isTokenExpired(): boolean {
  const tokenData = getTokenData()
  if (!tokenData) return true
  // Consider expired if less than 5 minutes remaining
  return tokenData.expires_at < Date.now() + 5 * 60 * 1000
}

export async function getValidAccessToken(): Promise<string> {
  if (isTokenExpired()) {
    const newToken = await refreshAccessToken()
    return newToken.access_token
  }
  const tokenData = getTokenData()
  if (!tokenData) {
    throw new Error('Not logged in')
  }
  return tokenData.access_token
}

export function logout(): void {
  clearTokenData()
}
