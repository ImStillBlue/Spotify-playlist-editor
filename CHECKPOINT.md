# Spotify Playlist Editor - Project Checkpoint

**Date:** December 29, 2024
**Last Updated:** December 29, 2024 (Session 1 End)
**Status:** Phase 1-4 Complete (Core functionality working, ready for BYOK implementation)

---

## Project Overview

A Flutter mobile app for advanced Spotify playlist management with multi-select drag-and-drop reordering. The main differentiator from Spotify's built-in feature is the ability to select multiple songs and drag them together.

**Target Platforms:** Android (primary), iOS (same codebase)

---

## Current Features (Working)

### Authentication
- OAuth 2.0 PKCE flow with Spotify
- Secure token storage with auto-refresh
- Login/logout functionality

### Playlist Browsing
- View all user playlists with cover art
- Shows playlist owner and track count
- Pull-to-refresh

### Playlist Editor (Core Feature)
- **Multi-select:** Tap checkbox to select multiple songs
- **Multi-drag:** Drag any selected song's handle to move ALL selected songs together
- **Move to Top/Bottom:** Quick actions for selected songs
- **Remove tracks:** Mark tracks for removal (local until save)
- **Save changes:** Single save button commits all changes to Spotify
- **Discard changes:** Revert to original order
- **Unsaved indicator:** Shows "Unsaved" badge when changes pending
- **Back button protection:** Warns before leaving with unsaved changes

### UI/Theme
- Material 3 with Spotify-inspired dark theme
- Spotify green (#1DB954) accent color
- Smooth drag animations with "Moving X" badge for multi-drag

---

## Project Structure

```
lib/
├── main.dart                              # App entry point
├── app.dart                               # Router & MaterialApp config
├── core/
│   ├── config/
│   │   └── spotify_config.dart            # Client ID, redirect URI, scopes
│   └── theme/
│       └── app_theme.dart                 # Material 3 + Spotify colors
├── services/
│   └── spotify_api_service.dart           # All Spotify API calls (optimized)
└── features/
    ├── auth/
    │   ├── data/
    │   │   └── auth_repository.dart       # OAuth 2.0 PKCE implementation
    │   ├── providers/
    │   │   └── auth_provider.dart         # Auth state management
    │   └── screens/
    │       └── login_screen.dart
    ├── playlists/
    │   ├── data/
    │   │   └── models/
    │   │       ├── playlist.dart          # Playlist model
    │   │       └── track.dart             # Track/Artist/Album models
    │   ├── providers/
    │   │   └── playlists_provider.dart
    │   └── screens/
    │       └── playlists_screen.dart
    └── editor/
        ├── providers/
        │   └── editor_provider.dart       # Editor state, multi-select logic
        └── screens/
            └── editor_screen.dart         # Main editor UI
```

---

## Key Technical Decisions

### State Management
- **Riverpod** for state management (flutter_riverpod)
- Provider pattern with StateNotifier for complex state

### API Optimization
- Combined playlist + tracks fetch (1 call for ≤100 tracks)
- Batched API calls for playlists >100 tracks (100 per request)
- Batched save operations with rate limit delays (100ms between batches)
- Minimal logging (errors only) to reduce console noise

### Save Strategy
- All changes are LOCAL until user clicks Save
- Uses `replaceTracks` endpoint for saving (batched for large playlists)
- Tracks original order to detect unsaved changes
- Single API call for small playlists, batched for large ones

### Multi-Select Drag
- When dragging a selected track, ALL selected tracks move together
- Maintains relative order of selected tracks
- Visual feedback shows "Moving X" badge during drag

---

## Spotify API Configuration

**Client ID:** Stored in `lib/core/config/spotify_config.dart`
**Redirect URI:** `com.spotifyeditor.app://callback`
**Scopes:**
- playlist-read-private
- playlist-read-collaborative
- playlist-modify-private
- playlist-modify-public
- user-library-read
- user-read-private
- user-read-email

**Android Config:**
- `manifestPlaceholders["appAuthRedirectScheme"]` in build.gradle.kts
- `launchMode="singleTask"` for OAuth callback handling

---

## Dependencies (pubspec.yaml)

```yaml
flutter_riverpod: ^2.6.1      # State management
dio: ^5.7.0                   # HTTP client
flutter_secure_storage: ^9.2.2 # Token storage
flutter_appauth: ^8.0.1       # OAuth 2.0 PKCE
cached_network_image: ^3.4.1  # Album art caching
go_router: ^14.6.2            # Navigation
```

---

## Features NOT Yet Implemented (From Original Plan)

### Phase 5: Undo/Redo System
- [ ] Track all operations (reorder, delete)
- [ ] Implement undo/redo actions
- [ ] Visual indicator for undo availability

### Phase 6: Search, Filter & Sort
- [ ] In-playlist search by title/artist/album
- [ ] Filter by artist or album
- [ ] Quick sort (by artist, album, date added, duration, title)

### Phase 7: Additional Features
- [ ] Duplicate detection
- [ ] Playlist statistics (total duration, top artists)
- [ ] Song previews (30-second clips)
- [ ] Shuffle preview

### Phase 8: Polish & Release
- [ ] Offline handling
- [ ] Performance optimization for very large playlists
- [ ] UI polish and animations
- [ ] Android release build

---

## Known Considerations

1. **Spotify Developer App:** Using existing "Stream Deck Spotify Control" app (new app creation paused by Spotify)

2. **Rate Limiting:** 100ms delays between batched API calls to avoid rate limits

3. **Large Playlists:** Tested working, but very large playlists (1000+) may feel slow during save

4. **Android Only:** iOS not tested yet but should work with same codebase

---

## IMPORTANT: API Distribution Issue

### The Problem
Spotify now requires **organizations** to request Extended Quota Mode. Individual developers cannot get quota extensions, meaning:
- Apps in Development Mode are limited to **25 manually-added users**
- Cannot publish to Play Store with a single shared Client ID

### The Solution: "Bring Your Own Key" (BYOK)
Each user creates their own Spotify Developer app and uses their own Client ID.

### Implementation Needed (Next Session)
1. **Setup Screen** - First-launch onboarding with step-by-step instructions
2. **Dynamic Client ID** - Store user's Client ID in secure storage
3. **Load from Storage** - Modify `SpotifyConfig` to load Client ID dynamically
4. **Validation** - Verify Client ID works before proceeding
5. **Update README** - Document self-setup process for users

### Proposed User Flow
```
First Launch → Setup Screen → User creates Spotify Dev app →
User enters Client ID → App validates → Login Screen → Use app
```

### Benefits of BYOK
- No quota limits (each user has their own app)
- No Spotify approval needed
- Common pattern for open-source API apps
- Developer not responsible for API abuse

---

## How to Run

```bash
cd "C:\Users\Blue\Documents\GitHub\Spotify-playlist-editor"
flutter pub get
flutter run
```

Requires Android emulator or physical device with USB debugging enabled.

---

## Files Modified from Flutter Default

- `android/app/src/main/AndroidManifest.xml` - Internet permission, app label
- `android/app/build.gradle.kts` - manifestPlaceholders for OAuth
- `lib/main.dart` - Complete rewrite
- All files in `lib/` are new

---

## Session 1 Summary (December 29, 2024)

### What Was Built
- Complete Flutter project from scratch
- OAuth 2.0 PKCE authentication with Spotify
- Playlist browsing with album art
- Full playlist editor with multi-select drag-and-drop
- Local changes with save/discard functionality
- Optimized API calls (combined fetches, batching)

### Key Decisions Made
- Riverpod for state management
- Local-only changes until explicit Save (prevents wasted API calls)
- Multi-drag: dragging a selected track moves ALL selected tracks
- Minimal API logging (errors only)
- Removed useless three-dot menu from editor

### What's Next (Session 2)
1. Implement BYOK (Bring Your Own Key) setup flow
2. Filter playlist list to only show editable playlists (owned by user OR collaborative)
3. Then: Undo/redo, search, sort features
4. Eventually: Play Store release

### Bug/UX Fix Needed
- **Playlist filtering:** Currently shows ALL playlists including ones user can't edit. Should only show playlists where `owner.id == currentUserId` OR `collaborative == true`. The `Playlist` model already has a `canEdit(userId)` method ready to use.

### To Resume Next Session
Say: "Read CHECKPOINT.md and let's continue building the Spotify playlist editor. Next priority is implementing the BYOK setup flow."
