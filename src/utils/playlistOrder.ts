// Custom playlist ordering for the menu screen.
//
// Spotify's Web API has no endpoint to reorder the playlists in a user's
// library, so a custom arrangement can't be saved back to Spotify. Instead we
// persist the user's preferred order locally (per browser) and apply it to the
// list we fetch from the API.

const ORDER_KEY = 'spotify_playlist_order'

export function getSavedPlaylistOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function savePlaylistOrder(ids: string[]): void {
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids))
}

// Reorder fetched playlists to match the saved custom order. Playlists not in
// the saved order (e.g. newly created) are appended in their original API order.
export function applySavedOrder<T extends { id: string }>(
  items: T[],
  savedIds: string[]
): T[] {
  if (savedIds.length === 0) return items

  const remaining = new Map(items.map((item) => [item.id, item]))
  const ordered: T[] = []

  for (const id of savedIds) {
    const item = remaining.get(id)
    if (item) {
      ordered.push(item)
      remaining.delete(id)
    }
  }

  // Append any playlists that weren't in the saved order, preserving API order
  for (const item of items) {
    if (remaining.has(item.id)) ordered.push(item)
  }

  return ordered
}
