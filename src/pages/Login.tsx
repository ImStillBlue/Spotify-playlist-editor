import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasClientId, getRedirectUri, isSpotifyAllowedOrigin } from '../config/spotify'
import { initiateLogin, isLoggedIn } from '../services/auth'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasClientId()) {
      navigate('/')
      return
    }
    if (isLoggedIn()) {
      navigate('/playlists')
    }
  }, [navigate])

  const handleLogin = async () => {
    setError('')
    try {
      await initiateLogin()
    } catch (err) {
      // Spotify's own "Insecure" response names no cause, so surface ours.
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-spotify-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Spotify Playlist Editor
        </h1>
        <p className="text-spotify-subdued mb-8">
          Multi-select drag & drop for your playlists
        </p>

        <button
          onClick={handleLogin}
          className="bg-spotify-green hover:bg-spotify-green-dark text-black font-semibold rounded-full px-8 py-3 transition-colors"
        >
          Log in with Spotify
        </button>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-left text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 text-left text-xs text-spotify-subdued space-y-1">
          <p>
            Redirect URI sent to Spotify
            {!isSpotifyAllowedOrigin() && (
              <span className="text-red-400"> (Spotify will reject this!)</span>
            )}
            :
          </p>
          <code className="block break-all rounded bg-spotify-light-gray px-2 py-1 text-spotify-green">
            {getRedirectUri()}
          </code>
          <p>
            Spotify rejects the <code className="bg-spotify-black px-1 rounded">localhost</code> hostname
            in redirect URIs. Local development must use the 127.0.0.1 URL above, registered
            exactly as shown.
          </p>
        </div>

        <button
          onClick={() => navigate('/?edit=true')}
          className="block mx-auto mt-4 text-spotify-subdued hover:text-white text-sm transition-colors"
        >
          Change Client ID
        </button>
      </div>
    </div>
  )
}
