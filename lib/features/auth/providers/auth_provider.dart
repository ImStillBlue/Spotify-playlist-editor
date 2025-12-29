import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../services/spotify_api_service.dart';
import '../data/auth_repository.dart';

/// Authentication state
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

/// State class for authentication
class AuthState {
  final AuthStatus status;
  final AuthResult? authResult;
  final UserProfile? userProfile;
  final String? errorMessage;

  const AuthState({
    this.status = AuthStatus.initial,
    this.authResult,
    this.userProfile,
    this.errorMessage,
  });

  AuthState copyWith({
    AuthStatus? status,
    AuthResult? authResult,
    UserProfile? userProfile,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      authResult: authResult ?? this.authResult,
      userProfile: userProfile ?? this.userProfile,
      errorMessage: errorMessage,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

/// User profile data
class UserProfile {
  final String id;
  final String displayName;
  final String? email;
  final String? imageUrl;

  UserProfile({
    required this.id,
    required this.displayName,
    this.email,
    this.imageUrl,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final images = json['images'] as List<dynamic>?;
    String? imageUrl;
    if (images != null && images.isNotEmpty) {
      imageUrl = images.first['url'] as String?;
    }

    return UserProfile(
      id: json['id'] as String,
      displayName: json['display_name'] as String? ?? 'User',
      email: json['email'] as String?,
      imageUrl: imageUrl,
    );
  }
}

/// Auth state notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final SpotifyApiService _apiService;

  AuthNotifier(this._authRepository, this._apiService)
      : super(const AuthState());

  /// Check for existing authentication on app start
  Future<void> checkAuth() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final auth = await _authRepository.getStoredAuth();

      if (auth != null) {
        _apiService.setAccessToken(auth.accessToken);
        final profile = await _fetchUserProfile();

        state = AuthState(
          status: AuthStatus.authenticated,
          authResult: auth,
          userProfile: profile,
        );
      } else {
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        errorMessage: e.toString(),
      );
    }
  }

  /// Perform login
  Future<void> login() async {
    state = state.copyWith(status: AuthStatus.loading);

    try {
      final auth = await _authRepository.login();
      _apiService.setAccessToken(auth.accessToken);
      final profile = await _fetchUserProfile();

      state = AuthState(
        status: AuthStatus.authenticated,
        authResult: auth,
        userProfile: profile,
      );
    } catch (e) {
      state = AuthState(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  /// Perform logout
  Future<void> logout() async {
    await _authRepository.logout();
    _apiService.clearAccessToken();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Refresh access token
  Future<bool> refreshToken() async {
    try {
      final auth = await _authRepository.refreshAccessToken();
      if (auth != null) {
        _apiService.setAccessToken(auth.accessToken);
        state = state.copyWith(authResult: auth);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Fetch user profile from API
  Future<UserProfile> _fetchUserProfile() async {
    final userData = await _apiService.getCurrentUser();
    return UserProfile.fromJson(userData);
  }
}

// ============ Providers ============

/// Auth repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

/// Spotify API service provider
final spotifyApiServiceProvider = Provider<SpotifyApiService>((ref) {
  return SpotifyApiService();
});

/// Auth state provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  final apiService = ref.watch(spotifyApiServiceProvider);
  return AuthNotifier(authRepository, apiService);
});

/// Current user ID provider (convenience)
final currentUserIdProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).userProfile?.id;
});
