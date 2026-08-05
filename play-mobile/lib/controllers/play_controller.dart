import 'dart:async';

import 'package:flutter/foundation.dart';

import '../config/app_config.dart';
import '../models/play_models.dart';
import '../services/game_api.dart';
import '../services/game_socket.dart';
import '../services/session_store.dart';

class PlayController extends ChangeNotifier {
  PlayController({GameApi? api, SessionStore? sessionStore})
    : _api = api ?? const GameApi(),
      _sessionStore = sessionStore ?? SessionStore();

  final GameApi _api;
  final SessionStore _sessionStore;

  PlayStage stage = PlayStage.join;
  ConnectionStatus connectionStatus = ConnectionStatus.idle;
  String username = '';
  int points = 0;
  int? pointGain;
  List<String> choices = const [];
  List<RankingEntry> ranking = const [];
  String? errorMessage;
  RoomSummary? roomSummary;

  PlayerSession? _session;
  Uri? _origin;
  GameSocket? _socket;
  Timer? _reconnectTimer;
  int _reconnectAttempt = 0;
  bool _stopped = false;
  bool _disposed = false;

  bool get canLeave => stage != PlayStage.join;
  bool get isBusy => connectionStatus == ConnectionStatus.connecting;

  Future<void> initialize() async {
    final saved = await _sessionStore.load();
    if (_disposed || saved == null) return;
    _session = saved;
    _origin = Uri.tryParse(saved.baseUrl);
    if (_origin == null) {
      await _reset(message: 'Escaneie novamente o QR Code da sala.');
      return;
    }
    username = saved.username;
    stage = PlayStage.lobby;
    connectionStatus = ConnectionStatus.reconnecting;
    _notify();
    await _resume();
  }

  Future<void> join({
    required String pin,
    required String playerName,
    Uri? origin,
  }) async {
    final normalizedPin = pin.replaceAll(RegExp(r'\s'), '');
    final normalizedName = playerName.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(normalizedPin)) {
      throw const GameApiException('Informe um PIN de 6 números.');
    }
    if (normalizedName.length < 2 || normalizedName.length > 24) {
      throw const GameApiException(
        'Seu nome deve ter entre 2 e 24 caracteres.',
      );
    }

    _stopped = false;
    errorMessage = null;
    connectionStatus = ConnectionStatus.connecting;
    _notify();

    final roomId = int.parse(normalizedPin);
    final selectedOrigin = origin ?? AppConfig.configuredOrigin;
    if (selectedOrigin == null) {
      connectionStatus = ConnectionStatus.idle;
      _notify();
      throw const GameApiException(
        'Escaneie o QR Code para identificar o endereço desta sala.',
      );
    }
    _origin = AppConfig.originOf(selectedOrigin);
    try {
      roomSummary = await _api.getRoom(_origin!, roomId);
      username = normalizedName;
      await _connect(
        request: {
          'type': 'joinRoom',
          'roomId': roomId,
          'username': normalizedName,
        },
        roomId: roomId,
        playerName: normalizedName,
        isResume: false,
      );
    } catch (error) {
      connectionStatus = ConnectionStatus.idle;
      _notify();
      if (error is GameApiException) rethrow;
      throw GameApiException(_friendlyError(error));
    }
  }

  Future<void> _connect({
    required Map<String, Object> request,
    required int roomId,
    required String playerName,
    required bool isResume,
  }) async {
    _socket?.close();
    final origin = _origin;
    if (origin == null) {
      throw const GameApiException('Endereço da sala não identificado.');
    }
    final socket = GameSocket(AppConfig.websocketUri(origin));
    _socket = socket;

    final joined = await socket.open(
      request: request,
      onEvent: _handleEvent,
      onDisconnected: (error) {
        if (_socket == socket) _onDisconnected();
      },
    );
    if (_socket != socket || _stopped) return;

    final token = joined['sessionToken'] as String;
    _session = PlayerSession(
      roomId: roomId,
      username: playerName,
      sessionToken: token,
      baseUrl: origin.toString(),
    );
    await _sessionStore.save(_session!);
    _reconnectAttempt = 0;
    connectionStatus = ConnectionStatus.connected;
    if (!isResume) {
      points = 0;
      pointGain = null;
      choices = const [];
      ranking = const [];
      stage = PlayStage.lobby;
    }
    _notify();
  }

  void _handleEvent(Map<String, dynamic> event) {
    switch (event['type']) {
      case 'keepAlive':
        return;
      case 'nextGame':
        points = 0;
        pointGain = null;
        ranking = const [];
        choices = const [];
        stage = PlayStage.lobby;
      case 'roundBegin':
        points = event['totalPoints'] as int;
        choices = (event['choices'] as List<dynamic>).cast<String>();
        pointGain = null;
        stage = PlayStage.answer;
      case 'roundEnd':
        points = event['totalPoints'] as int;
        pointGain = event['pointGain'] as int?;
        stage = PlayStage.result;
      case 'gameEnd':
        ranking = (event['ranking'] as List<dynamic>)
            .map(
              (entry) => RankingEntry.fromJson(entry as Map<String, dynamic>),
            )
            .toList(growable: false);
        stage = PlayStage.finished;
      default:
        return;
    }
    _notify();
  }

  bool answer(int choice) {
    if (!(_socket?.send({'type': 'answer', 'choice': choice}) ?? false)) {
      _onDisconnected();
      return false;
    }
    stage = PlayStage.answerSent;
    _notify();
    return true;
  }

  void _onDisconnected() {
    if (_stopped || _session == null || _disposed) return;
    connectionStatus = ConnectionStatus.reconnecting;
    _notify();
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_reconnectTimer != null || _stopped || _session == null) return;
    final attempt = _reconnectAttempt++;
    final milliseconds = attempt == 0
        ? 250
        : (500 * (1 << (attempt - 1).clamp(0, 4))).clamp(500, 8000);
    _reconnectTimer = Timer(Duration(milliseconds: milliseconds), () {
      _reconnectTimer = null;
      unawaited(_resume());
    });
  }

  Future<void> _resume() async {
    final session = _session;
    if (_stopped || session == null || _disposed) return;
    connectionStatus = ConnectionStatus.reconnecting;
    _notify();
    try {
      await _connect(
        request: {
          'type': 'resumeRoom',
          'roomId': session.roomId,
          'username': session.username,
          'sessionToken': session.sessionToken,
        },
        roomId: session.roomId,
        playerName: session.username,
        isResume: true,
      );
    } catch (error) {
      final message = error.toString();
      if (message.contains('Invalid session') ||
          message.contains('Room does not exist')) {
        await _reset(
          message: 'Não foi possível recuperar a partida. Entre novamente.',
        );
        return;
      }
      _scheduleReconnect();
    }
  }

  void reconnectNow() {
    if (_session == null || connectionStatus == ConnectionStatus.connected) {
      return;
    }
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _reconnectAttempt = 0;
    unawaited(_resume());
  }

  Future<void> leave() async {
    _socket?.send({'type': 'leaveRoom'});
    await _reset();
  }

  Future<void> joinAnotherRoom() => _reset();

  Future<void> _reset({String? message}) async {
    _stopped = true;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _socket?.close();
    _socket = null;
    _session = null;
    _origin = null;
    await _sessionStore.clear();
    stage = PlayStage.join;
    connectionStatus = ConnectionStatus.idle;
    username = '';
    points = 0;
    pointGain = null;
    choices = const [];
    ranking = const [];
    roomSummary = null;
    errorMessage = message;
    _notify();
  }

  void clearError() {
    errorMessage = null;
    _notify();
  }

  String _friendlyError(Object error) {
    final text = error.toString();
    if (text.contains('Duplicate user')) {
      return 'Esse nome já está sendo usado na sala.';
    }
    if (text.contains('Room does not exist')) return 'Sala não encontrada.';
    if (text.contains('Invalid username')) return 'Nome de jogador inválido.';
    return 'Não foi possível conectar ao servidor da partida.';
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _reconnectTimer?.cancel();
    _socket?.close();
    super.dispose();
  }
}
