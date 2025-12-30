import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, logout } from '../services/auth'
import { getUserPlaylists, getCurrentUser } from '../services/spotifyApi'
import { Playlist, SpotifyUser } from '../types/spotify'

export default function Playlists() {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
      return
    }

    loadData()
  }, [navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userData, playlistData] = await Promise.all([
        getCurrentUser(),
        getUserPlaylists(),
      ])
      setUser(userData)

      // Filter to only editable playlists (owned by user or collaborative)
      const editable = playlistData.filter(
        (p) => p.owner.id === userData.id || p.collaborative
      )
      setPlaylists(editable)
    } catch (err) {
      console.error('Failed to load playlists:', err)
      setError('Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-spotify-black">
      <header className="sticky top-0 bg-spotify-black/95 backdrop-blur border-b border-spotify-light-gray p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Your Playlists</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-spotify-subdued text-sm">{user.display_name}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-spotify-subdued hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {playlists.length === 0 ? (
          <p className="text-spotify-subdued text-center py-8">
            No editable playlists found
          </p>
        ) : (
          <div className="grid gap-2">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => navigate(`/editor/${playlist.id}`)}
                className="flex items-center gap-4 bg-spotify-dark-gray hover:bg-spotify-light-gray rounded-lg p-3 transition-colors text-left w-full"
              >
                {playlist.images[0] ? (
                  <img
                    src={playlist.images[0].url}
                    alt=""
                    className="w-14 h-14 rounded object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded bg-spotify-light-gray flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-spotify-subdued"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{playlist.name}</h3>
                  <p className="text-spotify-subdued text-sm">
                    {playlist.tracks.total} tracks
                    {playlist.collaborative && (
                      <span className="ml-2 text-spotify-green">Collaborative</span>
                    )}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-spotify-subdued"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
