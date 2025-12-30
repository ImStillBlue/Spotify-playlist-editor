# Spotify Playlist Editor - Project Checkpoint

**Date:** December 30, 2024
**Status:** MVP Complete - Web app with multi-select drag-and-drop working

---

## Project Overview

A web-based Spotify playlist editor with **multi-select drag-and-drop reordering** - the feature Spotify lacks. Users can select multiple songs and move them together as a group.

**Live URL:** https://imstillblue.github.io/Spotify-playlist-editor
**Repo:** https://github.com/ImStillBlue/Spotify-playlist-editor

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Drag & Drop | dnd-kit |
| Routing | react-router-dom |
| Hosting | GitHub Pages |

---

## Current Features (Working)

### Authentication
- OAuth 2.0 PKCE flow (client-side, no server)
- Token storage in localStorage
- Auto-refresh tokens
- Login/logout

### BYOK (Bring Your Own Key)
- Setup screen with instructions
- Pre-filled with temporary client ID: `c41e8c72e67141cbbf3f6765c06738b7`
- Users can enter their own client ID
- Validation before proceeding

### Playlist Browsing
- Grid layout (responsive 2-5 columns)
- Shows only editable playlists (owned OR collaborative)
- Playlist cover art, name, track count
- Spotify-style dark theme

### Playlist Editor
- Display all tracks with album art, title, artist, duration
- **Multi-select:** Tap checkbox to select multiple tracks
- **Drag reorder:** Drag handle to move single or multiple tracks
- **Move to Top/Bottom:** Quick actions for selected tracks
- **Remove tracks:** Mark for removal (local until save)
- **Save/Discard:** Commit or revert changes
- **Unsaved indicator:** Shows when changes pending
- **Exit protection:** Warns before leaving with unsaved changes

### Mobile Optimizations
- Touch-friendly targets (larger checkboxes, drag handles)
- TouchSensor with delay to prevent accidental drags
- Safe area padding for notched phones
- Responsive design (mobile-first)

---

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router setup
├── index.css                   # Global styles + Tailwind
├── config/
│   └── spotify.ts              # OAuth config, client ID storage
├── services/
│   ├── auth.ts                 # OAuth PKCE flow, token management
│   └── spotifyApi.ts           # All Spotify API calls
├── components/
│   └── SortableTrackItem.tsx   # Draggable track row
├── pages/
│   ├── Setup.tsx               # BYOK onboarding
│   ├── Login.tsx               # Login screen
│   ├── Callback.tsx            # OAuth callback handler
│   ├── Playlists.tsx           # Playlist browser (grid)
│   └── Editor.tsx              # Main editor with multi-select
├── utils/
│   └── pkce.ts                 # PKCE helpers
└── types/
    └── spotify.ts              # TypeScript interfaces
```

---

## Key Technical Decisions

### Drag & Drop
- Using dnd-kit with `useSortable`
- No DragOverlay (caused flash issues)
- `flushSync` used to prevent drop flash
- TouchSensor with 150ms delay for mobile

### State Management
- React useState/useEffect (no external lib)
- Selection tracked by indices (Set<number>)
- Changes are local until explicit Save

### API
- All calls batched (100 items per request)
- 100ms delay between batches for rate limiting
- Uses `PUT /playlists/{id}/tracks` for reordering

---

## Spotify API Config

**Redirect URI:** `https://imstillblue.github.io/Spotify-playlist-editor/callback`

**Scopes:**
- playlist-read-private
- playlist-read-collaborative
- playlist-modify-private
- playlist-modify-public
- user-library-read
- user-read-private

---

## GitHub Pages Setup

- Workflow file: `.github/workflows/deploy.yml`
- SPA routing fix: `public/404.html` redirects to index
- Base path configured in `vite.config.ts`

---

## Future Features (Not Implemented)

### Undo/Redo System
- [ ] Track all operations
- [ ] Undo/redo actions
- [ ] Visual indicator

### Search, Filter & Sort
- [ ] In-playlist search
- [ ] Filter by artist/album
- [ ] Quick sort options

### Additional Features
- [ ] Duplicate detection
- [ ] Playlist statistics
- [ ] Keyboard shortcuts (Ctrl+A, Delete, etc.)
- [ ] Shift+click for range select
- [ ] 30-second song previews

---

## Known Issues / Considerations

1. **Spotify Dev App Limitation:** Development mode limited to 25 users. Using BYOK model as workaround.

2. **Large Playlists:** Playlists with 1000+ tracks may feel slow during initial load.

3. **Flutter Archive:** Old Flutter code preserved in `flutter-archive` branch.

---

## How to Run Locally

```bash
npm install
npm run dev
```

## How to Build & Deploy

```bash
npm run build
# Push to main branch - GitHub Actions deploys automatically
```

---

## To Resume Development

Say: "Read CHECKPOINT.md and let's continue working on the Spotify playlist editor."

### Suggested Next Tasks
1. Add keyboard shortcuts (Ctrl+A select all, Delete to remove)
2. Add shift+click for range selection
3. Add in-playlist search
4. Add sort options (by artist, album, date added)
5. Add undo/redo functionality
