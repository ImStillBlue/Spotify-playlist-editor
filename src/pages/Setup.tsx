import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { hasClientId, setClientId, getClientId, getRedirectUri, REDIRECT_URIS } from '../config/spotify'
import { isLoggedIn } from '../services/auth'

export default function Setup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditing = searchParams.get('edit') === 'true'

  // Pre-fill with existing client ID if available, otherwise use default
  const existingClientId = getClientId()
  // No baked-in default: Spotify's Development Mode allows one client ID per
  // developer, so prefilling someone else's app reliably fails for the next user.
  const [clientIdInput, setClientIdInput] = useState(existingClientId || '')
  const [error, setError] = useState('')

  useEffect(() => {
    // Skip auto-redirect if user is editing their client ID
    if (isEditing) return

    // If already set up and logged in, go to playlists
    if (hasClientId() && isLoggedIn()) {
      navigate('/playlists')
    } else if (hasClientId()) {
      navigate('/login')
    }
  }, [navigate, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = clientIdInput.trim()

    if (!trimmed) {
      setError('Please enter a Client ID')
      return
    }

    // Basic validation - Spotify client IDs are 32 hex characters
    if (!/^[a-f0-9]{32}$/i.test(trimmed)) {
      setError('Invalid Client ID format. It should be 32 characters.')
      return
    }

    setClientId(trimmed)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-spotify-black flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          Spotify Playlist Editor
        </h1>
        <p className="text-spotify-subdued text-center mb-8">
          Multi-select drag & drop for your playlists
        </p>

        <div className="bg-spotify-dark-gray rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {isEditing ? 'Change Client ID' : 'Setup Required'}
          </h2>

          <p className="text-spotify-subdued mb-4">
            Due to Spotify API restrictions, you need to create your own Spotify Developer app.
            This is a one-time setup that takes about 2 minutes. The account that creates the
            app must have Spotify Premium.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm">
            <p className="text-yellow-300">
              Spotify's Development Mode allows one client ID per developer and only 5 authorized
              users, so there is no shared default ID here. Create your own app and paste its
              Client ID above.
            </p>
          </div>

          <div className="bg-spotify-light-gray rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-3">Instructions:</h3>
            <ol className="text-spotify-subdued space-y-2 text-sm list-decimal list-inside">
              <li>
                Go to{' '}
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-spotify-green hover:underline"
                >
                  developer.spotify.com/dashboard
                </a>
              </li>
              <li>Log in with your Spotify account</li>
              <li>Click "Create App"</li>
              <li>Fill in any name and description</li>
              <li>
                Set Redirect URI to{' '}
                <code className="bg-spotify-black px-2 py-1 rounded text-xs break-all">
                  {getRedirectUri()}
                </code>
                {import.meta.env.DEV && (
                  <span className="block mt-1 text-xs">
                    Spotify rejects the <code className="bg-spotify-black px-1 rounded">localhost</code>{' '}
                    hostname, so local dev must register this exact 127.0.0.1 URI. Local dev uses a
                    self-signed certificate: run <code className="bg-spotify-black px-1 rounded">npm run certs</code>{' '}
                    once to generate and trust it. Register{' '}
                    <code className="bg-spotify-black px-1 rounded">{REDIRECT_URIS.live}</code> too so the deployed
                    site can log in.
                  </span>
                )}
              </li>
              <li>Check "Web API" under APIs used</li>
              <li>Accept the terms and click Save</li>
              <li>Copy the "Client ID" from your app's settings</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-white text-sm font-medium mb-2">
              Your Client ID
            </label>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => {
                setClientIdInput(e.target.value)
                setError('')
              }}
              placeholder="Paste your Client ID here"
              className="w-full bg-spotify-light-gray text-white rounded-lg px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-spotify-green"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              type="submit"
              className="w-full bg-spotify-green hover:bg-spotify-green-dark text-black font-semibold rounded-full py-3 transition-colors"
            >
              {isEditing ? 'Save & Continue' : 'Continue'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full mt-3 text-spotify-subdued hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
