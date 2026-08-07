class AppConfig {
  AppConfig._();

  static const String baseUrl = String.fromEnvironment(
    'PLAY_BASE_URL',
    defaultValue: 'https://play.cloudbr.app',
  );

  static Uri? get configuredOrigin {
    if (baseUrl.trim().isEmpty) return null;
    final uri = Uri.tryParse(baseUrl.trim());
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) return null;
    return originOf(uri);
  }

  static Uri originOf(Uri uri) => Uri(
    scheme: uri.scheme,
    userInfo: uri.userInfo,
    host: uri.host,
    port: uri.hasPort ? uri.port : null,
  );

  static Uri playUri(Uri origin, int roomId) => origin.replace(
    path: '/play',
    queryParameters: {'pin': roomId.toString().padLeft(6, '0')},
  );

  static Uri roomUri(Uri origin, int roomId) =>
      origin.replace(path: '/api/rooms/$roomId', query: null);

  static Uri websocketUri(Uri origin) => origin.replace(
    scheme: origin.scheme == 'https' ? 'wss' : 'ws',
    path: '/ws',
    query: null,
  );
}
