import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/play_models.dart';

class SessionStore {
  static const _key = 'play-player-session-v1';

  Future<PlayerSession?> load() async {
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_key);
    if (value == null) return null;
    try {
      return PlayerSession.fromJson(jsonDecode(value) as Map<String, dynamic>);
    } catch (_) {
      await preferences.remove(_key);
      return null;
    }
  }

  Future<void> save(PlayerSession session) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_key, jsonEncode(session.toJson()));
  }

  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_key);
  }
}
