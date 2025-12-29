import 'package:flutter/material.dart';

/// Spotify-inspired color palette with Material 3
class SpotifyColors {
  // Primary Spotify colors
  static const Color spotifyGreen = Color(0xFF1DB954);
  static const Color spotifyBlack = Color(0xFF191414);
  static const Color darkGrey = Color(0xFF282828);
  static const Color mediumGrey = Color(0xFF404040);
  static const Color lightGrey = Color(0xFFB3B3B3);
  static const Color white = Color(0xFFFFFFFF);

  // Additional UI colors
  static const Color error = Color(0xFFE91429);
  static const Color warning = Color(0xFFF59B23);
  static const Color success = spotifyGreen;
  static const Color cardBackground = Color(0xFF181818);
  static const Color divider = Color(0xFF404040);
}

/// App theme configuration using Material 3 with Spotify aesthetic
class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: SpotifyColors.spotifyGreen,
        onPrimary: SpotifyColors.spotifyBlack,
        secondary: SpotifyColors.spotifyGreen,
        onSecondary: SpotifyColors.spotifyBlack,
        surface: SpotifyColors.darkGrey,
        onSurface: SpotifyColors.white,
        error: SpotifyColors.error,
        onError: SpotifyColors.white,
      ),
      scaffoldBackgroundColor: SpotifyColors.spotifyBlack,
      cardColor: SpotifyColors.cardBackground,
      dividerColor: SpotifyColors.divider,

      // AppBar theme
      appBarTheme: const AppBarTheme(
        backgroundColor: SpotifyColors.spotifyBlack,
        foregroundColor: SpotifyColors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: SpotifyColors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),

      // Card theme
      cardTheme: CardThemeData(
        color: SpotifyColors.cardBackground,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),

      // Elevated button theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SpotifyColors.spotifyGreen,
          foregroundColor: SpotifyColors.spotifyBlack,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ),

      // Text button theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: SpotifyColors.white,
        ),
      ),

      // Icon theme
      iconTheme: const IconThemeData(
        color: SpotifyColors.white,
      ),

      // List tile theme
      listTileTheme: const ListTileThemeData(
        textColor: SpotifyColors.white,
        iconColor: SpotifyColors.lightGrey,
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),

      // Checkbox theme
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return SpotifyColors.spotifyGreen;
          }
          return SpotifyColors.mediumGrey;
        }),
        checkColor: WidgetStateProperty.all(SpotifyColors.spotifyBlack),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
      ),

      // Floating action button theme
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: SpotifyColors.spotifyGreen,
        foregroundColor: SpotifyColors.spotifyBlack,
      ),

      // Snackbar theme
      snackBarTheme: SnackBarThemeData(
        backgroundColor: SpotifyColors.darkGrey,
        contentTextStyle: const TextStyle(color: SpotifyColors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),

      // Search bar theme
      searchBarTheme: SearchBarThemeData(
        backgroundColor: WidgetStateProperty.all(SpotifyColors.darkGrey),
        elevation: WidgetStateProperty.all(0),
        hintStyle: WidgetStateProperty.all(
          const TextStyle(color: SpotifyColors.lightGrey),
        ),
        textStyle: WidgetStateProperty.all(
          const TextStyle(color: SpotifyColors.white),
        ),
      ),

      // Text theme
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.bold,
        ),
        displayMedium: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.bold,
        ),
        displaySmall: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.bold,
        ),
        headlineLarge: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.bold,
        ),
        headlineMedium: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.bold,
        ),
        headlineSmall: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.bold,
        ),
        titleLarge: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.w600,
        ),
        titleMedium: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.w500,
        ),
        titleSmall: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.w500,
        ),
        bodyLarge: TextStyle(
          color: SpotifyColors.white,
        ),
        bodyMedium: TextStyle(
          color: SpotifyColors.white,
        ),
        bodySmall: TextStyle(
          color: SpotifyColors.lightGrey,
        ),
        labelLarge: TextStyle(
          color: SpotifyColors.white,
          fontWeight: FontWeight.w500,
        ),
        labelMedium: TextStyle(
          color: SpotifyColors.lightGrey,
        ),
        labelSmall: TextStyle(
          color: SpotifyColors.lightGrey,
        ),
      ),
    );
  }
}
