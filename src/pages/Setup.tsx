import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasClientId, setClientId } from '../config/spotify'
import { isLoggedIn } from '../services/auth'

export default function Setup() {
  const navigate = useNavigate()
  const [clientIdInput, setClientIdInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // If already set up and logged in, go to playlists
    if (hasClientId() && isLoggedIn()) {
      navigate('/playlists')
    } else if (hasClientId()) {
      navigate('/login')
    }
  }, [navigate])

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
          <h2 className="text-xl font-semibold text-white mb-4">Setup Required</h2>

          <p className="text-spotify-subdued mb-4">
            Due to Spotify API restrictions, you need to create your own Spotify Developer app.
            This is a one-time setup that takes about 2 minutes.
          </p>

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
                Set Redirect URI to:{' '}
                <code className="bg-spotify-black px-2 py-1 rounded text-xs break-all">
                  https://imstillblue.github.io/Spotify-playlist-editor/callback
                </code>
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
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
