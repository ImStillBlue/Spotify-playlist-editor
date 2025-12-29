import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/config/spotify_config.dart';

/// Handles Spotify OAuth 2.0 authentication with PKCE
class AuthRepository {
  final FlutterAppAuth _appAuth;
  final FlutterSecureStorage _secureStorage;

  // Storage keys
  static const String _accessTokenKey = 'spotify_access_token';
  static const String _refreshTokenKey = 'spotify_refresh_token';
  static const String _expiresAtKey = 'spotify_expires_at';

  AuthRepository()
      : _appAuth = const FlutterAppAuth(),
        _secureStorage = const FlutterSecureStorage();

  /// Perform OAuth 2.0 login with PKCE
  Future<AuthResult> login() async {
    try {
      final result = await _appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          SpotifyConfig.clientId,
          SpotifyConfig.redirectUri,
          serviceConfiguration: const AuthorizationServiceConfiguration(
            authorizationEndpoint: SpotifyConfig.authorizationEndpoint,
            tokenEndpoint: SpotifyConfig.tokenEndpoint,
          ),
          scopes: SpotifyConfig.scopes,
        ),
      );

      if (result == null) {
        throw AuthException('Login was cancelled');
      }

      // Store tokens securely
      await _saveTokens(result);

      return AuthResult(
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken,
        expiresAt: result.accessTokenExpirationDateTime,
      );
    } catch (e) {
      throw AuthException('Login failed: $e');
    }
  }

  /// Refresh the access token using the refresh token
  Future<AuthResult?> refreshAccessToken() async {
    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);

    if (refreshToken == null) {
      return null;
    }

    try {
      final result = await _appAuth.token(
        TokenRequest(
          SpotifyConfig.clientId,
          SpotifyConfig.redirectUri,
          refreshToken: refreshToken,
          serviceConfiguration: const AuthorizationServiceConfiguration(
            authorizationEndpoint: SpotifyConfig.authorizationEndpoint,
            tokenEndpoint: SpotifyConfig.tokenEndpoint,
          ),
        ),
      );

      if (result == null) {
        return null;
      }

      // Store new tokens
      await _saveTokens(result);

      return AuthResult(
        accessToken: result.accessToken!,
        refreshToken: result.refreshToken ?? refreshToken,
        expiresAt: result.accessTokenExpirationDateTime,
      );
    } catch (e) {
      // If refresh fails, clear stored tokens
      await logout();
      return null;
    }
  }

  /// Get the stored access token if valid
  Future<AuthResult?> getStoredAuth() async {
    final accessToken = await _secureStorage.read(key: _accessTokenKey);
    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    final expiresAtStr = await _secureStorage.read(key: _expiresAtKey);

    if (accessToken == null) {
      return null;
    }

    DateTime? expiresAt;
    if (expiresAtStr != null) {
      expiresAt = DateTime.tryParse(expiresAtStr);
    }

    // Check if token is expired or about to expire (5 min buffer)
    if (expiresAt != null) {
      final now = DateTime.now();
      final buffer = expiresAt.subtract(const Duration(minutes: 5));
      if (now.isAfter(buffer)) {
        // Token expired or expiring soon, try to refresh
        return await refreshAccessToken();
      }
    }

    return AuthResult(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAt,
    );
  }

  /// Clear stored tokens and log out
  Future<void> logout() async {
    await _secureStorage.delete(key: _accessTokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _expiresAtKey);
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final auth = await getStoredAuth();
    return auth != null;
  }

  /// Save tokens to secure storage
  Future<void> _saveTokens(TokenResponse result) async {
    if (result.accessToken != null) {
      await _secureStorage.write(
        key: _accessTokenKey,
        value: result.accessToken,
      );
    }
    if (result.refreshToken != null) {
      await _secureStorage.write(
        key: _refreshTokenKey,
        value: result.refreshToken,
      );
    }
    if (result.accessTokenExpirationDateTime != null) {
      await _secureStorage.write(
        key: _expiresAtKey,
        value: result.accessTokenExpirationDateTime!.toIso8601String(),
      );
    }
  }
}

/// Result of authentication
class AuthResult {
  final String accessToken;
  final String? refreshToken;
  final DateTime? expiresAt;

  AuthResult({
    required this.accessToken,
    this.refreshToken,
    this.expiresAt,
  });

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }
}

/// Authentication exception
class AuthException implements Exception {
  final String message;
  AuthException(this.message);

  @override
  String toString() => message;
}
