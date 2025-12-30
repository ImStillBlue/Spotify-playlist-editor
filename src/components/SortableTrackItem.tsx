import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PlaylistTrack } from '../types/spotify'

interface SortableTrackItemProps {
  id: number
  track: PlaylistTrack
  index: number
  isSelected: boolean
  onToggleSelect: () => void
  selectedCount: number
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function SortableTrackItem({
  id,
  track,
  isSelected,
  onToggleSelect,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Use dnd-kit's built-in isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide completely when dragging - dnd-kit manages this state properly
    opacity: isDragging ? 0 : 1,
  }

  if (!track.track) return null

  const { name, artists, album, duration_ms } = track.track
  const artistNames = artists.map((a) => a.name).join(', ')
  const albumArt = album.images[album.images.length - 1]?.url

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg transition-colors
        ${isSelected ? 'bg-white/10' : 'active:bg-white/5'}
      `}
    >
      {/* Checkbox - larger touch target on mobile */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect()
        }}
        className={`
          w-6 h-6 sm:w-5 sm:h-5 rounded flex items-center justify-center flex-shrink-0 transition-all
          ${isSelected
            ? 'bg-spotify-green'
            : 'border-2 border-spotify-subdued/60'
          }
        `}
      >
        {isSelected && (
          <svg className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Album art */}
      {albumArt ? (
        <img src={albumArt} alt="" className="w-12 h-12 sm:w-10 sm:h-10 rounded flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 sm:w-10 sm:h-10 rounded bg-spotify-light-gray flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-spotify-subdued" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isSelected ? 'text-spotify-green' : 'text-white'}`}>
          {name}
        </p>
        <p className="text-spotify-subdued text-xs truncate">{artistNames}</p>
      </div>

      {/* Duration - hide on very small screens */}
      <span className="text-spotify-subdued text-xs flex-shrink-0 tabular-nums hidden xs:block">
        {formatDuration(duration_ms)}
      </span>

      {/* Drag handle - larger touch target */}
      <div
        {...attributes}
        {...listeners}
        className="text-spotify-subdued active:text-white flex-shrink-0 p-2 -mr-2 touch-none cursor-grab active:cursor-grabbing"
      >
        <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </div>
    </div>
  )
}
