import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/playlist.dart';

/// State for playlists
class PlaylistsState {
  final List<Playlist> playlists;
  final bool isLoading;
  final String? error;

  const PlaylistsState({
    this.playlists = const [],
    this.isLoading = false,
    this.error,
  });

  PlaylistsState copyWith({
    List<Playlist>? playlists,
    bool? isLoading,
    String? error,
  }) {
    return PlaylistsState(
      playlists: playlists ?? this.playlists,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Playlists state notifier
class PlaylistsNotifier extends StateNotifier<PlaylistsState> {
  final Ref _ref;

  PlaylistsNotifier(this._ref) : super(const PlaylistsState());

  /// Load all user playlists
  Future<void> loadPlaylists() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final apiService = _ref.read(spotifyApiServiceProvider);
      final playlists = await apiService.getAllUserPlaylists();

      state = PlaylistsState(
        playlists: playlists,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Refresh playlists
  Future<void> refresh() async {
    await loadPlaylists();
  }
}

/// Playlists provider
final playlistsProvider =
    StateNotifierProvider<PlaylistsNotifier, PlaylistsState>((ref) {
  return PlaylistsNotifier(ref);
});

/// Provider for user's editable playlists only
final editablePlaylistsProvider = Provider<List<Playlist>>((ref) {
  final userId = ref.watch(currentUserIdProvider);
  final playlists = ref.watch(playlistsProvider).playlists;

  if (userId == null) return [];

  return playlists.where((p) => p.canEdit(userId)).toList();
});
