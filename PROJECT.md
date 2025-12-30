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
- [x] OAuth 2.0 PKCE flow (client-side, no server needed)
- [x] Secure token storage (localStorage)
- [x] Auto-refresh tokens
- [x] Login/logout

### BYOK Setup (First-Time Flow)
- [x] Step-by-step instructions to create Spotify Developer app
- [x] User enters their Client ID
- [x] Validation before proceeding
- [x] Store Client ID locally

### Playlist Browsing
- [x] View user's editable playlists (owned OR collaborative)
- [x] Display playlist cover art, name, owner, track count
- [x] Filter out playlists user can't edit

### Playlist Editor (Core Differentiator)
- [x] Display all tracks with album art, title, artist, duration
- [x] **Multi-select:** Click to select multiple tracks
- [x] **Multi-drag:** Drag any selected track to move ALL selected tracks together
- [x] **Move to Top/Bottom:** Quick actions for selected tracks
- [x] **Remove tracks:** Mark for removal (local until save)
- [x] **Save changes:** Commit all changes to Spotify API
- [x] **Discard changes:** Revert to original order
- [x] **Unsaved indicator:** Visual feedback when changes pending
- [x] **Exit protection:** Warn before leaving with unsaved changes

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
- [ ] Responsive design improvements
- [ ] Offline detection/handling
- [ ] Performance optimization for large playlists (1000+ tracks)
- [ ] Loading skeletons
- [ ] Error handling with retry options

---

## Technical Stack (Final)

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State Management | React useState/useEffect (simple, no external lib needed) |
| HTTP Client | fetch |
| Drag & Drop | dnd-kit |
| Routing | react-router-dom |
| Hosting | GitHub Pages |

---

## Spotify API Details

**OAuth Flow:** PKCE (Proof Key for Code Exchange) - no client secret needed

**Redirect URI:** `https://imstillblue.github.io/Spotify-playlist-editor/callback`

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

**Rate Limiting:** 100ms delay between batched calls

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

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router setup
├── index.css                   # Global styles + Tailwind
├── vite-env.d.ts               # Vite types
├── config/
│   └── spotify.ts              # OAuth config, client ID storage
├── services/
│   ├── auth.ts                 # OAuth PKCE flow, token management
│   └── spotifyApi.ts           # All Spotify API calls
├── components/
│   └── SortableTrackItem.tsx   # Sortable track with dnd-kit + multi-drag badge
├── pages/
│   ├── Setup.tsx               # BYOK onboarding
│   ├── Login.tsx               # Login screen
│   ├── Callback.tsx            # OAuth callback handler
│   ├── Playlists.tsx           # Playlist browser
│   └── Editor.tsx              # Main editor with multi-select
├── utils/
│   └── pkce.ts                 # PKCE helpers (code verifier/challenge)
└── types/
    └── spotify.ts              # TypeScript interfaces
```

---

## Design Notes

- Dark theme (Spotify-inspired)
- Accent color: Spotify green (#1DB954)
- Clean, minimal UI
- Responsive (works on mobile + desktop)

---

## Session Checkpoint (Dec 30, 2024)

### Completed This Session
- Multi-drag badge: When dragging multiple selected tracks, shows "+X" badge on album art
- Smooth transitions: Selection toolbar, Unsaved badge, and Save/Discard buttons animate smoothly (no more snapping)
- Login flow fix: "Change Client ID" button now works correctly (navigates to Setup with `?edit=true`)
- Setup page: Pre-fills existing client ID when editing, shows "Cancel" button to go back
- Playlist cards: Changed hover icon from play to edit (pen icon) - less misleading
- App logo: Changed from music note to pencil/edit icon to match app purpose

### Known Issues / Future Polish
- Consider adding page transition animations (route changes)
- Loading states could use skeleton loaders instead of spinners
- Error states could have retry buttons

---

## References

- [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api)
- [Spotify OAuth PKCE Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [dnd-kit Docs](https://dndkit.com/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
