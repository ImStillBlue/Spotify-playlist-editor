import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/playlists/screens/playlists_screen.dart';
import 'features/editor/screens/editor_screen.dart';

/// Main app widget
class SpotifyPlaylistEditorApp extends ConsumerWidget {
  const SpotifyPlaylistEditorApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final router = ref.watch(routerProvider(authState));

    return MaterialApp.router(
      title: 'Spotify Playlist Editor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}

/// Router provider that reacts to auth state
final routerProvider = Provider.family<GoRouter, AuthState>((ref, authState) {
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login';
      final isInitial = authState.status == AuthStatus.initial;
      final isLoading = authState.status == AuthStatus.loading;

      // Still checking auth state
      if (isInitial || isLoading) {
        return null;
      }

      // Not logged in, redirect to login
      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      // Logged in but on login page, redirect to playlists
      if (isLoggedIn && isLoggingIn) {
        return '/';
      }

      return null;
    },
    routes: [
      // Login
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      // Playlists list
      GoRoute(
        path: '/',
        builder: (context, state) => const PlaylistsScreen(),
      ),
      // Playlist editor
      GoRoute(
        path: '/editor/:playlistId',
        builder: (context, state) {
          final playlistId = state.pathParameters['playlistId']!;
          return EditorScreen(playlistId: playlistId);
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
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
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.error.toString(),
              style: const TextStyle(color: SpotifyColors.lightGrey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});
