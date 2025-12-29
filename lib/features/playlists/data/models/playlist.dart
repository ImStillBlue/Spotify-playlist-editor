import 'track.dart';

/// Represents a Spotify playlist
class Playlist {
  final String id;
  final String name;
  final String? description;
  final String uri;
  final String? snapshotId;
  final bool isPublic;
  final bool isCollaborative;
  final PlaylistOwner owner;
  final List<PlaylistImage> images;
  final int totalTracks;
  final List<Track> tracks;

  const Playlist({
    required this.id,
    required this.name,
    this.description,
    required this.uri,
    this.snapshotId,
    required this.isPublic,
    required this.isCollaborative,
    required this.owner,
    required this.images,
    required this.totalTracks,
    this.tracks = const [],
  });

  /// Create Playlist from Spotify API JSON (simplified playlist object)
  factory Playlist.fromJson(Map<String, dynamic> json) {
    final tracksData = json['tracks'] as Map<String, dynamic>?;

    return Playlist(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown Playlist',
      description: json['description'] as String?,
      uri: json['uri'] as String? ?? '',
      snapshotId: json['snapshot_id'] as String?,
      isPublic: json['public'] as bool? ?? false,
      isCollaborative: json['collaborative'] as bool? ?? false,
      owner: PlaylistOwner.fromJson(
          json['owner'] as Map<String, dynamic>? ?? {}),
      images: (json['images'] as List<dynamic>?)
              ?.map((i) => PlaylistImage.fromJson(i as Map<String, dynamic>))
              .toList() ??
          [],
      totalTracks: tracksData?['total'] as int? ?? 0,
      tracks: const [], // Tracks are loaded separately
    );
  }

  /// Create a copy with updated tracks
  Playlist copyWith({
    String? id,
    String? name,
    String? description,
    String? uri,
    String? snapshotId,
    bool? isPublic,
    bool? isCollaborative,
    PlaylistOwner? owner,
    List<PlaylistImage>? images,
    int? totalTracks,
    List<Track>? tracks,
  }) {
    return Playlist(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      uri: uri ?? this.uri,
      snapshotId: snapshotId ?? this.snapshotId,
      isPublic: isPublic ?? this.isPublic,
      isCollaborative: isCollaborative ?? this.isCollaborative,
      owner: owner ?? this.owner,
      images: images ?? this.images,
      totalTracks: totalTracks ?? this.totalTracks,
      tracks: tracks ?? this.tracks,
    );
  }

  /// Get the playlist cover image URL
  String? get imageUrl {
    if (images.isEmpty) return null;
    return images.first.url;
  }

  /// Check if the current user can edit this playlist
  bool canEdit(String currentUserId) {
    return owner.id == currentUserId || isCollaborative;
  }

  /// Get formatted track count string
  String get trackCountFormatted {
    return '$totalTracks ${totalTracks == 1 ? 'song' : 'songs'}';
  }

  /// Calculate total duration of loaded tracks
  Duration get totalDuration {
    final totalMs = tracks.fold<int>(0, (sum, track) => sum + track.durationMs);
    return Duration(milliseconds: totalMs);
  }

  /// Get formatted total duration
  String get totalDurationFormatted {
    final duration = totalDuration;
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0) {
      return '$hours hr $minutes min';
    }
    return '$minutes min';
  }
}

/// Represents a playlist owner
class PlaylistOwner {
  final String id;
  final String displayName;
  final String uri;

  const PlaylistOwner({
    required this.id,
    required this.displayName,
    required this.uri,
  });

  factory PlaylistOwner.fromJson(Map<String, dynamic> json) {
    return PlaylistOwner(
      id: json['id'] as String? ?? '',
      displayName: json['display_name'] as String? ?? 'Unknown',
      uri: json['uri'] as String? ?? '',
    );
  }
}

/// Represents a playlist cover image
class PlaylistImage {
  final String url;
  final int? width;
  final int? height;

  const PlaylistImage({
    required this.url,
    this.width,
    this.height,
  });

  factory PlaylistImage.fromJson(Map<String, dynamic> json) {
    return PlaylistImage(
      url: json['url'] as String? ?? '',
      width: json['width'] as int?,
      height: json['height'] as int?,
    );
  }
}
