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
}: TrackItemProps) {
  if (!track.track) return null

  const { name, artists, album, duration_ms } = track.track
  const artistNames = artists.map((a) => a.name).join(', ')
  const albumArt = album.images[album.images.length - 1]?.url

  return (
    <div
      className={`
        flex items-center gap-3 px-2 py-2 rounded-md
        ${isDragOverlay ? 'bg-spotify-light-gray shadow-2xl shadow-black/50 border border-white/10' : ''}
        ${isSelected && !isDragOverlay ? 'bg-white/10' : ''}
      `}
    >
      {/* Checkbox placeholder for alignment */}
      <div className="w-4 h-4 flex-shrink-0" />

      {/* Album art */}
      {albumArt ? (
        <img src={albumArt} alt="" className="w-10 h-10 rounded flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-spotify-light-gray flex items-center justify-center flex-shrink-0">
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

      {/* Duration */}
      <span className="text-spotify-subdued text-xs flex-shrink-0 tabular-nums">
        {formatDuration(duration_ms)}
      </span>

      {/* Selected count badge */}
      {isDragOverlay && isSelected && selectedCount > 1 && (
        <span className="bg-spotify-green text-black text-xs font-bold px-2 py-0.5 rounded-full">
          {selectedCount}
        </span>
      )}

      {/* Drag handle placeholder */}
      {!isDragOverlay && <div className="w-6 flex-shrink-0" />}
    </div>
  )
}
