# Spotify Playlist Editor - Web App

## Purpose

A web-based tool for advanced Spotify playlist management. The core feature that Spotify lacks: **multi-select drag-and-drop reordering** - select multiple songs and move them together as a group.

Built as a static site (GitHub Pages) using the "Bring Your Own Key" model - each user provides their own Spotify API credentials, avoiding quota limits and app store approvals.

---

## Target Users

- Spotify users frustrated with single-track-at-a-time reordering
- People who want to organize large playlists efficiently
- Power users who want more control over their playlists

---

## Core Features (MVP)

### Authentication
- [ ] OAuth 2.0 PKCE flow (client-side, no server needed)
- [ ] Secure token storage (localStorage/sessionStorage)
- [ ] Auto-refresh tokens
- [ ] Login/logout

### BYOK Setup (First-Time Flow)
- [ ] Step-by-step instructions to create Spotify Developer app
- [ ] User enters their Client ID
- [ ] Validation before proceeding
- [ ] Store Client ID locally

### Playlist Browsing
- [ ] View user's editable playlists (owned OR collaborative)
- [ ] Display playlist cover art, name, owner, track count
- [ ] Filter out playlists user can't edit

### Playlist Editor (Core Differentiator)
- [ ] Display all tracks with album art, title, artist, album
- [ ] **Multi-select:** Click/tap to select multiple tracks
- [ ] **Multi-drag:** Drag any selected track to move ALL selected tracks together
- [ ] **Move to Top/Bottom:** Quick actions for selected tracks
- [ ] **Remove tracks:** Mark for removal (local until save)
- [ ] **Save changes:** Commit all changes to Spotify API
- [ ] **Discard changes:** Revert to original order
- [ ] **Unsaved indicator:** Visual feedback when changes pending
- [ ] **Exit protection:** Warn before leaving with unsaved changes

---

## Future Features (Post-MVP)

### Undo/Redo System
- [ ] Track all operations (reorder, delete)
- [ ] Undo/redo actions
- [ ] Visual indicator for undo availability

### Search, Filter & Sort
- [ ] In-playlist search by title/artist/album
- [ ] Filter by artist or album
- [ ] Quick sort (by artist, album, date added, duration, title)

### Additional Features
- [ ] Duplicate detection
- [ ] Playlist statistics (total duration, top artists, genres)
- [ ] 30-second song previews
- [ ] Keyboard shortcuts (Ctrl+A select all, Delete to remove, etc.)
- [ ] Bulk select (shift+click for range)

### Polish
- [ ] Responsive design (mobile + desktop)
- [ ] Offline detection/handling
- [ ] Performance optimization for large playlists (1000+ tracks)
- [ ] Loading skeletons
- [ ] Error handling with retry options

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | React + Vite |
| Language | TypeScript |
| Styling | TBD (Tailwind CSS / CSS Modules / styled-components) |
| State Management | TBD (React Context / Zustand / Jotai) |
| HTTP Client | fetch / axios |
| Drag & Drop | TBD (dnd-kit / react-beautiful-dnd) |
| Hosting | GitHub Pages |

---

## Spotify API Details

**OAuth Flow:** PKCE (Proof Key for Code Exchange) - no client secret needed

**Required Scopes:**
- `playlist-read-private`
- `playlist-read-collaborative`
- `playlist-modify-private`
- `playlist-modify-public`
- `user-library-read`
- `user-read-private`

**Key Endpoints:**
- `GET /me/playlists` - List user's playlists
- `GET /playlists/{id}/tracks` - Get playlist tracks
- `PUT /playlists/{id}/tracks` - Replace all tracks (reorder)
- `DELETE /playlists/{id}/tracks` - Remove tracks

**Rate Limiting:** 100ms delay between batched calls recommended

---

## BYOK (Bring Your Own Key) Model

### Why BYOK?
- Spotify limits Development Mode apps to 25 users
- Extended quota requires organization approval (not available to individuals)
- BYOK means unlimited users, no approval needed

### User Setup Flow
1. User visits app for first time
2. App shows setup instructions
3. User goes to developer.spotify.com and creates an app
4. User copies their Client ID
5. User pastes Client ID into app
6. App validates and stores Client ID
7. User proceeds to login

---

## Project Structure (Proposed)

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router setup
├── config/
│   └── spotify.ts              # OAuth config, scopes
├── hooks/
│   ├── useAuth.ts              # Auth state & methods
│   ├── usePlaylists.ts         # Playlist fetching
│   └── useEditor.ts            # Editor state, multi-select logic
├── services/
│   └── spotifyApi.ts           # All Spotify API calls
├── components/
│   ├── Layout/
│   ├── PlaylistCard/
│   ├── TrackItem/
│   ├── DragHandle/
│   └── ...
├── pages/
│   ├── Setup.tsx               # BYOK onboarding
│   ├── Login.tsx
│   ├── Playlists.tsx           # Playlist browser
│   └── Editor.tsx              # Main editor
├── utils/
│   └── pkce.ts                 # PKCE helpers
└── types/
    └── spotify.ts              # TypeScript interfaces
```

---

## Design Notes

- Dark theme (Spotify-inspired)
- Accent color: Spotify green (#1DB954)
- Clean, minimal UI
- Mobile-first responsive design

---

## Open Questions / Decisions Needed

1. **Styling approach:** Tailwind CSS vs CSS Modules vs styled-components?
2. **State management:** React Context vs Zustand vs Jotai?
3. **Drag-and-drop library:** dnd-kit vs react-beautiful-dnd?
4. **Redirect URI for OAuth:** What will the GitHub Pages URL be?

---

## References

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [Spotify OAuth PKCE Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
