import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../services/auth'
import { getLikedSongs, removeSavedTracks } from '../services/spotifyApi'
import { TrackRow } from '../types/track'
import { rankMatches, removeSelected, toTrackRows } from '../utils/trackSearch'
import LikedTrackItem from '../components/LikedTrackItem'
import SelectionActionBar from '../components/SelectionActionBar'

export default function LikedSongs() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<TrackRow[]>([])
  const [originalRows, setOriginalRows] = useState<TrackRow[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // The only edit possible on Liked Songs is removal, so "changed" simply means
  // the current list is shorter than what we loaded.
  const removedCount = originalRows.length - rows.length
  const hasChanges = removedCount > 0
  const allSelected = rows.length > 0 && selectedKeys.size === rows.length

  const matches = useMemo(() => rankMatches(rows, query), [rows, query])

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
      const validRows = toTrackRows(items, (i) => i.track)
      setRows(validRows)
      setOriginalRows(validRows)
    } catch (err) {
      console.error('Failed to load liked songs:', err)
      setError('Failed to load liked songs')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const toggleSelectAll = () => {
    setSelectedKeys((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.key))
    )
  }

  const deselectAll = () => {
    setSelectedKeys(new Set())
  }

  const removeSelectedTracks = () => {
    if (selectedKeys.size === 0) return
    setRows((prev) => removeSelected(prev, selectedKeys))
    setSelectedKeys(new Set())
  }

  const handleSave = async () => {
    if (!hasChanges) return

    const currentUris = new Set(rows.map((r) => r.track.uri))
    const removedUris = originalRows
      .filter((r) => !currentUris.has(r.track.uri))
      .map((r) => r.track.uri)

    if (removedUris.length === 0) return

    if (
      !confirm(
        `Remove ${removedUris.length} song${removedUris.length !== 1 ? 's' : ''} from your Liked Songs? This can't be undone.`
      )
    ) {
      return
    }

    try {
      setSaving(true)
      setError('')
      await removeSavedTracks(removedUris)
      setOriginalRows([...rows])
      setSelectedKeys(new Set())
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
    setRows([...originalRows])
    setSelectedKeys(new Set())
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
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-spotify-black">
      <header className="flex-shrink-0 bg-gradient-to-b from-indigo-900 to-purple-900 safe-area-top z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              aria-label="Back to playlists"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white active:bg-black/60 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">Liked Songs</h1>
              <p className="text-spotify-subdued text-xs flex items-center">
                {rows.length} song{rows.length !== 1 ? 's' : ''}
                <span
                  className={`ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs transition-all duration-200 overflow-hidden ${
                    hasChanges ? 'opacity-100 scale-100' : 'opacity-0 scale-75 w-0 ml-0 px-0'
                  }`}
                >
                  {removedCount} to remove
                </span>
              </p>
            </div>

            <div
              className={`flex gap-2 transition-all duration-200 overflow-hidden ${
                hasChanges ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none w-0'
              }`}
            >
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

          {rows.length > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="text-sm text-white/80 px-2 py-1 -ml-2 rounded-full active:bg-white/10 transition-colors"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          )}

          <div className="mt-2">
            <label className="flex items-center gap-2 h-9 px-3 rounded-full bg-black">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs or artists"
                aria-label="Search songs or artists"
                className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-white/50"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-white/25 text-white text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </label>
            {query.trim() !== '' && (
              <p className="mt-1.5 text-xs text-white/60">
                {matches.length} of {rows.length} songs
              </p>
            )}
          </div>
        </div>
      </header>

      <main
        className={`flex-1 min-h-0 overflow-y-auto overscroll-none ${
          selectedKeys.size > 0 ? 'pb-24' : 'pb-4'
        }`}
      >
        {error && (
          <div className="max-w-3xl mx-auto px-2 sm:px-4">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 my-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-2 sm:px-4">
          {rows.length === 0 ? (
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
            <>
              <div className="divide-y divide-spotify-light-gray/30">
                {matches.map(({ row, titleHits, artistHits }) => (
                  <LikedTrackItem
                    key={row.key}
                    row={row}
                    isSelected={selectedKeys.has(row.key)}
                    onToggleSelect={() => toggleSelect(row.key)}
                    titleHits={titleHits}
                    artistHits={artistHits}
                  />
                ))}
              </div>
              {matches.length === 0 && (
                <p className="py-10 text-center text-spotify-subdued text-sm">
                  No songs match that.
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <SelectionActionBar
        count={selectedKeys.size}
        onMoveToTop={() => {}}
        onMoveToBottom={() => {}}
        onRemove={removeSelectedTracks}
        onClear={deselectAll}
        accent="purple"
        canMove={false}
      />
    </div>
  )
}
