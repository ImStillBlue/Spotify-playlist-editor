import { TrackRow } from '../types/track'
import TrackRowView from './TrackRowView'

interface LikedTrackItemProps {
  row: TrackRow
  isSelected: boolean
  onToggleSelect: () => void
  titleHits?: readonly number[]
  artistHits?: readonly number[]
}

// A row in the Liked Songs list. Unlike SortableTrackItem there is no drag
// handle — the Saved Tracks library can't be reordered, only added to / removed.
export default function LikedTrackItem({
  row,
  isSelected,
  onToggleSelect,
  titleHits,
  artistHits,
}: LikedTrackItemProps) {
  return (
    <div className="w-full text-left">
      <TrackRowView
        row={row}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        selectedCount={0}
        showDragHandle={false}
        isActiveDrag={false}
        accentBgClass="bg-purple-500"
        accentTextClass="text-purple-300"
        accentTickClass="text-white"
        titleHits={titleHits}
        artistHits={artistHits}
      />
    </div>
  )
}
