import 'package:dio/dio.dart';
import '../core/config/spotify_config.dart';
import '../features/playlists/data/models/playlist.dart';
import '../features/playlists/data/models/track.dart';

/// Service for interacting with the Spotify Web API
class SpotifyApiService {
  final Dio _dio;
  String? _accessToken;

  SpotifyApiService() : _dio = Dio() {
    _dio.options.baseUrl = SpotifyConfig.apiBaseUrl;
    // Minimal logging - only errors, not full request/response bodies
    _dio.interceptors.add(LogInterceptor(
      request: false,
      requestHeader: false,
      requestBody: false,
      responseHeader: false,
      responseBody: false,
      error: true,
      logPrint: (log) => print('Spotify API: $log'),
    ));
  }

  /// Set the access token for API requests
  void setAccessToken(String token) {
    _accessToken = token;
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  /// Clear the access token (on logout)
  void clearAccessToken() {
    _accessToken = null;
    _dio.options.headers.remove('Authorization');
  }

  /// Check if we have a valid access token
  bool get hasAccessToken => _accessToken != null;

  // ============ User Profile ============

  /// Get the current user's profile
  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await _dio.get('/me');
    return response.data as Map<String, dynamic>;
  }

  // ============ Playlists ============

  /// Get the current user's playlists
  Future<List<Playlist>> getUserPlaylists({int limit = 50, int offset = 0}) async {
    final response = await _dio.get(
      '/me/playlists',
      queryParameters: {
        'limit': limit,
        'offset': offset,
      },
    );

    final items = response.data['items'] as List<dynamic>;
    return items
        .where((item) => item != null)
        .map((item) => Playlist.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// Get all user playlists (handles pagination)
  Future<List<Playlist>> getAllUserPlaylists() async {
    final List<Playlist> allPlaylists = [];
    int offset = 0;
    const limit = 50;
    bool hasMore = true;

    while (hasMore) {
      final playlists = await getUserPlaylists(limit: limit, offset: offset);
      allPlaylists.addAll(playlists);
      offset += limit;
      hasMore = playlists.length == limit;
    }

    return allPlaylists;
  }

  /// Get a specific playlist by ID (metadata only)
  Future<Playlist> getPlaylist(String playlistId) async {
    final response = await _dio.get('/playlists/$playlistId');
    return Playlist.fromJson(response.data as Map<String, dynamic>);
  }

  /// Get playlist with all tracks in optimized calls
  /// First call gets metadata + first 100 tracks, then paginates only if needed
  Future<({Playlist playlist, List<Track> tracks})> getPlaylistWithTracks(
    String playlistId,
  ) async {
    // Single call gets playlist metadata + first 100 tracks
    final response = await _dio.get(
      '/playlists/$playlistId',
      queryParameters: {
        'fields': 'id,name,description,uri,snapshot_id,public,collaborative,'
            'owner(id,display_name,uri),'
            'images,'
            'tracks(total,items(added_at,added_by.id,track(id,uri,name,duration_ms,preview_url,'
            'artists(id,name,uri),album(id,name,uri,images,release_date))))',
      },
    );

    final data = response.data as Map<String, dynamic>;
    final playlist = Playlist.fromJson(data);

    // Parse first batch of tracks from the playlist response
    final tracksData = data['tracks'] as Map<String, dynamic>;
    final totalTracks = tracksData['total'] as int;
    final firstItems = tracksData['items'] as List<dynamic>;

    final List<Track> allTracks = firstItems
        .where((item) => item != null && item['track'] != null)
        .map((item) => Track.fromJson(item as Map<String, dynamic>))
        .toList();

    // Only paginate if there are more tracks beyond the first 100
    if (totalTracks > 100) {
      int offset = 100;
      const limit = 100;

      while (offset < totalTracks) {
        final tracks = await getPlaylistTracks(
          playlistId,
          limit: limit,
          offset: offset,
        );
        allTracks.addAll(tracks);
        offset += limit;
      }
    }

    return (playlist: playlist, tracks: allTracks);
  }

  // ============ Playlist Tracks ============

  /// Get tracks from a playlist
  Future<List<Track>> getPlaylistTracks(
    String playlistId, {
    int limit = 100,
    int offset = 0,
  }) async {
    final response = await _dio.get(
      '/playlists/$playlistId/tracks',
      queryParameters: {
        'limit': limit,
        'offset': offset,
        'fields':
            'items(added_at,added_by.id,track(id,uri,name,duration_ms,preview_url,artists(id,name,uri),album(id,name,uri,images,release_date)))',
      },
    );

    final items = response.data['items'] as List<dynamic>;
    return items
        .where((item) => item != null && item['track'] != null)
        .map((item) => Track.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// Get all tracks from a playlist (handles pagination)
  Future<List<Track>> getAllPlaylistTracks(String playlistId) async {
    final List<Track> allTracks = [];
    int offset = 0;
    const limit = 100;
    bool hasMore = true;

    while (hasMore) {
      final tracks = await getPlaylistTracks(
        playlistId,
        limit: limit,
        offset: offset,
      );
      allTracks.addAll(tracks);
      offset += limit;
      hasMore = tracks.length == limit;
    }

    return allTracks;
  }

  // ============ Playlist Modifications ============

  /// Reorder tracks in a playlist
  ///
  /// [rangeStart] - The position of the first track to be reordered
  /// [insertBefore] - The position where the tracks should be inserted
  /// [rangeLength] - The number of tracks to be reordered (default: 1)
  /// [snapshotId] - The playlist's snapshot ID for optimistic concurrency
  Future<String> reorderTracks({
    required String playlistId,
    required int rangeStart,
    required int insertBefore,
    int rangeLength = 1,
    String? snapshotId,
  }) async {
    final body = <String, dynamic>{
      'range_start': rangeStart,
      'insert_before': insertBefore,
      'range_length': rangeLength,
      if (snapshotId != null) 'snapshot_id': snapshotId,
    };

    final response = await _dio.put(
      '/playlists/$playlistId/tracks',
      data: body,
    );

    return response.data['snapshot_id'] as String;
  }

  /// Remove tracks from a playlist (batched for large lists)
  Future<String> removeTracks({
    required String playlistId,
    required List<String> trackUris,
    String? snapshotId,
  }) async {
    const batchSize = 100;
    String currentSnapshotId = snapshotId ?? '';

    for (var i = 0; i < trackUris.length; i += batchSize) {
      final batch = trackUris.skip(i).take(batchSize).toList();

      // Small delay between batches to respect rate limits
      if (i > 0) {
        await Future.delayed(const Duration(milliseconds: 100));
      }

      final body = <String, dynamic>{
        'tracks': batch.map((uri) => {'uri': uri}).toList(),
        if (currentSnapshotId.isNotEmpty) 'snapshot_id': currentSnapshotId,
      };

      final response = await _dio.delete(
        '/playlists/$playlistId/tracks',
        data: body,
      );
      currentSnapshotId = response.data['snapshot_id'] as String;
    }

    return currentSnapshotId;
  }

  /// Add tracks to a playlist (batched for large lists)
  Future<String> addTracks({
    required String playlistId,
    required List<String> trackUris,
    int? position,
  }) async {
    const batchSize = 100;
    String snapshotId = '';
    int currentPosition = position ?? 0;

    for (var i = 0; i < trackUris.length; i += batchSize) {
      final batch = trackUris.skip(i).take(batchSize).toList();

      // Small delay between batches to respect rate limits
      if (i > 0) {
        await Future.delayed(const Duration(milliseconds: 100));
      }

      final body = <String, dynamic>{'uris': batch};
      if (position != null) {
        body['position'] = currentPosition;
        currentPosition += batch.length;
      }

      final response = await _dio.post(
        '/playlists/$playlistId/tracks',
        data: body,
      );
      snapshotId = response.data['snapshot_id'] as String;
    }

    return snapshotId;
  }

  /// Replace all tracks in a playlist (useful for bulk reordering)
  /// Handles batching for playlists with more than 100 tracks
  Future<String> replaceTracks({
    required String playlistId,
    required List<String> trackUris,
  }) async {
    const batchSize = 100;
    String snapshotId;

    if (trackUris.isEmpty) {
      // Clear the playlist
      final response = await _dio.put(
        '/playlists/$playlistId/tracks',
        data: {'uris': <String>[]},
      );
      return response.data['snapshot_id'] as String;
    }

    // First batch: replace (clears playlist and adds first 100)
    final firstBatch = trackUris.take(batchSize).toList();
    final response = await _dio.put(
      '/playlists/$playlistId/tracks',
      data: {'uris': firstBatch},
    );
    snapshotId = response.data['snapshot_id'] as String;

    // Remaining batches: add in chunks of 100
    if (trackUris.length > batchSize) {
      final remaining = trackUris.skip(batchSize).toList();

      for (var i = 0; i < remaining.length; i += batchSize) {
        final batch = remaining.skip(i).take(batchSize).toList();

        // Small delay between batches to respect rate limits
        if (i > 0) {
          await Future.delayed(const Duration(milliseconds: 100));
        }

        final addResponse = await _dio.post(
          '/playlists/$playlistId/tracks',
          data: {'uris': batch},
        );
        snapshotId = addResponse.data['snapshot_id'] as String;
      }
    }

    return snapshotId;
  }

  // ============ Error Handling ============

  /// Wrap API calls with error handling
  Future<T> handleApiCall<T>(Future<T> Function() apiCall) async {
    try {
      return await apiCall();
    } on DioException catch (e) {
      if (e.response != null) {
        final statusCode = e.response!.statusCode;
        final message = e.response!.data?['error']?['message'] ?? e.message;

        switch (statusCode) {
          case 401:
            throw SpotifyAuthException('Access token expired or invalid');
          case 403:
            throw SpotifyForbiddenException('Permission denied: $message');
          case 404:
            throw SpotifyNotFoundException('Resource not found: $message');
          case 429:
            throw SpotifyRateLimitException('Rate limit exceeded');
          default:
            throw SpotifyApiException('API error ($statusCode): $message');
        }
      }
      throw SpotifyApiException('Network error: ${e.message}');
    }
  }
}

// ============ Custom Exceptions ============

class SpotifyApiException implements Exception {
  final String message;
  SpotifyApiException(this.message);

  @override
  String toString() => message;
}

class SpotifyAuthException extends SpotifyApiException {
  SpotifyAuthException(super.message);
}

class SpotifyForbiddenException extends SpotifyApiException {
  SpotifyForbiddenException(super.message);
}

class SpotifyNotFoundException extends SpotifyApiException {
  SpotifyNotFoundException(super.message);
}

class SpotifyRateLimitException extends SpotifyApiException {
  SpotifyRateLimitException(super.message);
}
