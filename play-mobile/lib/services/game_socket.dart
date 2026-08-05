import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

typedef GameEventCallback = void Function(Map<String, dynamic> event);

class GameSocket {
  GameSocket(this.uri);

  final Uri uri;
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  bool _closedByClient = false;
  bool _joined = false;

  bool get isConnected => _joined && !_closedByClient;

  Future<Map<String, dynamic>> open({
    required Map<String, Object> request,
    required GameEventCallback onEvent,
    required void Function(Object? error) onDisconnected,
  }) async {
    _closedByClient = false;
    _joined = false;
    final channel = WebSocketChannel.connect(uri);
    _channel = channel;
    final joined = Completer<Map<String, dynamic>>();

    _subscription = channel.stream.listen(
      (message) {
        Map<String, dynamic> event;
        try {
          event = jsonDecode(message as String) as Map<String, dynamic>;
        } catch (_) {
          return;
        }

        if (event['type'] == 'joinFailed') {
          if (!joined.isCompleted) {
            joined.completeError(Exception(event['reason'] ?? 'Join failed'));
          }
          close();
          return;
        }
        if (event['type'] == 'joined') {
          _joined = true;
          if (!joined.isCompleted) joined.complete(event);
          return;
        }
        onEvent(event);
      },
      onError: (Object error) {
        _joined = false;
        if (!joined.isCompleted) joined.completeError(error);
        if (!_closedByClient) onDisconnected(error);
      },
      onDone: () {
        _joined = false;
        if (!joined.isCompleted) {
          joined.completeError(Exception('Connection closed'));
        }
        if (!_closedByClient) onDisconnected(null);
      },
      cancelOnError: true,
    );

    try {
      await channel.ready.timeout(const Duration(seconds: 10));
      channel.sink.add(jsonEncode(request));
      return await joined.future.timeout(const Duration(seconds: 10));
    } catch (_) {
      close();
      rethrow;
    }
  }

  bool send(Map<String, Object> action) {
    if (!isConnected) return false;
    _channel?.sink.add(jsonEncode(action));
    return true;
  }

  void close() {
    if (_closedByClient) return;
    _closedByClient = true;
    _joined = false;
    unawaited(_subscription?.cancel());
    unawaited(_channel?.sink.close());
    _subscription = null;
    _channel = null;
  }
}
