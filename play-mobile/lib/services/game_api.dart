import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/play_models.dart';

class GameApiException implements Exception {
  const GameApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class GameApi {
  const GameApi({this._client});

  final http.Client? _client;

  Future<RoomSummary> getRoom(Uri origin, int roomId) async {
    final client = _client ?? http.Client();
    try {
      final response = await client
          .get(
            AppConfig.roomUri(origin, roomId),
            headers: const {'Accept': 'application/json'},
          )
          .timeout(const Duration(seconds: 6));
      if (response.statusCode == 404) {
        throw const GameApiException('Sala não encontrada.');
      }
      if (response.statusCode != 200) {
        throw const GameApiException(
          'Não foi possível consultar a sala agora.',
        );
      }
      return RoomSummary.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    } on GameApiException {
      rethrow;
    } catch (_) {
      throw const GameApiException(
        'Sem conexão com o servidor. Verifique sua internet.',
      );
    } finally {
      if (_client == null) client.close();
    }
  }
}
