/// Spotify API Configuration
///
/// To set up your Spotify Developer App:
/// 1. Go to https://developer.spotify.com/dashboard
/// 2. Create a new app
/// 3. Add the redirect URI below to your app settings
/// 4. Copy your Client ID and paste it below
class SpotifyConfig {
  /// Your Spotify Client ID from the Developer Dashboard
  /// TODO: Replace with your actual Client ID
  static const String clientId = 'c41e8c72e67141cbbf3f6765c06738b7';

  /// Redirect URI for OAuth callback
  /// This must match exactly what you set in the Spotify Developer Dashboard
  static const String redirectUri = 'com.spotifyeditor.app://callback';

  /// Spotify API base URL
  static const String apiBaseUrl = 'https://api.spotify.com/v1';

  /// Spotify Accounts base URL (for auth)
  static const String accountsBaseUrl = 'https://accounts.spotify.com';

  /// Authorization endpoint
  static const String authorizationEndpoint = '$accountsBaseUrl/authorize';

  /// Token endpoint
  static const String tokenEndpoint = '$accountsBaseUrl/api/token';

  /// OAuth scopes required for the app
  /// These permissions allow reading and modifying playlists
  static const List<String> scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-library-read',
    'user-read-private',
    'user-read-email',
  ];

  /// Combined scopes as a single string
  static String get scopesString => scopes.join(' ');
}
