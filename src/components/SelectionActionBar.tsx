interface SelectionActionBarProps {
  count: number
  onMoveToTop: () => void
  onMoveToBottom: () => void
  onRemove: () => void
  onClear: () => void
  accent?: 'green' | 'purple'
  /** Liked Songs can be removed from but never reordered. */
  canMove?: boolean
}

const ACCENT_BG = {
  green: 'bg-spotify-green',
  purple: 'bg-purple-500',
} as const

// `min-w-0` on the three action buttons is load-bearing: without it flex items
// refuse to shrink below their content, and the labels wrap to two lines at
// 390px. Do not drop it.
export default function SelectionActionBar({
  count,
  onMoveToTop,
  onMoveToBottom,
  onRemove,
  onClear,
  accent = 'green',
  canMove = true,
}: SelectionActionBarProps) {
  if (count === 0) return null

  return (
    <div className="fixed left-0 right-0 bottom-0 z-40 bg-spotify-dark-gray border-t border-white/5 safe-area-bottom">
      <div className="max-w-3xl mx-auto flex items-center gap-1.5 px-2.5 py-2">
        <span
          className={`flex-shrink-0 h-10 min-w-[2.5rem] px-2.5 rounded-[10px] ${ACCENT_BG[accent]} text-black text-sm font-bold flex items-center justify-center tabular-nums`}
        >
          {count}
        </span>

        {canMove && (
          <>
            <button
              onClick={onMoveToTop}
              className="flex-1 min-w-0 h-10 px-1 rounded-[10px] bg-white/10 active:bg-white/20 text-white text-sm font-bold flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden"
            >
              <span aria-hidden="true">⇡</span>Top
            </button>

            <button
              onClick={onMoveToBottom}
              className="flex-1 min-w-0 h-10 px-1 rounded-[10px] bg-white/10 active:bg-white/20 text-white text-sm font-bold flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden"
            >
              <span aria-hidden="true">⇣</span>Bottom
            </button>
          </>
        )}

        <button
          onClick={onRemove}
          className="flex-1 min-w-0 h-10 px-1 rounded-[10px] bg-red-500/20 active:bg-red-500/30 text-red-300 text-sm font-bold flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden"
        >
          <span aria-hidden="true">✕</span>Remove
        </button>

        <button
          onClick={onClear}
          aria-label="Clear selection"
          className="flex-shrink-0 w-10 h-10 rounded-[10px] bg-white/5 active:bg-white/10 text-spotify-subdued text-base flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
