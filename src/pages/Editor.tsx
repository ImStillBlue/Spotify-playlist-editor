import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { isLoggedIn } from '../services/auth'
import { getPlaylist, replacePlaylistTracks } from '../services/spotifyApi'
import { PlaylistDetails, PlaylistTrack } from '../types/spotify'
import SortableTrackItem from '../components/SortableTrackItem'

export default function Editor() {
  const navigate = useNavigate()
  const { playlistId } = useParams<{ playlistId: string }>()

  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [originalTracks, setOriginalTracks] = useState<PlaylistTrack[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const hasChanges = JSON.stringify(tracks.map(t => t.track?.uri)) !== JSON.stringify(originalTracks.map(t => t.track?.uri))

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
      return
    }
    if (playlistId) {
      loadPlaylist()
    }
  }, [playlistId, navigate])

  const loadPlaylist = async () => {
    if (!playlistId) return
    try {
      setLoading(true)
      const data = await getPlaylist(playlistId)
      setPlaylist(data)
      const validTracks = data.tracks.items.filter((t) => t.track !== null)
      setTracks(validTracks)
      setOriginalTracks(validTracks)
    } catch (err) {
      console.error('Failed to load playlist:', err)
      setError('Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = Number(active.id)
    const newIndex = Number(over.id)

    if (selectedIndices.has(oldIndex) && selectedIndices.size > 1) {
      // Multi-drag: move all selected tracks
      const selectedIdxArray = Array.from(selectedIndices).sort((a, b) => a - b)
      const selectedTracks = selectedIdxArray.map((i) => tracks[i])
      const remainingTracks = tracks.filter((_, i) => !selectedIndices.has(i))

      // Find where to insert
      let insertAt = remainingTracks.length
      for (let i = 0; i < remainingTracks.length; i++) {
        const originalIdx = tracks.indexOf(remainingTracks[i])
        if (originalIdx >= newIndex) {
          insertAt = i
          break
        }
      }

      const newTracks = [
        ...remainingTracks.slice(0, insertAt),
        ...selectedTracks,
        ...remainingTracks.slice(insertAt),
      ]

      setTracks(newTracks)
      setSelectedIndices(new Set())
    } else {
      setTracks(arrayMove(tracks, oldIndex, newIndex))
      setSelectedIndices(new Set())
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

  const deselectAll = () => {
    setSelectedIndices(new Set())
  }

  const moveToTop = () => {
    if (selectedIndices.size === 0) return
    const selectedIdxArray = Array.from(selectedIndices).sort((a, b) => a - b)
    const selected = selectedIdxArray.map((i) => tracks[i])
    const rest = tracks.filter((_, i) => !selectedIndices.has(i))
    setTracks([...selected, ...rest])
    setSelectedIndices(new Set())
  }

  const moveToBottom = () => {
    if (selectedIndices.size === 0) return
    const selectedIdxArray = Array.from(selectedIndices).sort((a, b) => a - b)
    const selected = selectedIdxArray.map((i) => tracks[i])
    const rest = tracks.filter((_, i) => !selectedIndices.has(i))
    setTracks([...rest, ...selected])
    setSelectedIndices(new Set())
  }

  const removeSelected = () => {
    if (selectedIndices.size === 0) return
    setTracks(tracks.filter((_, i) => !selectedIndices.has(i)))
    setSelectedIndices(new Set())
  }

  const handleSave = async () => {
    if (!playlistId || !hasChanges) return
    try {
      setSaving(true)
      const uris = tracks.map((t) => t.track!.uri)
      await replacePlaylistTracks(playlistId, uris)
      setOriginalTracks([...tracks])
      setSelectedIndices(new Set())
    } catch (err) {
      console.error('Failed to save:', err)
      setError('Failed to save changes')
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
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-spotify-black">
      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-b from-spotify-dark-gray to-spotify-black/95 backdrop-blur-sm z-10 safe-area-top">
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

            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                {playlist?.name}
              </h1>
              <p className="text-spotify-subdued text-xs">
                {tracks.length} tracks
                {hasChanges && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                    Unsaved
                  </span>
                )}
              </p>
            </div>

            {hasChanges && (
              <div className="flex gap-2">
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
                  className="px-4 sm:px-5 py-2 bg-spotify-green active:bg-spotify-green-dark text-black font-semibold rounded-full text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Selection toolbar - mobile optimized */}
          {selectedIndices.size > 0 && (
            <div className="mt-3 py-2 px-3 bg-spotify-light-gray/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  {selectedIndices.size} selected
                </span>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-sm text-spotify-subdued active:text-white active:bg-white/10 rounded-full transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={moveToTop}
                  className="flex-1 px-3 py-2.5 text-sm text-white bg-white/10 active:bg-white/20 rounded-lg transition-colors"
                >
                  Move to Top
                </button>
                <button
                  onClick={moveToBottom}
                  className="flex-1 px-3 py-2.5 text-sm text-white bg-white/10 active:bg-white/20 rounded-lg transition-colors"
                >
                  Move to Bottom
                </button>
                <button
                  onClick={removeSelected}
                  className="px-4 py-2.5 text-sm text-red-400 bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

        </div>
      </header>

      {/* Track list */}
      <main className="max-w-3xl mx-auto px-2 sm:px-4 pb-8 safe-area-bottom">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tracks.map((_, i) => i)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y divide-spotify-light-gray/30">
              {tracks.map((track, index) => (
                <SortableTrackItem
                  key={`${track.track?.id}-${index}`}
                  id={index}
                  track={track}
                  index={index}
                  isSelected={selectedIndices.has(index)}
                  onToggleSelect={() => toggleSelect(index)}
                  selectedCount={selectedIndices.size}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>
    </div>
  )
}
