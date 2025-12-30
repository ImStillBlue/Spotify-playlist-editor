import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Setup from './pages/Setup'
import Login from './pages/Login'
import Playlists from './pages/Playlists'
import Editor from './pages/Editor'
import Callback from './pages/Callback'

function App() {
  return (
    <BrowserRouter basename="/Spotify-playlist-editor">
      <Routes>
        <Route path="/" element={<Setup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/editor/:playlistId" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
