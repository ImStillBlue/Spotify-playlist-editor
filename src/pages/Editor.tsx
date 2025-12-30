import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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
import TrackItem from '../components/TrackItem'

export default function Editor() {
  const navigate = useNavigate()
  const { playlistId } = useParams<{ playlistId: string }>()

  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [originalTracks, setOriginalTracks] = useState<PlaylistTrack[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const hasChanges = JSON.stringify(tracks) !== JSON.stringify(originalTracks)

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
      // Filter out null tracks (deleted tracks)
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

  const getTrackId = (track: PlaylistTrack, index: number): string => {
    return `${track.track?.id || 'unknown'}-${index}`
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = tracks.findIndex((t, i) => getTrackId(t, i) === active.id)
    const newIndex = tracks.findIndex((t, i) => getTrackId(t, i) === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // If dragging a selected item, move all selected items
    if (selectedIds.has(active.id as string) && selectedIds.size > 1) {
      // Get indices of all selected tracks
      const selectedIndices = tracks
        .map((t, i) => ({ track: t, index: i, id: getTrackId(t, i) }))
        .filter((item) => selectedIds.has(item.id))
        .map((item) => item.index)
        .sort((a, b) => a - b)

      // Remove selected tracks
      const remainingTracks = tracks.filter((_, i) => !selectedIndices.includes(i))
      const selectedTracks = selectedIndices.map((i) => tracks[i])

      // Calculate insert position
      let insertAt = remainingTracks.findIndex((t, i) => getTrackId(t, i) === over.id)
      if (insertAt === -1) insertAt = remainingTracks.length
      if (newIndex > oldIndex) insertAt++

      // Insert selected tracks at new position
      const newTracks = [
        ...remainingTracks.slice(0, insertAt),
        ...selectedTracks,
        ...remainingTracks.slice(insertAt),
      ]

      setTracks(newTracks)
    } else {
      // Single track drag
      setTracks(arrayMove(tracks, oldIndex, newIndex))
    }
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = () => {
    const allIds = tracks.map((t, i) => getTrackId(t, i))
    setSelectedIds(new Set(allIds))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const moveToTop = () => {
    if (selectedIds.size === 0) return
    const selected: PlaylistTrack[] = []
    const rest: PlaylistTrack[] = []
    tracks.forEach((t, i) => {
      if (selectedIds.has(getTrackId(t, i))) {
        selected.push(t)
      } else {
        rest.push(t)
      }
    })
    setTracks([...selected, ...rest])
    setSelectedIds(new Set())
  }

  const moveToBottom = () => {
    if (selectedIds.size === 0) return
    const selected: PlaylistTrack[] = []
    const rest: PlaylistTrack[] = []
    tracks.forEach((t, i) => {
      if (selectedIds.has(getTrackId(t, i))) {
        selected.push(t)
      } else {
        rest.push(t)
      }
    })
    setTracks([...rest, ...selected])
    setSelectedIds(new Set())
  }

  const removeSelected = () => {
    if (selectedIds.size === 0) return
    setTracks(tracks.filter((t, i) => !selectedIds.has(getTrackId(t, i))))
    setSelectedIds(new Set())
  }

  const handleSave = async () => {
    if (!playlistId || !hasChanges) return
    try {
      setSaving(true)
      const uris = tracks.map((t) => t.track!.uri)
      await replacePlaylistTracks(playlistId, uris)
      setOriginalTracks(tracks)
    } catch (err) {
      console.error('Failed to save:', err)
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setTracks(originalTracks)
    setSelectedIds(new Set())
  }

  const handleBack = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    navigate('/playlists')
  }

  const activeTrack = activeId
    ? tracks.find((t, i) => getTrackId(t, i) === activeId)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-spotify-black">
      <header className="sticky top-0 bg-spotify-black/95 backdrop-blur border-b border-spotify-light-gray z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={handleBack}
              className="text-spotify-subdued hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {playlist?.name}
              </h1>
              <p className="text-spotify-subdued text-sm">
                {tracks.length} tracks
                {hasChanges && (
                  <span className="ml-2 text-yellow-500">Unsaved changes</span>
                )}
              </p>
            </div>
            {hasChanges && (
              <div className="flex gap-2">
                <button
                  onClick={handleDiscard}
                  disabled={saving}
                  className="px-4 py-2 text-white hover:bg-spotify-light-gray rounded-full text-sm"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-spotify-green hover:bg-spotify-green-dark text-black font-semibold rounded-full text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-spotify-subdued text-sm">
                {selectedIds.size} selected
              </span>
              <button
                onClick={deselectAll}
                className="px-3 py-1 text-sm text-white hover:bg-spotify-light-gray rounded"
              >
                Deselect
              </button>
              <button
                onClick={moveToTop}
                className="px-3 py-1 text-sm text-white hover:bg-spotify-light-gray rounded"
              >
                Move to Top
              </button>
              <button
                onClick={moveToBottom}
                className="px-3 py-1 text-sm text-white hover:bg-spotify-light-gray rounded"
              >
                Move to Bottom
              </button>
              <button
                onClick={removeSelected}
                className="px-3 py-1 text-sm text-red-500 hover:bg-spotify-light-gray rounded"
              >
                Remove
              </button>
            </div>
          )}

          {selectedIds.size === 0 && tracks.length > 0 && (
            <button
              onClick={selectAll}
              className="text-spotify-subdued hover:text-white text-sm"
            >
              Select all
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tracks.map((t, i) => getTrackId(t, i))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {tracks.map((track, index) => {
                const id = getTrackId(track, index)
                return (
                  <SortableTrackItem
                    key={id}
                    id={id}
                    track={track}
                    index={index}
                    isSelected={selectedIds.has(id)}
                    onToggleSelect={() => toggleSelect(id)}
                    selectedCount={selectedIds.size}
                    isDragging={activeId === id}
                  />
                )
              })}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId && activeTrack && (
              <TrackItem
                track={activeTrack}
                isSelected={selectedIds.has(activeId)}
                selectedCount={selectedIds.has(activeId) ? selectedIds.size : 1}
                isDragOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  )
}
