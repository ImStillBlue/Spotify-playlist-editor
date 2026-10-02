import { TrackRow } from '../types/track'
import { segmentByHits } from '../utils/trackSearch'

interface TrackRowViewProps {
  row: TrackRow
  isSelected: boolean
  onToggleSelect: () => void
  selectedCount: number
  showDragHandle: boolean
  isActiveDrag: boolean
  /** Background of the filled checkbox. */
  accentBgClass: string
  /** Colour of the selected title text. */
  accentTextClass: string
  /** Colour of the tick inside the filled checkbox. */
  accentTickClass: string
  titleHits?: readonly number[]
  artistHits?: readonly number[]
}

function Highlighted({ text, hits }: { text: string; hits: readonly number[] }) {
  const segments = segmentByHits(text, hits)
  if (segments.length === 1 && !segments[0].hit) return <>{text}</>
  return (
    <>
      {segments.map((s, i) =>
        s.hit ? (
          <mark key={i} className="bg-spotify-green/25 text-spotify-green rounded-sm">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
  )
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function TrackRowView({
  row,
  isSelected,
  onToggleSelect,
  selectedCount,
  showDragHandle,
  isActiveDrag,
  accentBgClass,
  accentTextClass,
  accentTickClass,
  titleHits = [],
  artistHits = [],
}: TrackRowViewProps) {
  const { name, artists, album, duration_ms } = row.track
  const artistNames = artists.map((a) => a.name).join(', ')
  const albumArt = album.images[album.images.length - 1]?.url

  return (
    <div
      className={`flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg ${
        isSelected ? 'bg-white/10' : 'active:bg-white/5'
      }`}
    >
      <button
        onClick={onToggleSelect}
        aria-pressed={isSelected}
        aria-label={isSelected ? `Deselect ${name}` : `Select ${name}`}
        className={`w-6 h-6 sm:w-5 sm:h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
          isSelected ? accentBgClass : 'border-2 border-spotify-subdued/60'
        }`}
      >
        {isSelected && (
          <svg
            className={`w-3.5 h-3.5 sm:w-3 sm:h-3 ${accentTickClass}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

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
        {isActiveDrag && (
          <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-spotify-green text-black text-xs font-bold rounded-full flex items-center justify-center">
            +{selectedCount - 1}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isSelected ? accentTextClass : 'text-white'}`}>
          <Highlighted text={name} hits={titleHits} />
        </p>
        <p className="text-spotify-subdued text-xs truncate">
          <Highlighted text={artistNames} hits={artistHits} />
        </p>
      </div>

      <span className="text-spotify-subdued text-xs flex-shrink-0 tabular-nums hidden xs:block">
        {formatDuration(duration_ms)}
      </span>

      {showDragHandle && (
        <div
          data-drag-handle
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
      )}
    </div>
  )
}
