<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png" width="80" alt="Spotify Logo">
</p>

<h1 align="center">Spotify Playlist Editor</h1>

<p align="center">
  <strong>A powerful playlist management app with multi-select drag-and-drop</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter" alt="Flutter">
  <img src="https://img.shields.io/badge/Dart-3.x-0175C2?logo=dart" alt="Dart">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

---

## The Problem

Spotify's built-in playlist editor only lets you drag **one song at a time**. Reordering a large playlist is tedious and time-consuming.

## The Solution

This app lets you **select multiple songs** and **drag them all at once** to their new position. What takes 50 drags in Spotify takes just 1 here.

---

## Features

### Core Functionality
- **Multi-Select** — Tap to select multiple songs
- **Multi-Drag** — Drag any selected song to move ALL selected songs together
- **Move to Top/Bottom** — Quick actions for bulk positioning
- **Batch Save** — Make multiple changes, then save once (efficient API usage)
- **Undo Changes** — Discard all changes before saving

### User Experience
- **Spotify-Inspired UI** — Dark theme with familiar green accents
- **Visual Feedback** — "Moving X songs" badge while dragging
- **Unsaved Indicator** — Know when you have pending changes
- **Back Protection** — Won't lose changes accidentally

### Smart & Efficient
- **Optimized API Calls** — Fetches playlist + tracks in minimal requests
- **Batched Operations** — Handles large playlists (1000+ songs) gracefully
- **Rate Limit Aware** — Built-in delays to respect Spotify's limits

---

## Screenshots

<!-- Add your screenshots here -->
<p align="center">
  <i>Screenshots coming soon</i>
</p>

<!--
<p align="center">
  <img src="screenshots/login.png" width="200" alt="Login">
  <img src="screenshots/playlists.png" width="200" alt="Playlists">
  <img src="screenshots/editor.png" width="200" alt="Editor">
  <img src="screenshots/multi-select.png" width="200" alt="Multi-select">
</p>
-->

---

## Installation

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.x or higher)
- Android Studio with Android SDK
- A [Spotify Developer](https://developer.spotify.com/dashboard) account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ImStillBlue/Spotify-playlist-editor.git
   cd Spotify-playlist-editor
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure Spotify API** (see [Configuration](#configuration))

4. **Run the app**
   ```bash
   flutter run
   ```

---

## Configuration

### Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

2. Create a new app (or use an existing one)

3. Add this **Redirect URI** to your app settings:
   ```
   com.spotifyeditor.app://callback
   ```

4. Copy your **Client ID**

5. Open `lib/core/config/spotify_config.dart` and paste your Client ID:
   ```dart
   static const String clientId = 'YOUR_CLIENT_ID_HERE';
   ```

### That's it!

No server needed. The app uses OAuth 2.0 PKCE flow which is secure for mobile apps without a backend.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Flutter 3.x |
| Language | Dart |
| State Management | Riverpod |
| HTTP Client | Dio |
| Authentication | flutter_appauth (OAuth 2.0 PKCE) |
| Secure Storage | flutter_secure_storage |
| Navigation | go_router |
| Image Caching | cached_network_image |

---

## Project Structure

```
lib/
├── main.dart                    # App entry point
├── app.dart                     # Router configuration
├── core/
│   ├── config/                  # Spotify API config
│   └── theme/                   # Material 3 + Spotify theme
├── services/
│   └── spotify_api_service.dart # API client
└── features/
    ├── auth/                    # OAuth authentication
    ├── playlists/               # Playlist browsing
    └── editor/                  # Main editor with multi-select
```

---

## Roadmap

- [x] OAuth 2.0 authentication
- [x] View playlists
- [x] Single-drag reordering
- [x] Multi-select songs
- [x] Multi-drag (move selected together)
- [x] Move to top/bottom
- [x] Remove tracks
- [x] Save/discard changes
- [ ] Undo/redo history
- [ ] Search within playlist
- [ ] Sort by artist/album/date
- [ ] Duplicate detection
- [ ] Song previews
- [ ] iOS testing & release
- [ ] Play Store release

---

## API Usage

This app respects Spotify's API guidelines:

- **Minimal calls** — Combined endpoints where possible
- **Batched requests** — 100 items per request (Spotify's limit)
- **Rate limiting** — 100ms delays between batch operations
- **Efficient saves** — Only calls API when changes are made

---

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Disclaimer

This app is not affiliated with, endorsed by, or connected to Spotify AB. All Spotify trademarks, service marks, trade names, logos, and domain names are the property of Spotify AB.

---

<p align="center">
  Made with Flutter and caffeine
</p>
