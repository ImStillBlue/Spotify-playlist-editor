# Spotify Playlist Editor - Project Checkpoint

**Date:** December 29, 2024
**Status:** Phase 1-4 Complete (Core functionality working)

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
