import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../playlists/data/models/playlist.dart';
import '../../playlists/data/models/track.dart';

/// State for the playlist editor
class EditorState {
  final Playlist? playlist;
  final List<Track> tracks;
  final List<Track> originalTracks; // Track original order for comparison
  final Set<String> selectedTrackIds;
  final bool isLoading;
  final bool isSaving;
  final String? error;
  final String? snapshotId;

  const EditorState({
    this.playlist,
    this.tracks = const [],
    this.originalTracks = const [],
    this.selectedTrackIds = const {},
    this.isLoading = false,
    this.isSaving = false,
    this.error,
    this.snapshotId,
  });

  EditorState copyWith({
    Playlist? playlist,
    List<Track>? tracks,
    List<Track>? originalTracks,
    Set<String>? selectedTrackIds,
    bool? isLoading,
    bool? isSaving,
    String? error,
    String? snapshotId,
  }) {
    return EditorState(
      playlist: playlist ?? this.playlist,
      tracks: tracks ?? this.tracks,
      originalTracks: originalTracks ?? this.originalTracks,
      selectedTrackIds: selectedTrackIds ?? this.selectedTrackIds,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      error: error,
      snapshotId: snapshotId ?? this.snapshotId,
    );
  }

  bool isSelected(String trackId) => selectedTrackIds.contains(trackId);
  int get selectedCount => selectedTrackIds.length;
  bool get hasSelection => selectedTrackIds.isNotEmpty;
  bool get allSelected =>
      tracks.isNotEmpty && selectedTrackIds.length == tracks.length;

  /// Check if there are unsaved changes
  bool get hasUnsavedChanges {
    if (tracks.length != originalTracks.length) return true;
    for (int i = 0; i < tracks.length; i++) {
      if (tracks[i].id != originalTracks[i].id) return true;
    }
    return false;
  }

  List<Track> get selectedTracks {
    return tracks.where((t) => selectedTrackIds.contains(t.id)).toList();
  }

  /// Get indices of selected tracks in current order
  List<int> get selectedIndices {
    final indices = <int>[];
    for (int i = 0; i < tracks.length; i++) {
      if (selectedTrackIds.contains(tracks[i].id)) {
        indices.add(i);
      }
    }
    return indices;
  }
}

/// Editor state notifier
class EditorNotifier extends StateNotifier<EditorState> {
  final Ref _ref;
  final String _playlistId;

  EditorNotifier(this._ref, this._playlistId) : super(const EditorState());

  /// Load playlist and tracks (optimized - single call for metadata + first 100 tracks)
  Future<void> loadPlaylist() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final apiService = _ref.read(spotifyApiServiceProvider);

      // Optimized: fetches playlist + first 100 tracks in ONE call
      // Only makes additional calls if playlist has >100 tracks
      final result = await apiService.getPlaylistWithTracks(_playlistId);

      state = EditorState(
        playlist: result.playlist,
        tracks: result.tracks,
        originalTracks: List.from(result.tracks), // Store original order
        snapshotId: result.playlist.snapshotId,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  // ============ Selection ============

  void toggleSelection(String trackId) {
    final newSelection = Set<String>.from(state.selectedTrackIds);
    if (newSelection.contains(trackId)) {
      newSelection.remove(trackId);
    } else {
      newSelection.add(trackId);
    }
    state = state.copyWith(selectedTrackIds: newSelection);
  }

  void selectAll() {
    state = state.copyWith(
      selectedTrackIds: state.tracks.map((t) => t.id).toSet(),
    );
  }

  void clearSelection() {
    state = state.copyWith(selectedTrackIds: {});
  }

  // ============ Reordering (Local Only) ============

  /// Reorder a single track OR all selected tracks if dragged track is selected
  void reorderTrack(int oldIndex, int newIndex) {
    final tracks = List<Track>.from(state.tracks);
    final draggedTrack = tracks[oldIndex];

    // Check if dragged track is part of selection
    if (state.selectedTrackIds.contains(draggedTrack.id) && state.selectedCount > 1) {
      // Multi-drag: move all selected tracks
      _reorderSelectedTracks(oldIndex, newIndex);
    } else {
      // Single drag
      final track = tracks.removeAt(oldIndex);
      int insertAt = newIndex;
      if (newIndex > oldIndex) {
        insertAt--;
      }
      tracks.insert(insertAt, track);
      state = state.copyWith(tracks: tracks);
    }
  }

  /// Internal: reorder all selected tracks to new position
  void _reorderSelectedTracks(int draggedFromIndex, int dropIndex) {
    final tracks = List<Track>.from(state.tracks);
    final selectedIds = state.selectedTrackIds;

    // Get selected tracks in their current order
    final selectedTracks = <Track>[];
    final remainingTracks = <Track>[];

    for (final track in tracks) {
      if (selectedIds.contains(track.id)) {
        selectedTracks.add(track);
      } else {
        remainingTracks.add(track);
      }
    }

    // Calculate insert position in remaining list
    // Count how many selected items are before the drop position
    int selectedBeforeDrop = 0;
    for (int i = 0; i < dropIndex && i < tracks.length; i++) {
      if (selectedIds.contains(tracks[i].id)) {
        selectedBeforeDrop++;
      }
    }

    int insertAt = dropIndex - selectedBeforeDrop;
    if (dropIndex > draggedFromIndex) {
      insertAt--;
    }
    insertAt = insertAt.clamp(0, remainingTracks.length);

    // Insert all selected tracks at the target position
    remainingTracks.insertAll(insertAt, selectedTracks);

    state = state.copyWith(tracks: remainingTracks);
  }

  /// Move selected tracks to top (local only)
  void moveSelectedToTop() {
    if (!state.hasSelection) return;

    final tracks = List<Track>.from(state.tracks);
    final selectedIds = state.selectedTrackIds;

    final selectedTracks = <Track>[];
    final remainingTracks = <Track>[];

    for (final track in tracks) {
      if (selectedIds.contains(track.id)) {
        selectedTracks.add(track);
      } else {
        remainingTracks.add(track);
      }
    }

    // Selected tracks go to top
    state = state.copyWith(tracks: [...selectedTracks, ...remainingTracks]);
  }

  /// Move selected tracks to bottom (local only)
  void moveSelectedToBottom() {
    if (!state.hasSelection) return;

    final tracks = List<Track>.from(state.tracks);
    final selectedIds = state.selectedTrackIds;

    final selectedTracks = <Track>[];
    final remainingTracks = <Track>[];

    for (final track in tracks) {
      if (selectedIds.contains(track.id)) {
        selectedTracks.add(track);
      } else {
        remainingTracks.add(track);
      }
    }

    // Selected tracks go to bottom
    state = state.copyWith(tracks: [...remainingTracks, ...selectedTracks]);
  }

  /// Discard all local changes and reload from Spotify
  void discardChanges() {
    state = state.copyWith(
      tracks: List.from(state.originalTracks),
      selectedTrackIds: {},
    );
  }

  // ============ Save to Spotify ============

  /// Save all changes to Spotify
  Future<bool> saveChanges() async {
    if (state.playlist == null || !state.hasUnsavedChanges) return true;

    state = state.copyWith(isSaving: true);

    try {
      final apiService = _ref.read(spotifyApiServiceProvider);
      final trackUris = state.tracks.map((t) => t.uri).toList();

      final newSnapshotId = await apiService.replaceTracks(
        playlistId: _playlistId,
        trackUris: trackUris,
      );

      // Update original tracks to match current (changes are now saved)
      state = state.copyWith(
        isSaving: false,
        snapshotId: newSnapshotId,
        originalTracks: List.from(state.tracks),
        selectedTrackIds: {},
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: e.toString(),
      );
      return false;
    }
  }

  // ============ Deletion ============

  /// Remove selected tracks (local only until save)
  void removeSelectedTracks() {
    if (!state.hasSelection) return;

    final newTracks = state.tracks
        .where((t) => !state.selectedTrackIds.contains(t.id))
        .toList();

    state = state.copyWith(
      tracks: newTracks,
      selectedTrackIds: {},
    );
  }
}

/// Provider family for editor (keyed by playlist ID)
final editorProvider =
    StateNotifierProvider.family<EditorNotifier, EditorState, String>(
        (ref, playlistId) {
  return EditorNotifier(ref, playlistId);
});
