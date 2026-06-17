import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Playlist } from '../types/spotify'

interface SortablePlaylistCardProps {
  playlist: Playlist
  onOpen: () => void
}

// A playlist card on the menu screen. The whole card is draggable (to reorder)
// and clickable (to open the editor) — a plain click opens it, while a
// click-drag (or press-and-hold on touch) rearranges it. The click-after-drag
// guard lives in the parent so dropping a card doesn't also open it.
export default function SortablePlaylistCard({
  playlist,
  onOpen,
}: SortablePlaylistCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: playlist.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Use the standalone `scale` property so it doesn't clobber dnd-kit's transform
    scale: isDragging ? 1.03 : 1,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 12px 40px rgba(0,0,0,0.5)' : undefined,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={`group bg-spotify-dark-gray/50 active:bg-spotify-light-gray/50 rounded-md sm:rounded-lg p-3 sm:p-4 transition-colors duration-200 text-left touch-manipulation select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Playlist cover */}
      <div className="relative aspect-square mb-2 sm:mb-4">
        {playlist.images[0] ? (
          <img
            src={playlist.images[0].url}
            alt=""
            draggable={false}
            className="w-full h-full object-cover rounded-md shadow-lg pointer-events-none"
          />
        ) : (
          <div className="w-full h-full rounded-md bg-spotify-light-gray flex items-center justify-center shadow-lg">
            <svg
              className="w-8 sm:w-12 h-8 sm:h-12 text-spotify-subdued"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}

        {/* Edit button overlay - hidden on touch devices */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hidden sm:block">
          <div className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
        </div>
      </div>

      {/* Playlist info */}
      <h3 className="text-white font-medium text-xs sm:text-sm truncate mb-0.5 sm:mb-1">
        {playlist.name}
      </h3>
      <p className="text-spotify-subdued text-[10px] sm:text-xs truncate">
        {playlist.tracks.total} tracks
        {playlist.collaborative && (
          <span className="text-spotify-green"> · Collab</span>
        )}
      </p>
    </button>
  )
}
