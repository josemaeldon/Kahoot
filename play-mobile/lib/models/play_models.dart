enum PlayStage { join, lobby, answer, answerSent, result, finished }

enum ConnectionStatus { idle, connecting, connected, reconnecting }

class PlayerSession {
  const PlayerSession({
    required this.roomId,
    required this.username,
    required this.sessionToken,
    required this.baseUrl,
  });

  final int roomId;
  final String username;
  final String sessionToken;
  final String baseUrl;

  Map<String, Object> toJson() => {
    'roomId': roomId,
    'username': username,
    'sessionToken': sessionToken,
    'baseUrl': baseUrl,
  };

  factory PlayerSession.fromJson(Map<String, dynamic> json) => PlayerSession(
    roomId: json['roomId'] as int,
    username: json['username'] as String,
    sessionToken: json['sessionToken'] as String,
    baseUrl: json['baseUrl'] as String,
  );
}

class RoomSummary {
  const RoomSummary({
    required this.roomId,
    required this.status,
    required this.playerCount,
  });

  final int roomId;
  final String status;
  final int playerCount;

  factory RoomSummary.fromJson(Map<String, dynamic> json) => RoomSummary(
    roomId: json['roomId'] as int,
    status: json['status'] as String,
    playerCount: json['playerCount'] as int,
  );
}

class RankingEntry {
  const RankingEntry({required this.username, required this.points});

  final String username;
  final int points;

  factory RankingEntry.fromJson(Map<String, dynamic> json) => RankingEntry(
    username: json['username'] as String,
    points: json['points'] as int,
  );
}
