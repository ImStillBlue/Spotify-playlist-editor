import { PlaylistTrack } from '../types/spotify'

interface LikedTrackItemProps {
  track: PlaylistTrack
  isSelected: boolean
  onToggleSelect: () => void
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// A row in the Liked Songs list. Unlike SortableTrackItem there is no drag
// handle — the Saved Tracks library can't be reordered, only added to / removed.
export default function LikedTrackItem({
  track,
  isSelected,
  onToggleSelect,
}: LikedTrackItemProps) {
  if (!track.track) return null

  const { name, artists, album, duration_ms } = track.track
  const artistNames = artists.map((a) => a.name).join(', ')
  const albumArt = album.images[album.images.length - 1]?.url

  return (
    <button
      type="button"
      onClick={onToggleSelect}
      className={`
        w-full text-left flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg transition-colors
        ${isSelected ? 'bg-white/10' : 'active:bg-white/5'}
      `}
    >
      {/* Checkbox - larger touch target on mobile */}
      <span
        className={`
          w-6 h-6 sm:w-5 sm:h-5 rounded flex items-center justify-center flex-shrink-0 transition-all
          ${isSelected
            ? 'bg-purple-500'
            : 'border-2 border-spotify-subdued/60'
          }
        `}
      >
        {isSelected && (
          <svg className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>

      {/* Album art */}
      <div className="relative flex-shrink-0">
        {albumArt ? (
          <img src={albumArt} alt="" className="w-12 h-12 sm:w-10 sm:h-10 rounded" />
        ) : (
          <div className="w-12 h-12 sm:w-10 sm:h-10 rounded bg-spotify-light-gray flex items-center justify-center">
            <svg className="w-5 h-5 text-spotify-subdued" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isSelected ? 'text-purple-300' : 'text-white'}`}>
          {name}
        </p>
        <p className="text-spotify-subdued text-xs truncate">{artistNames}</p>
      </div>

      {/* Duration - hide on very small screens */}
      <span className="text-spotify-subdued text-xs flex-shrink-0 tabular-nums hidden xs:block">
        {formatDuration(duration_ms)}
      </span>
    </button>
  )
}
