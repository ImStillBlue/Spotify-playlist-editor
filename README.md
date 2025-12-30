<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png" width="80" alt="Spotify Logo">
</p>

<h1 align="center">Spotify Playlist Editor</h1>

<p align="center">
  <strong>A web app for multi-select drag-and-drop playlist editing</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#live-demo">Live Demo</a> •
  <a href="#setup">Setup</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss" alt="Tailwind">
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
- **Multi-Select** — Click to select multiple songs
- **Multi-Drag** — Drag any selected song to move ALL selected songs together
- **Move to Top/Bottom** — Quick actions for bulk positioning
- **Batch Save** — Make multiple changes, then save once
- **Discard Changes** — Undo all changes before saving

### User Experience
- **Spotify-Inspired UI** — Dark theme with familiar green accents
- **Responsive Design** — Works on desktop and mobile
- **Exit Protection** — Warns before leaving with unsaved changes

---

## Live Demo

**[https://imstillblue.github.io/Spotify-playlist-editor](https://imstillblue.github.io/Spotify-playlist-editor)**

---

## Setup

Due to Spotify's API restrictions, each user needs to create their own Spotify Developer app. This is a one-time setup (~2 minutes).

### Quick Start

1. **Go to** [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. **Log in** with your Spotify account
3. **Create App** — Fill in any name/description
4. **Set Redirect URI** to:
   ```
   https://imstillblue.github.io/Spotify-playlist-editor/callback
   ```
5. **Check "Web API"** under APIs used
6. **Save** and copy your **Client ID**
7. **Open the app** and paste your Client ID

That's it! Your credentials stay in your browser — nothing is sent to any server.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Drag & Drop | dnd-kit |
| Hosting | GitHub Pages |

---

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## Roadmap

- [x] OAuth 2.0 PKCE authentication
- [x] BYOK (Bring Your Own Key) setup
- [x] View editable playlists
- [x] Multi-select songs
- [x] Multi-drag reordering
- [x] Move to top/bottom
- [x] Remove tracks
- [x] Save/discard changes
- [ ] Undo/redo history
- [ ] Search within playlist
- [ ] Sort by artist/album/date
- [ ] Duplicate detection
- [ ] Keyboard shortcuts

---

## Why "Bring Your Own Key"?

Spotify limits apps in "Development Mode" to 25 users, and getting Extended Quota requires being an organization. By using your own API credentials:

- **No user limits** — Your app, your quota
- **Privacy** — Your credentials never leave your browser
- **No server costs** — Runs entirely client-side

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Disclaimer

Not affiliated with Spotify. All Spotify trademarks are property of Spotify AB.

---

<p align="center">
  Made with React and caffeine
</p>
