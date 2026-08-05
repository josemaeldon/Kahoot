import 'package:flutter/material.dart';

abstract final class PlayColors {
  static const brand950 = Color(0xFF16093D);
  static const brand900 = Color(0xFF24105C);
  static const brand800 = Color(0xFF3D1A91);
  static const brand600 = Color(0xFF7045E8);
  static const brand500 = Color(0xFF8158F5);
  static const lavender = Color(0xFFCABAFF);
  static const red = Color(0xFFE44855);
  static const blue = Color(0xFF2477D4);
  static const yellow = Color(0xFFF1AE2B);
  static const green = Color(0xFF2FA86F);
}

ThemeData buildPlayTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: PlayColors.brand600,
    brightness: Brightness.dark,
  );
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: scheme,
    scaffoldBackgroundColor: PlayColors.brand950,
    fontFamily: 'sans-serif',
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: PlayColors.brand600,
      selectionColor: Color(0x558158F5),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      hintStyle: const TextStyle(
        color: Color(0xFF8D8B99),
        fontWeight: FontWeight.w600,
      ),
      labelStyle: const TextStyle(color: Colors.white70),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: PlayColors.brand500, width: 2),
      ),
    ),
  );
}
