import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../controllers/play_controller.dart';
import '../models/play_models.dart';
import '../services/game_api.dart';
import '../theme/play_theme.dart';
import 'scanner_screen.dart';

class PlayScreen extends StatelessWidget {
  const PlayScreen({required this.controller, super.key});

  final PlayController controller;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => PlayShell(
        stageLabel: _stageLabel(controller.stage),
        connectionStatus: controller.connectionStatus,
        canLeave: controller.canLeave,
        onLeave: () => _confirmLeave(context),
        child: switch (controller.stage) {
          PlayStage.join => JoinPanel(controller: controller),
          PlayStage.lobby => LobbyPanel(username: controller.username),
          PlayStage.answer => AnswerPanel(controller: controller),
          PlayStage.answerSent => const AnswerSentPanel(),
          PlayStage.result => ResultPanel(controller: controller),
          PlayStage.finished => FinalRankingPanel(controller: controller),
        },
      ),
    );
  }

  Future<void> _confirmLeave(BuildContext context) async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sair da sala?'),
        content: const Text(
          'Você deixará esta partida e poderá entrar em outra sala.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Continuar jogando'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: PlayColors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sair da sala'),
          ),
        ],
      ),
    );
    if (leave == true) await controller.leave();
  }

  String? _stageLabel(PlayStage stage) => switch (stage) {
    PlayStage.join => null,
    PlayStage.lobby => 'Sala de espera',
    PlayStage.answer => 'Escolha uma resposta',
    PlayStage.answerSent => 'Resposta enviada',
    PlayStage.result => 'Resultado da rodada',
    PlayStage.finished => 'Partida concluída',
  };
}

class PlayShell extends StatelessWidget {
  const PlayShell({
    required this.child,
    required this.connectionStatus,
    required this.canLeave,
    required this.onLeave,
    this.stageLabel,
    super.key,
  });

  final Widget child;
  final String? stageLabel;
  final ConnectionStatus connectionStatus;
  final bool canLeave;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    final reconnecting = connectionStatus == ConnectionStatus.reconnecting;
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(-0.9, -0.85),
            radius: 1.45,
            colors: [Color(0xFF4A239E), PlayColors.brand950],
            stops: [0, 0.72],
          ),
        ),
        child: Stack(
          children: [
            const Positioned(
              right: 38,
              top: 150,
              child: _AmbientDot(color: PlayColors.yellow, size: 14),
            ),
            const Positioned(
              left: 25,
              bottom: 105,
              child: _AmbientDot(color: PlayColors.blue, size: 12),
            ),
            SafeArea(
              child: Column(
                children: [
                  Container(
                    constraints: const BoxConstraints(minHeight: 64),
                    padding: const EdgeInsets.symmetric(horizontal: 22),
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Color(0x1AFFFFFF)),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Text(
                          'Play!',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 25,
                            fontStyle: FontStyle.italic,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1.5,
                          ),
                        ),
                        const Spacer(),
                        if (reconnecting) ...[
                          const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          const SizedBox(width: 7),
                          const Text(
                            'Reconectando',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 10),
                        ],
                        if (stageLabel != null && !reconnecting)
                          Flexible(
                            child: Text(
                              stageLabel!.toUpperCase(),
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white60,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ),
                        if (canLeave) ...[
                          const SizedBox(width: 10),
                          IconButton.outlined(
                            tooltip: 'Sair da sala',
                            onPressed: onLeave,
                            icon: const Icon(Icons.logout_rounded, size: 19),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Expanded(
                    child: LayoutBuilder(
                      builder: (context, constraints) => SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(22, 32, 22, 36),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            minHeight: (constraints.maxHeight - 68).clamp(
                              0,
                              double.infinity,
                            ),
                          ),
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 460),
                              child: child,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class JoinPanel extends StatefulWidget {
  const JoinPanel({required this.controller, super.key});

  final PlayController controller;

  @override
  State<JoinPanel> createState() => _JoinPanelState();
}

class _JoinPanelState extends State<JoinPanel> {
  final _pin = TextEditingController();
  final _name = TextEditingController();
  String? _error;
  Uri? _scannedOrigin;

  @override
  void initState() {
    super.initState();
    _error = widget.controller.errorMessage;
  }

  @override
  void dispose() {
    _pin.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _scan() async {
    final game = await Navigator.of(context).push<ScannedGame>(
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
    if (game == null || !mounted) return;
    _pin.text = game.pin;
    _scannedOrigin = game.origin;
    setState(() => _error = null);
  }

  Future<void> _join() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);
    widget.controller.clearError();
    try {
      await widget.controller.join(
        pin: _pin.text,
        playerName: _name.text,
        origin: _scannedOrigin,
      );
    } on GameApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = widget.controller.isBusy;
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x38000000),
            blurRadius: 50,
            offset: Offset(0, 24),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Eyebrow('Jogar ao vivo'),
          const Text(
            'Entre na sala',
            style: TextStyle(
              fontSize: 37,
              height: 1.05,
              fontWeight: FontWeight.w900,
              letterSpacing: -1.8,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Escaneie o QR Code ou digite o PIN mostrado pelo apresentador.',
            style: TextStyle(color: Colors.white60, height: 1.5),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _pin,
            enabled: !busy,
            style: const TextStyle(
              color: Color(0xFF211B32),
              fontWeight: FontWeight.w800,
            ),
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            decoration: InputDecoration(
              hintText: 'Game PIN',
              suffixIcon: IconButton(
                tooltip: 'Escanear QR Code',
                onPressed: busy ? null : _scan,
                icon: const Icon(
                  Icons.qr_code_scanner_rounded,
                  color: PlayColors.brand600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _name,
            enabled: !busy,
            style: const TextStyle(
              color: Color(0xFF211B32),
              fontWeight: FontWeight.w800,
            ),
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.done,
            maxLength: 24,
            onSubmitted: (_) {
              if (!busy) _join();
            },
            decoration: const InputDecoration(
              hintText: 'Seu nome',
              counterText: '',
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(
                color: Color(0xFFFFA8AE),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          const SizedBox(height: 18),
          SizedBox(
            height: 54,
            child: FilledButton(
              onPressed: busy ? null : _join,
              style: FilledButton.styleFrom(
                backgroundColor: PlayColors.brand600,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: busy
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 19,
                          height: 19,
                          child: CircularProgressIndicator(strokeWidth: 2.4),
                        ),
                        SizedBox(width: 10),
                        Text('Entrando...'),
                      ],
                    )
                  : const Text(
                      'Entrar na sala',
                      style: TextStyle(fontWeight: FontWeight.w900),
                    ),
            ),
          ),
          const SizedBox(height: 10),
          TextButton.icon(
            onPressed: busy ? null : _scan,
            icon: const Icon(Icons.photo_camera_outlined),
            label: const Text('Ler Game PIN com a câmera'),
          ),
        ],
      ),
    );
  }
}

class LobbyPanel extends StatelessWidget {
  const LobbyPanel({required this.username, super.key});

  final String username;

  @override
  Widget build(BuildContext context) => StatusPanel(
    icon: Icons.wifi_rounded,
    eyebrow: 'Você está dentro!',
    title: 'Vê seu nome na tela?',
    detail: username,
    message: 'Esperando o apresentador começar a partida...',
  );
}

class AnswerPanel extends StatelessWidget {
  const AnswerPanel({required this.controller, super.key});

  final PlayController controller;

  @override
  Widget build(BuildContext context) {
    const colors = [
      PlayColors.red,
      PlayColors.blue,
      PlayColors.yellow,
      PlayColors.green,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Row(
          children: [
            Icon(Icons.schedule_rounded, color: PlayColors.lavender),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Toque na sua resposta',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1.2,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: controller.choices.length.clamp(0, 4),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 14,
            crossAxisSpacing: 14,
            childAspectRatio: 1.05,
          ),
          itemBuilder: (context, index) => Semantics(
            button: true,
            label: 'Resposta ${index + 1}',
            child: Material(
              color: colors[index],
              borderRadius: BorderRadius.circular(20),
              elevation: 8,
              shadowColor: Colors.black45,
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () => controller.answer(index),
                child: Center(child: AnswerShape(index: index)),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class AnswerSentPanel extends StatelessWidget {
  const AnswerSentPanel({super.key});

  @override
  Widget build(BuildContext context) => const StatusPanel(
    icon: Icons.check_rounded,
    iconColor: PlayColors.green,
    eyebrow: 'Tudo certo',
    title: 'Resposta registrada',
    message: 'Agora é só esperar a rodada terminar.',
  );
}

class ResultPanel extends StatelessWidget {
  const ResultPanel({required this.controller, super.key});

  final PlayController controller;

  @override
  Widget build(BuildContext context) {
    final correct = controller.pointGain != null;
    return StatusPanel(
      icon: correct ? Icons.check_rounded : Icons.close_rounded,
      iconColor: correct ? PlayColors.green : PlayColors.red,
      eyebrow: correct ? 'Boa resposta' : 'Quase lá',
      title: correct ? 'Você acertou!' : 'Você errou :(',
      message: correct
          ? '+${controller.pointGain} pontos'
          : 'Você não recebeu nenhum ponto.',
      detail: 'Total: ${controller.points} pontos',
      positiveMessage: correct,
    );
  }
}

class FinalRankingPanel extends StatelessWidget {
  const FinalRankingPanel({required this.controller, super.key});

  final PlayController controller;

  @override
  Widget build(BuildContext context) {
    final position = controller.ranking.indexWhere(
      (entry) => entry.username == controller.username,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Eyebrow('Resultado final'),
        const Text(
          'Classificação',
          style: TextStyle(
            fontSize: 38,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.8,
          ),
        ),
        if (position >= 0) ...[
          const SizedBox(height: 12),
          Text(
            'Sua posição: ${position + 1}º lugar',
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
        const SizedBox(height: 24),
        ...controller.ranking.asMap().entries.map((row) {
          final current = row.value.username == controller.username;
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              color: current
                  ? PlayColors.brand500.withValues(alpha: 0.30)
                  : Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: current
                    ? PlayColors.lavender.withValues(alpha: 0.7)
                    : Colors.white.withValues(alpha: 0.12),
              ),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 34,
                  child: Text(
                    '${row.key + 1}',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
                Expanded(
                  child: Text(
                    row.value.username,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
                Text(
                  '${row.value.points} pontos',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 12),
        SizedBox(
          height: 52,
          child: FilledButton.icon(
            onPressed: controller.joinAnotherRoom,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Entrar em uma nova sala'),
          ),
        ),
      ],
    );
  }
}

class StatusPanel extends StatelessWidget {
  const StatusPanel({
    required this.icon,
    required this.eyebrow,
    required this.title,
    this.iconColor,
    this.detail,
    this.message,
    this.positiveMessage = false,
    super.key,
  });

  final IconData icon;
  final Color? iconColor;
  final String eyebrow;
  final String title;
  final String? detail;
  final String? message;
  final bool positiveMessage;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 82,
          height: 82,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: iconColor ?? Colors.white.withValues(alpha: 0.10),
            border: Border.all(color: Colors.white24),
            boxShadow: const [
              BoxShadow(color: Color(0x10FFFFFF), spreadRadius: 12),
            ],
          ),
          child: Icon(icon, size: 38),
        ),
        const SizedBox(height: 24),
        Eyebrow(eyebrow),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 37,
            height: 1.05,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.7,
          ),
        ),
        if (message != null) ...[
          const SizedBox(height: 14),
          Text(
            message!,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: positiveMessage ? const Color(0xFF79EFA9) : Colors.white60,
              fontSize: positiveMessage ? 23 : 15,
              fontWeight: positiveMessage ? FontWeight.w900 : FontWeight.w500,
              height: 1.5,
            ),
          ),
        ],
        if (detail != null) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
            ),
            child: Text(
              detail!,
              style: const TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ],
    );
  }
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: PlayColors.lavender,
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.3,
      ),
    ),
  );
}

class AnswerShape extends StatelessWidget {
  const AnswerShape({required this.index, super.key});

  final int index;

  @override
  Widget build(BuildContext context) {
    final shape = switch (index) {
      0 => Icons.change_history_rounded,
      1 => Icons.diamond_outlined,
      2 => Icons.circle,
      _ => Icons.square,
    };
    return Icon(shape, color: Colors.white, size: 58);
  }
}

class _AmbientDot extends StatelessWidget {
  const _AmbientDot({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
  );
}
