import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TrackRow } from '../types/track'
import TrackRowView from './TrackRowView'

interface SortableTrackItemProps {
  row: TrackRow
  isSelected: boolean
  onToggleSelect: () => void
  selectedCount: number
  isActiveDrag: boolean
  titleHits?: readonly number[]
  artistHits?: readonly number[]
}

export default function SortableTrackItem({
  row,
  isSelected,
  onToggleSelect,
  selectedCount,
  isActiveDrag,
  titleHits,
  artistHits,
}: SortableTrackItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.key,
  })

  return (
    <div
      ref={setNodeRef}
      className="relative touch-pan-y"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        boxShadow: isDragging ? '0 10px 40px rgba(0,0,0,0.5)' : undefined,
      }}
    >
      <TrackRowView
        row={row}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        selectedCount={selectedCount}
        showDragHandle
        isActiveDrag={isActiveDrag}
        accentBgClass="bg-spotify-green"
        accentTextClass="text-spotify-green"
        accentTickClass="text-black"
        titleHits={titleHits}
        artistHits={artistHits}
      />
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-y-0 right-0 w-11"
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
