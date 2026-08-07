import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'controllers/play_controller.dart';
import 'screens/play_screen.dart';
import 'theme/play_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: PlayColors.brand950,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const PlayApp());
}

class PlayApp extends StatefulWidget {
  const PlayApp({super.key});

  @override
  State<PlayApp> createState() => _PlayAppState();
}

class _PlayAppState extends State<PlayApp> with WidgetsBindingObserver {
  late final PlayController _controller;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _controller = PlayController();
    unawaited(_controller.initialize());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _controller.reconnectNow();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Play! Quiz CloudBR',
      debugShowCheckedModeBanner: false,
      theme: buildPlayTheme(),
      home: PlayScreen(controller: _controller),
    );
  }
}
