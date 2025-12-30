import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleCallback } from '../services/auth'

export default function Callback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(`Authorization failed: ${errorParam}`)
      return
    }

    if (!code) {
      setError('No authorization code received')
      return
    }

    handleCallback(code)
      .then(() => {
        navigate('/playlists')
      })
      .catch((err) => {
        console.error('Callback error:', err)
        setError(err.message || 'Failed to complete login')
      })
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-spotify-black flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-spotify-green hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-spotify-black flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Logging in...</p>
      </div>
    </div>
  )
}
