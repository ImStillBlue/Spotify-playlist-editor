import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// `npm run certs` writes a localhost CA plus leaf into .certs/. Spotify requires
// an https redirect URI, so the dev server has to speak TLS. The certs are
// gitignored, and a missing pair only downgrades dev to http rather than
// breaking the build.
const certDir = resolve(__dirname, '.certs')
const readCert = (name: string) => {
  try {
    return readFileSync(resolve(certDir, name))
  } catch {
    return undefined
  }
}

const key = readCert('localhost.key')
const cert = readCert('localhost.pem')

export default defineConfig({
  plugins: [react()],
  base: '/Spotify-playlist-editor/',
  server: {
    // Spotify bans the `localhost` hostname in redirect URIs, so local dev runs
    // on an explicit loopback IP. Vite's default host resolved to ::1 only,
    // which left 127.0.0.1 refusing connections.
    host: '127.0.0.1',
    // Spotify matches the redirect URI byte for byte, so a silent bump to 5174
    // would break login. Fail loudly instead of landing on an unregistered URI.
    port: 5173,
    strictPort: true,
    https: key && cert ? { key, cert } : undefined,
  },
})

