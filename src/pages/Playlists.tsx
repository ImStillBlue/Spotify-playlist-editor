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
    <div className="min-h-screen bg-gradient-to-b from-spotify-dark-gray to-spotify-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-spotify-black/80 backdrop-blur-md safe-area-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm sm:text-base">Playlist Editor</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-spotify-light-gray rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user.display_name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <span className="text-white text-sm font-medium hidden sm:block">
                  {user.display_name}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-spotify-subdued active:text-white text-sm transition-colors px-2 py-1"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 safe-area-bottom">
        {/* Page title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Your Playlists
          </h1>
          <p className="text-spotify-subdued text-xs sm:text-sm mt-1">
            {playlists.length} editable playlist{playlists.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 sm:mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {playlists.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 bg-spotify-light-gray rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-spotify-subdued" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <p className="text-spotify-subdued">No editable playlists found</p>
            <p className="text-spotify-subdued/60 text-sm mt-1">
              Create a playlist on Spotify to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => navigate(`/editor/${playlist.id}`)}
                className="group bg-spotify-dark-gray/50 active:bg-spotify-light-gray/50 rounded-md sm:rounded-lg p-3 sm:p-4 transition-all duration-200 text-left"
              >
                {/* Playlist cover */}
                <div className="relative aspect-square mb-2 sm:mb-4">
                  {playlist.images[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt=""
                      className="w-full h-full object-cover rounded-md shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-md bg-spotify-light-gray flex items-center justify-center shadow-lg">
                      <svg
                        className="w-8 sm:w-12 h-8 sm:h-12 text-spotify-subdued"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}

                  {/* Play button overlay - hidden on touch devices */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hidden sm:block">
                    <div className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                      <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Playlist info */}
                <h3 className="text-white font-medium text-xs sm:text-sm truncate mb-0.5 sm:mb-1">
                  {playlist.name}
                </h3>
                <p className="text-spotify-subdued text-[10px] sm:text-xs truncate">
                  {playlist.tracks.total} tracks
                  {playlist.collaborative && (
                    <span className="text-spotify-green"> · Collab</span>
                  )}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
