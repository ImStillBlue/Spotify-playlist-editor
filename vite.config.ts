import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEV_ORIGIN = 'https://127.0.0.1:5173'

// `npm run certs` writes a CA plus leaf into .certs/. Spotify requires an https
// redirect URI, so the dev server has to speak TLS. The certs are gitignored,
// and a missing pair only downgrades dev to http rather than breaking the build.
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

// The leaf carries a DNS:localhost SAN purely so a stray localhost tab completes
// TLS and can be redirected to the canonical origin. Without it the browser
// hard-fails on chrome-error:// and the redirect never runs. The cost is that
// Vite prints one "Local:" line per DNS SAN, so the startup banner would
// advertise localhost as if it were usable. Dropping that line keeps the one
// supported URL on screen; the SAN stays.
function hideUnusableUrlFromBanner(): Plugin {
  return {
    name: 'hide-unusable-url-from-banner',
    apply: 'serve',
    configureServer(server) {
      const logger = server.config.logger
      const info = logger.info.bind(logger)
      logger.info = (msg, options) => {
        if (typeof msg === 'string' && /https?:\/\/[^/\s]*localhost/.test(msg)) {
          return
        }
        info(msg, options)
      }
    },
  }
}

// Spotify rejects the `localhost` hostname in redirect URIs, so a page served
// there can never finish a login. Left alone it is worse than a dead end: the
// browser gives it separate localStorage, so the client ID and token appear to
// vanish, and it looks like a bug rather than a hostname Spotify dislikes.
// Bouncing it to the one canonical origin keeps a stray localhost tab working.
function redirectLocalhostToLoopback(): Plugin {
  return {
    name: 'redirect-localhost-to-loopback',
    configureServer(server) {
      // Registered inline, not as a returned function: Vite runs returned hooks
      // in postHooks, which sit *after* htmlFallbackMiddleware, so the SPA
      // fallback would answer first and this would never see the request.
      server.middlewares.use((req, res, next) => {
        // Vite serves over HTTP/2, where the host arrives as :authority and
        // req.headers.host is undefined, so both have to be consulted.
        const authority = req.headers[':authority']
        const host = (Array.isArray(authority) ? authority[0] : authority) ?? req.headers.host ?? ''
        if (host.startsWith('localhost')) {
          res.writeHead(302, { location: `${DEV_ORIGIN}${req.url ?? '/'}` })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), redirectLocalhostToLoopback(), hideUnusableUrlFromBanner()],
  base: '/Spotify-playlist-editor/',
  server: {
    // Bind the explicit loopback IP rather than a hostname, so the origin the
    // app runs on is the same string that has to be registered with Spotify.
    host: '127.0.0.1',
    // Spotify matches the redirect URI byte for byte, so a silent bump to 5174
    // would break login. Fail loudly instead of landing on an unregistered URI.
    port: 5173,
    strictPort: true,
    https: key && cert ? { key, cert } : undefined,
  },
})

