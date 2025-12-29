import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(flex: 2),

              // Spotify-style logo/icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: SpotifyColors.spotifyGreen,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.queue_music_rounded,
                  size: 48,
                  color: SpotifyColors.spotifyBlack,
                ),
              ),

              const SizedBox(height: 32),

              // App title
              const Text(
                'Playlist Editor',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: SpotifyColors.white,
                ),
              ),

              const SizedBox(height: 12),

              // Subtitle
              Text(
                'Organize your Spotify playlists\nwith drag & drop',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: SpotifyColors.lightGrey,
                  height: 1.4,
                ),
              ),

              const Spacer(flex: 2),

              // Features list
              _buildFeatureItem(Icons.touch_app, 'Multi-select songs'),
              const SizedBox(height: 16),
              _buildFeatureItem(Icons.drag_indicator, 'Drag to reorder'),
              const SizedBox(height: 16),
              _buildFeatureItem(Icons.undo, 'Undo & redo changes'),

              const Spacer(flex: 2),

              // Error message
              if (authState.status == AuthStatus.error)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    authState.errorMessage ?? 'An error occurred',
                    style: const TextStyle(
                      color: SpotifyColors.error,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),

              // Login button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: authState.isLoading
                      ? null
                      : () => ref.read(authProvider.notifier).login(),
                  child: authState.isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: SpotifyColors.spotifyBlack,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.login, size: 24),
                            SizedBox(width: 12),
                            Text(
                              'Connect with Spotify',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 16),

              // Privacy note
              Text(
                'We only access your playlists.\nNo personal data is stored.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: SpotifyColors.lightGrey.withOpacity(0.7),
                ),
              ),

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String text) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          icon,
          size: 24,
          color: SpotifyColors.spotifyGreen,
        ),
        const SizedBox(width: 12),
        Text(
          text,
          style: const TextStyle(
            fontSize: 16,
            color: SpotifyColors.white,
          ),
        ),
      ],
    );
  }
}
