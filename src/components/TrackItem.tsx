import { PlaylistTrack } from '../types/spotify'

interface TrackItemProps {
  track: PlaylistTrack
  index?: number
  isSelected: boolean
  selectedCount?: number
  isDragOverlay?: boolean
  onToggleSelect?: () => void
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function TrackItem({
  track,
  isSelected,
  selectedCount = 1,
  isDragOverlay = false,
  onToggleSelect,
}: TrackItemProps) {
  if (!track.track) return null

  const { name, artists, album, duration_ms } = track.track
  const artistNames = artists.map((a) => a.name).join(', ')
  const albumArt = album.images[album.images.length - 1]?.url

  return (
    <div
      className={`
        flex items-center gap-3 p-2 rounded-lg
        ${isDragOverlay ? 'bg-spotify-light-gray shadow-xl' : ''}
        ${isSelected && !isDragOverlay ? 'bg-spotify-light-gray/50' : ''}
      `}
    >
      {!isDragOverlay && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect?.()
          }}
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
            ${isSelected
              ? 'bg-spotify-green border-spotify-green'
              : 'border-spotify-subdued hover:border-white'
            }
          `}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {albumArt ? (
        <img src={albumArt} alt="" className="w-10 h-10 rounded flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-spotify-lighter-gray flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm truncate">{name}</p>
        <p className="text-spotify-subdued text-xs truncate">{artistNames}</p>
      </div>

      <span className="text-spotify-subdued text-xs flex-shrink-0">
        {formatDuration(duration_ms)}
      </span>

      {isDragOverlay && isSelected && selectedCount > 1 && (
        <span className="bg-spotify-green text-black text-xs font-semibold px-2 py-1 rounded-full">
          {selectedCount}
        </span>
      )}

      {!isDragOverlay && (
        <div className="text-spotify-subdued hover:text-white cursor-grab flex-shrink-0 p-1">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
      )}
    </div>
  )
}
