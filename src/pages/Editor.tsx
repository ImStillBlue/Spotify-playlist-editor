import { useEffect, useMemo, useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { isLoggedIn } from '../services/auth'
import { getPlaylist, replacePlaylistItems } from '../services/spotifyApi'
import { Playlist } from '../types/spotify'
import { TrackRow } from '../types/track'
import {
  moveSelectedTo,
  moveSelectedToBottom,
  moveSelectedToTop,
  rankMatches,
  removeSelected,
  reorderRows,
  toTrackRows,
} from '../utils/trackSearch'
import SortableTrackItem from '../components/SortableTrackItem'
import TrackRowView from '../components/TrackRowView'
import SelectionActionBar from '../components/SelectionActionBar'

export default function Editor() {
  const navigate = useNavigate()
  const { playlistId } = useParams<{ playlistId: string }>()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [rows, setRows] = useState<TrackRow[]>([])
  const [originalRows, setOriginalRows] = useState<TrackRow[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')

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

  const hasChanges = useMemo(
    () => JSON.stringify(rows.map((r) => r.track.uri)) !== JSON.stringify(originalRows.map((r) => r.track.uri)),
    [rows, originalRows]
  )

  // Filtering derives a display list; it never mutates the rows themselves, so a
  // selection made while filtered still refers to the same songs afterwards.
  const matches = useMemo(() => rankMatches(rows, query), [rows, query])

  const activeRow = useMemo(
    () => (activeDragKey ? rows.find((r) => r.key === activeDragKey) ?? null : null),
    [activeDragKey, rows]
  )

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
      // Since Feb 2026 the contents live under `items`, and are only returned
      // for playlists the user owns or collaborates on.
      const validRows = toTrackRows(data.items?.items ?? [], (t) => t.item)
      setRows(validRows)
      setOriginalRows(validRows)
    } catch (err) {
      console.error('Failed to load playlist:', err)
      setError('Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragKey(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragKey(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeKey = String(active.id)
    const overKey = String(over.id)

    // Use flushSync to force synchronous DOM update, preventing flash
    flushSync(() => {
      if (selectedKeys.has(activeKey) && selectedKeys.size > 1) {
        setRows((prev) => moveSelectedTo(prev, selectedKeys, overKey))
      } else {
        setRows((prev) => reorderRows(prev, activeKey, overKey))
      }
    })
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

  const deselectAll = () => {
    setSelectedKeys(new Set())
  }

  const moveToTop = () => {
    if (selectedKeys.size === 0) return
    setRows((prev) => moveSelectedToTop(prev, selectedKeys))
    setSelectedKeys(new Set())
  }

  const moveToBottom = () => {
    if (selectedKeys.size === 0) return
    setRows((prev) => moveSelectedToBottom(prev, selectedKeys))
    setSelectedKeys(new Set())
  }

  const removeSelectedTracks = () => {
    if (selectedKeys.size === 0) return
    setRows((prev) => removeSelected(prev, selectedKeys))
    setSelectedKeys(new Set())
  }

  const handleSave = async () => {
    if (!playlistId || !hasChanges) return
    try {
      setSaving(true)
      const uris = rows.map((r) => r.track.uri)
      await replacePlaylistItems(playlistId, uris)
      setOriginalRows([...rows])
      setSelectedKeys(new Set())
    } catch (err) {
      console.error('Failed to save:', err)
      setError('Failed to save changes')
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
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Spotify only returns playlist contents for playlists the current user owns
  // or collaborates on — for anything else the `items` object is absent.
  if (playlist && !playlist.items) {
    return (
      <div className="min-h-screen bg-spotify-black flex flex-col items-center justify-center p-4">
        <p className="text-spotify-subdued text-center mb-4">
          This playlist's contents aren't available to your account. Only
          playlists you own or collaborate on can be edited.
        </p>
        <button
          onClick={() => navigate('/playlists')}
          className="px-5 py-2 bg-spotify-green active:bg-spotify-green-dark text-black font-semibold rounded-full text-sm transition-colors"
        >
          Back to playlists
        </button>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-spotify-black">
      <header className="flex-shrink-0 bg-spotify-dark-gray safe-area-top z-10">
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
              <p className="text-spotify-subdued text-xs flex items-center">
                {rows.length} tracks
                <span className={`ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs transition-all duration-200 overflow-hidden ${hasChanges ? 'opacity-100 scale-100' : 'opacity-0 scale-75 w-0 ml-0 px-0'}`}>
                  Unsaved
                </span>
              </p>
            </div>

            <div className={`flex gap-2 transition-all duration-200 overflow-hidden ${hasChanges ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none w-0'}`}>
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
          </div>

          <div className="px-4 pb-3 sm:px-4">
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
                className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-spotify-subdued"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-spotify-lighter-gray text-black text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </label>
            {query.trim() !== '' && (
              <p className="mt-1.5 text-xs text-spotify-subdued">
                {matches.length} of {rows.length} songs
              </p>
            )}
          </div>
        </div>
      </header>

      <main
        className={`flex-1 min-h-0 overflow-y-auto overscroll-none ${selectedKeys.size > 0 ? 'pb-24' : 'pb-4'}`}
      >
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={matches.map((m) => m.row.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-w-3xl mx-auto px-2 sm:px-4">
              <div className="divide-y divide-spotify-light-gray/30">
                {matches.map(({ row, titleHits, artistHits }) => (
                  <SortableTrackItem
                    key={row.key}
                    row={row}
                    isSelected={selectedKeys.has(row.key)}
                    onToggleSelect={() => toggleSelect(row.key)}
                    selectedCount={selectedKeys.size}
                    isActiveDrag={activeDragKey === row.key && selectedKeys.has(row.key) && selectedKeys.size > 1}
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
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeRow && (
              <div className="rounded-lg bg-spotify-light-gray shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <TrackRowView
                  row={activeRow}
                  isSelected
                  onToggleSelect={() => {}}
                  selectedCount={selectedKeys.size}
                  showDragHandle={false}
                  isActiveDrag={false}
                  accentBgClass="bg-spotify-green"
                  accentTextClass="text-spotify-green"
                  accentTickClass="text-black"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      <SelectionActionBar
        count={selectedKeys.size}
        onMoveToTop={moveToTop}
        onMoveToBottom={moveToBottom}
        onRemove={removeSelectedTracks}
        onClear={deselectAll}
      />
    </div>
  )
}
