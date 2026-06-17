import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../services/auth'
import { getLikedSongs, removeSavedTracks } from '../services/spotifyApi'
import { PlaylistTrack } from '../types/spotify'
import LikedTrackItem from '../components/LikedTrackItem'

export default function LikedSongs() {
  const navigate = useNavigate()

  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [originalTracks, setOriginalTracks] = useState<PlaylistTrack[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // The only edit possible on Liked Songs is removal, so "changed" simply means
  // the current list is shorter than what we loaded.
  const removedCount = originalTracks.length - tracks.length
  const hasChanges = removedCount > 0
  const allSelected = tracks.length > 0 && selectedIndices.size === tracks.length

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
      return
    }
    loadLikedSongs()
  }, [navigate])

  const loadLikedSongs = async () => {
    try {
      setLoading(true)
      const items = await getLikedSongs()
      const validTracks = items.filter((t) => t.track !== null)
      setTracks(validTracks)
      setOriginalTracks(validTracks)
    } catch (err) {
      console.error('Failed to load liked songs:', err)
      setError('Failed to load liked songs')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const toggleSelectAll = () => {
    setSelectedIndices((prev) =>
      prev.size === tracks.length ? new Set() : new Set(tracks.map((_, i) => i))
    )
  }

  const deselectAll = () => {
    setSelectedIndices(new Set())
  }

  const removeSelected = () => {
    if (selectedIndices.size === 0) return
    setTracks(tracks.filter((_, i) => !selectedIndices.has(i)))
    setSelectedIndices(new Set())
  }

  const handleSave = async () => {
    if (!hasChanges) return

    const currentIds = new Set(tracks.map((t) => t.track!.id))
    const removedIds = originalTracks
      .filter((t) => t.track && !currentIds.has(t.track.id))
      .map((t) => t.track!.id)

    if (removedIds.length === 0) return

    if (
      !confirm(
        `Remove ${removedIds.length} song${removedIds.length !== 1 ? 's' : ''} from your Liked Songs? This can't be undone.`
      )
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')
      await removeSavedTracks(removedIds)
      setOriginalTracks([...tracks])
      setSelectedIndices(new Set())
    } catch (err) {
      console.error('Failed to save:', err)
      if ((err as { status?: number })?.status === 403) {
        setError(
          'Spotify denied permission to edit your library. Log out and log back in to grant access, then try again.'
        )
      } else {
        setError('Failed to remove songs')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setTracks([...originalTracks])
    setSelectedIndices(new Set())
  }

  const handleBack = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    navigate('/playlists')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-spotify-black">
      {/* Header - distinct purple/blue identity for Liked Songs */}
      <header className="sticky top-0 bg-gradient-to-b from-indigo-900 via-purple-900/90 to-spotify-black/95 backdrop-blur-sm z-10 safe-area-top">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Top row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white active:bg-black/60 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Liked Songs heart tile */}
            <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                Liked Songs
              </h1>
              <p className="text-spotify-subdued text-xs flex items-center">
                {tracks.length} song{tracks.length !== 1 ? 's' : ''}
                <span className={`ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs transition-all duration-200 ${hasChanges ? 'opacity-100 scale-100' : 'opacity-0 scale-75 w-0 ml-0 px-0'}`}>
                  {removedCount} to remove
                </span>
              </p>
            </div>

            <div className={`flex gap-2 transition-all duration-200 ${hasChanges ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none w-0'}`}>
              <button
                onClick={handleDiscard}
                disabled={saving}
                className="px-3 sm:px-4 py-2 text-white text-sm active:bg-white/10 rounded-full transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 sm:px-5 py-2 bg-purple-500 active:bg-purple-600 text-white font-semibold rounded-full text-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Removing...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Select all row */}
          {tracks.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="text-sm text-spotify-subdued active:text-white px-2 py-1 -ml-2 rounded-full transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-spotify-subdued text-xs">
                Tap a song to select
              </span>
            </div>
          )}

          {/* Selection toolbar - smooth show/hide like the playlist editor */}
          <div
            className="grid transition-all duration-200 ease-out"
            style={{ gridTemplateRows: selectedIndices.size > 0 ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className={`mt-3 py-2 px-3 bg-spotify-light-gray/50 rounded-lg transition-opacity duration-200 ${selectedIndices.size > 0 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    {selectedIndices.size} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={deselectAll}
                      className="px-3 py-1.5 text-sm text-spotify-subdued active:text-white active:bg-white/10 rounded-full transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={removeSelected}
                      className="px-4 py-1.5 text-sm text-red-400 bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Track list */}
      <main className="max-w-3xl mx-auto px-2 sm:px-4 pb-8 safe-area-bottom">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 my-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <p className="text-spotify-subdued">No liked songs</p>
            <p className="text-spotify-subdued/60 text-sm mt-1">
              Songs you like on Spotify will show up here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-spotify-light-gray/30">
            {tracks.map((track, index) => (
              <LikedTrackItem
                key={`${track.track?.id}-${index}`}
                track={track}
                isSelected={selectedIndices.has(index)}
                onToggleSelect={() => toggleSelect(index)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
