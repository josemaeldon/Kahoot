import 'package:flutter_test/flutter_test.dart';
import 'package:play_mobile/config/app_config.dart';
import 'package:play_mobile/main.dart';
import 'package:play_mobile/screens/scanner_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('lê a origem e o PIN somente de links /play', () {
    final game = extractGameLink('https://quiz.exemplo.com/play?pin=123456');

    expect(game?.pin, '123456');
    expect(game?.origin, Uri.parse('https://quiz.exemplo.com'));
    expect(extractGameLink('https://quiz.exemplo.com/?pin=123456'), isNull);
    expect(extractGameLink('123456'), isNull);
  });

  test('monta o link público sempre em /play', () {
    final link = AppConfig.playUri(
      Uri.parse('https://quiz.exemplo.com/qualquer-rota'),
      123456,
    );

    expect(link.toString(), 'https://quiz.exemplo.com/play?pin=123456');
  });

  testWidgets('exibe somente a entrada da partida', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const PlayApp());
    await tester.pump();

    expect(find.text('Entre na sala'), findsOneWidget);
    expect(find.text('Entrar na sala'), findsOneWidget);
    expect(find.text('Ler Game PIN com a câmera'), findsOneWidget);
  });
}
