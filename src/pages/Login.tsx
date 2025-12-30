import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasClientId } from '../config/spotify'
import { initiateLogin, isLoggedIn } from '../services/auth'

export default function Login() {
  const navigate = useNavigate()

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
    try {
      await initiateLogin()
    } catch (error) {
      console.error('Login failed:', error)
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

        <button
          onClick={() => navigate('/')}
          className="block mx-auto mt-4 text-spotify-subdued hover:text-white text-sm"
        >
          Change Client ID
        </button>
      </div>
    </div>
  )
}
