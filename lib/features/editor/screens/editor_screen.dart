import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../playlists/data/models/track.dart';
import '../providers/editor_provider.dart';

class EditorScreen extends ConsumerStatefulWidget {
  final String playlistId;

  const EditorScreen({super.key, required this.playlistId});

  @override
  ConsumerState<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends ConsumerState<EditorScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(editorProvider(widget.playlistId).notifier).loadPlaylist();
    });
  }

  Future<bool> _onWillPop() async {
    final state = ref.read(editorProvider(widget.playlistId));
    if (!state.hasUnsavedChanges) return true;

    final result = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: SpotifyColors.darkGrey,
        title: const Text('Unsaved Changes'),
        content: const Text('You have unsaved changes. What would you like to do?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, 'discard'),
            child: const Text('Discard', style: TextStyle(color: SpotifyColors.error)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, 'cancel'),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, 'save'),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result == 'save') {
      final notifier = ref.read(editorProvider(widget.playlistId).notifier);
      final success = await notifier.saveChanges();
      return success;
    } else if (result == 'discard') {
      return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final editorState = ref.watch(editorProvider(widget.playlistId));
    final notifier = ref.read(editorProvider(widget.playlistId).notifier);

    return PopScope(
      canPop: !editorState.hasUnsavedChanges,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              Expanded(
                child: Text(
                  editorState.playlist?.name ?? 'Loading...',
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              // Unsaved changes indicator
              if (editorState.hasUnsavedChanges)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: SpotifyColors.warning,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Unsaved',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: SpotifyColors.spotifyBlack,
                    ),
                  ),
                ),
            ],
          ),
          actions: [
            if (editorState.hasSelection) ...[
              // Selection count badge
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: SpotifyColors.spotifyGreen,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '${editorState.selectedCount}',
                    style: const TextStyle(
                      color: SpotifyColors.spotifyBlack,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 4),
            ],
            // Select all / deselect
            IconButton(
              icon: Icon(
                editorState.allSelected ? Icons.deselect : Icons.select_all,
              ),
              onPressed: () {
                if (editorState.allSelected) {
                  notifier.clearSelection();
                } else {
                  notifier.selectAll();
                }
              },
              tooltip: editorState.allSelected ? 'Deselect all' : 'Select all',
            ),
            // More options menu
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (value) async {
                switch (value) {
                  case 'discard':
                    notifier.discardChanges();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Changes discarded')),
                    );
                    break;
                }
              },
              itemBuilder: (context) => [
                if (editorState.hasUnsavedChanges)
                  const PopupMenuItem(
                    value: 'discard',
                    child: Row(
                      children: [
                        Icon(Icons.undo, size: 20),
                        SizedBox(width: 12),
                        Text('Discard changes'),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
        body: _buildBody(editorState),
        bottomNavigationBar: _buildBottomBar(editorState, notifier),
      ),
    );
  }

  Widget _buildBody(EditorState state) {
    if (state.isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: SpotifyColors.spotifyGreen,
        ),
      );
    }

    if (state.error != null && state.tracks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: SpotifyColors.error),
            const SizedBox(height: 16),
            Text('Failed to load playlist', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                state.error!,
                style: const TextStyle(color: SpotifyColors.lightGrey),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => ref.read(editorProvider(widget.playlistId).notifier).loadPlaylist(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.tracks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.queue_music, size: 64, color: SpotifyColors.lightGrey.withOpacity(0.5)),
            const SizedBox(height: 16),
            const Text(
              'This playlist is empty',
              style: TextStyle(fontSize: 18, color: SpotifyColors.lightGrey),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        ReorderableListView.builder(
          padding: const EdgeInsets.only(bottom: 100),
          itemCount: state.tracks.length,
          onReorder: (oldIndex, newIndex) {
            ref.read(editorProvider(widget.playlistId).notifier).reorderTrack(oldIndex, newIndex);
          },
          proxyDecorator: (child, index, animation) {
            // Show visual feedback for multi-drag
            final track = state.tracks[index];
            final isMultiDrag = state.isSelected(track.id) && state.selectedCount > 1;

            return AnimatedBuilder(
              animation: animation,
              builder: (context, child) {
                final elevation = Tween<double>(begin: 0, end: 8).animate(animation).value;
                return Material(
                  elevation: elevation,
                  color: SpotifyColors.darkGrey,
                  borderRadius: BorderRadius.circular(8),
                  child: isMultiDrag
                      ? Stack(
                          children: [
                            child!,
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: SpotifyColors.spotifyGreen,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'Moving ${state.selectedCount}',
                                  style: const TextStyle(
                                    color: SpotifyColors.spotifyBlack,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        )
                      : child,
                );
              },
              child: child,
            );
          },
          itemBuilder: (context, index) {
            final track = state.tracks[index];
            return _TrackTile(
              key: ValueKey(track.id),
              track: track,
              index: index,
              isSelected: state.isSelected(track.id),
              onTap: () {
                ref.read(editorProvider(widget.playlistId).notifier).toggleSelection(track.id);
              },
            );
          },
        ),
        // Saving overlay
        if (state.isSaving)
          Positioned.fill(
            child: Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: SpotifyColors.spotifyGreen),
                    SizedBox(height: 16),
                    Text('Saving to Spotify...', style: TextStyle(color: SpotifyColors.white)),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget? _buildBottomBar(EditorState state, EditorNotifier notifier) {
    // Show selection toolbar when items selected
    if (state.hasSelection) {
      return _buildSelectionToolbar(state, notifier);
    }
    // Show save bar when there are unsaved changes
    if (state.hasUnsavedChanges) {
      return _buildSaveBar(state, notifier);
    }
    return null;
  }

  Widget _buildSaveBar(EditorState state, EditorNotifier notifier) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: SpotifyColors.darkGrey,
        border: Border(top: BorderSide(color: SpotifyColors.mediumGrey)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: SpotifyColors.warning, size: 20),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'You have unsaved changes',
                style: TextStyle(color: SpotifyColors.lightGrey),
              ),
            ),
            TextButton(
              onPressed: () {
                notifier.discardChanges();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Changes discarded')),
                );
              },
              child: const Text('Discard'),
            ),
            const SizedBox(width: 8),
            ElevatedButton.icon(
              onPressed: () async {
                final success = await notifier.saveChanges();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success ? 'Saved to Spotify!' : 'Failed to save'),
                      backgroundColor: success ? SpotifyColors.spotifyGreen : SpotifyColors.error,
                    ),
                  );
                }
              },
              icon: const Icon(Icons.cloud_upload, size: 18),
              label: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectionToolbar(EditorState state, EditorNotifier notifier) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: SpotifyColors.darkGrey,
        border: Border(top: BorderSide(color: SpotifyColors.mediumGrey)),
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _ToolbarButton(
              icon: Icons.vertical_align_top,
              label: 'To Top',
              onPressed: () {
                notifier.moveSelectedToTop();
                notifier.clearSelection();
              },
            ),
            _ToolbarButton(
              icon: Icons.vertical_align_bottom,
              label: 'To Bottom',
              onPressed: () {
                notifier.moveSelectedToBottom();
                notifier.clearSelection();
              },
            ),
            _ToolbarButton(
              icon: Icons.delete_outline,
              label: 'Remove',
              color: SpotifyColors.error,
              onPressed: () {
                notifier.removeSelectedTracks();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Tracks marked for removal. Save to apply.')),
                );
              },
            ),
            // Show Save if there are unsaved changes, otherwise show Clear
            if (state.hasUnsavedChanges)
              _ToolbarButton(
                icon: Icons.cloud_upload,
                label: 'Save',
                color: SpotifyColors.spotifyGreen,
                onPressed: () async {
                  final success = await notifier.saveChanges();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(success ? 'Saved to Spotify!' : 'Failed to save'),
                        backgroundColor: success ? SpotifyColors.spotifyGreen : SpotifyColors.error,
                      ),
                    );
                  }
                },
              )
            else
              _ToolbarButton(
                icon: Icons.close,
                label: 'Clear',
                onPressed: () => notifier.clearSelection(),
              ),
          ],
        ),
      ),
    );
  }
}

class _TrackTile extends StatelessWidget {
  final Track track;
  final int index;
  final bool isSelected;
  final VoidCallback onTap;

  const _TrackTile({
    super.key,
    required this.track,
    required this.index,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: isSelected ? SpotifyColors.spotifyGreen.withOpacity(0.15) : Colors.transparent,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            ReorderableDragStartListener(
              index: index,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Icon(
                  Icons.drag_handle,
                  color: isSelected ? SpotifyColors.spotifyGreen : SpotifyColors.lightGrey,
                ),
              ),
            ),
            // Selection checkbox
            Checkbox(
              value: isSelected,
              onChanged: (_) => onTap(),
            ),
            // Album art
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                width: 48,
                height: 48,
                child: track.albumImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: track.albumImageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(color: SpotifyColors.darkGrey),
                        errorWidget: (context, url, error) => Container(
                          color: SpotifyColors.darkGrey,
                          child: const Icon(Icons.music_note, color: SpotifyColors.lightGrey, size: 24),
                        ),
                      )
                    : Container(
                        color: SpotifyColors.darkGrey,
                        child: const Icon(Icons.music_note, color: SpotifyColors.lightGrey, size: 24),
                      ),
              ),
            ),
          ],
        ),
        title: Text(
          track.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.w500),
        ),
        subtitle: Text(
          '${track.artistNames} • ${track.durationFormatted}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: SpotifyColors.lightGrey, fontSize: 13),
        ),
        onTap: onTap,
      ),
    );
  }
}

class _ToolbarButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final Color? color;

  const _ToolbarButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color ?? SpotifyColors.white, size: 24),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: color ?? SpotifyColors.white, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
