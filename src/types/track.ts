import type { Track } from './spotify'

export interface TrackRow {
  // Stable across filtering and reordering, which is what lets a selection
  // survive both. The source index is part of the key because a playlist may
  // contain the same song twice and the payloads are then identical.
  key: string
  track: Track
}
