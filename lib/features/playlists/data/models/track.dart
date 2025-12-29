/// Represents a track/song in a Spotify playlist
class Track {
  final String id;
  final String uri;
  final String name;
  final int durationMs;
  final String? previewUrl;
  final List<Artist> artists;
  final Album album;
  final DateTime? addedAt;
  final String? addedBy;

  const Track({
    required this.id,
    required this.uri,
    required this.name,
    required this.durationMs,
    this.previewUrl,
    required this.artists,
    required this.album,
    this.addedAt,
    this.addedBy,
  });

  /// Create Track from Spotify API JSON response
  factory Track.fromJson(Map<String, dynamic> json) {
    final trackData = json['track'] as Map<String, dynamic>?;

    // Handle both playlist track items and direct track objects
    final track = trackData ?? json;

    return Track(
      id: track['id'] as String? ?? '',
      uri: track['uri'] as String? ?? '',
      name: track['name'] as String? ?? 'Unknown Track',
      durationMs: track['duration_ms'] as int? ?? 0,
      previewUrl: track['preview_url'] as String?,
      artists: (track['artists'] as List<dynamic>?)
              ?.map((a) => Artist.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
      album: Album.fromJson(track['album'] as Map<String, dynamic>? ?? {}),
      addedAt: json['added_at'] != null
          ? DateTime.tryParse(json['added_at'] as String)
          : null,
      addedBy: (json['added_by'] as Map<String, dynamic>?)?['id'] as String?,
    );
  }

  /// Get formatted duration string (e.g., "3:45")
  String get durationFormatted {
    final minutes = durationMs ~/ 60000;
    final seconds = (durationMs % 60000) ~/ 1000;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  /// Get artist names as a comma-separated string
  String get artistNames => artists.map((a) => a.name).join(', ');

  /// Get the album cover image URL (medium size)
  String? get albumImageUrl => album.imageUrl;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Track && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Represents an artist
class Artist {
  final String id;
  final String name;
  final String uri;

  const Artist({
    required this.id,
    required this.name,
    required this.uri,
  });

  factory Artist.fromJson(Map<String, dynamic> json) {
    return Artist(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown Artist',
      uri: json['uri'] as String? ?? '',
    );
  }
}

/// Represents an album
class Album {
  final String id;
  final String name;
  final String uri;
  final List<AlbumImage> images;
  final String? releaseDate;

  const Album({
    required this.id,
    required this.name,
    required this.uri,
    required this.images,
    this.releaseDate,
  });

  factory Album.fromJson(Map<String, dynamic> json) {
    return Album(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown Album',
      uri: json['uri'] as String? ?? '',
      images: (json['images'] as List<dynamic>?)
              ?.map((i) => AlbumImage.fromJson(i as Map<String, dynamic>))
              .toList() ??
          [],
      releaseDate: json['release_date'] as String?,
    );
  }

  /// Get the best image URL (prefers medium size ~300px)
  String? get imageUrl {
    if (images.isEmpty) return null;
    // Try to find medium-sized image, fallback to first available
    final medium = images.where((i) => i.width != null && i.width! <= 300);
    return medium.isNotEmpty ? medium.first.url : images.first.url;
  }

  /// Get the largest image URL
  String? get largeImageUrl {
    if (images.isEmpty) return null;
    return images.first.url; // Spotify returns largest first
  }
}

/// Represents an album cover image
class AlbumImage {
  final String url;
  final int? width;
  final int? height;

  const AlbumImage({
    required this.url,
    this.width,
    this.height,
  });

  factory AlbumImage.fromJson(Map<String, dynamic> json) {
    return AlbumImage(
      url: json['url'] as String? ?? '',
      width: json['width'] as int?,
      height: json['height'] as int?,
    );
  }
}
