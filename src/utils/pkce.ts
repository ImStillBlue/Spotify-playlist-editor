// PKCE (Proof Key for Code Exchange) utilities for Spotify OAuth

function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  bytes.forEach((b) => (str += String.fromCharCode(b)))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generateCodeVerifier(): Promise<string> {
  return generateRandomString(64)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier)
  return base64UrlEncode(hashed)
}

export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem('pkce_code_verifier', verifier)
}

export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem('pkce_code_verifier')
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem('pkce_code_verifier')
}
