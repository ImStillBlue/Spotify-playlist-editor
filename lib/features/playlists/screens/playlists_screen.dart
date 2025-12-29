import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/playlist.dart';
import '../providers/playlists_provider.dart';

class PlaylistsScreen extends ConsumerStatefulWidget {
  const PlaylistsScreen({super.key});

  @override
  ConsumerState<PlaylistsScreen> createState() => _PlaylistsScreenState();
}

class _PlaylistsScreenState extends ConsumerState<PlaylistsScreen> {
  @override
  void initState() {
    super.initState();
    // Load playlists when screen loads
    Future.microtask(() {
      ref.read(playlistsProvider.notifier).loadPlaylists();
    });
  }

  @override
  Widget build(BuildContext context) {
    final playlistsState = ref.watch(playlistsProvider);
    final authState = ref.watch(authProvider);
    final user = authState.userProfile;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Playlists'),
        actions: [
          // User avatar/menu
          if (user != null)
            PopupMenuButton<String>(
              offset: const Offset(0, 48),
              icon: CircleAvatar(
                radius: 16,
                backgroundColor: SpotifyColors.darkGrey,
                backgroundImage: user.imageUrl != null
                    ? CachedNetworkImageProvider(user.imageUrl!)
                    : null,
                child: user.imageUrl == null
                    ? const Icon(Icons.person, size: 20)
                    : null,
              ),
              itemBuilder: (context) => [
                PopupMenuItem(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.displayName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: SpotifyColors.white,
                        ),
                      ),
                      if (user.email != null)
                        Text(
                          user.email!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: SpotifyColors.lightGrey,
                          ),
                        ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  value: 'logout',
                  child: const Row(
                    children: [
                      Icon(Icons.logout, size: 20),
                      SizedBox(width: 12),
                      Text('Log out'),
                    ],
                  ),
                ),
              ],
              onSelected: (value) {
                if (value == 'logout') {
                  ref.read(authProvider.notifier).logout();
                }
              },
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(playlistsState),
    );
  }

  Widget _buildBody(PlaylistsState state) {
    if (state.isLoading && state.playlists.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: SpotifyColors.spotifyGreen,
        ),
      );
    }

    if (state.error != null && state.playlists.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: SpotifyColors.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load playlists',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              state.error!,
              style: const TextStyle(color: SpotifyColors.lightGrey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                ref.read(playlistsProvider.notifier).loadPlaylists();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.playlists.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.library_music,
              size: 64,
              color: SpotifyColors.lightGrey.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            const Text(
              'No playlists found',
              style: TextStyle(
                fontSize: 18,
                color: SpotifyColors.lightGrey,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(playlistsProvider.notifier).refresh(),
      color: SpotifyColors.spotifyGreen,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: state.playlists.length,
        itemBuilder: (context, index) {
          return _PlaylistTile(playlist: state.playlists[index]);
        },
      ),
    );
  }
}

class _PlaylistTile extends StatelessWidget {
  final Playlist playlist;

  const _PlaylistTile({required this.playlist});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: SizedBox(
          width: 56,
          height: 56,
          child: playlist.imageUrl != null
              ? CachedNetworkImage(
                  imageUrl: playlist.imageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: SpotifyColors.darkGrey,
                    child: const Icon(
                      Icons.music_note,
                      color: SpotifyColors.lightGrey,
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: SpotifyColors.darkGrey,
                    child: const Icon(
                      Icons.music_note,
                      color: SpotifyColors.lightGrey,
                    ),
                  ),
                )
              : Container(
                  color: SpotifyColors.darkGrey,
                  child: const Icon(
                    Icons.music_note,
                    color: SpotifyColors.lightGrey,
                  ),
                ),
        ),
      ),
      title: Text(
        playlist.name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        '${playlist.owner.displayName} • ${playlist.trackCountFormatted}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: SpotifyColors.lightGrey,
          fontSize: 13,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right,
        color: SpotifyColors.lightGrey,
      ),
      onTap: () {
        context.push('/editor/${playlist.id}');
      },
    );
  }
}
