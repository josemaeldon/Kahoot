# Play! Mobile

Cliente Flutter nativo, exclusivo para participar das partidas disponíveis em
`/play`. A interface, os ícones e as animações fazem parte do aplicativo; pela
rede trafegam somente a consulta leve da sala e os eventos JSON em tempo real.

## Descoberta do servidor

O aplicativo não possui um domínio de produção fixo. O QR Code deve conter uma
URL completa neste formato:

```text
https://seu-dominio.example/play?pin=123456
```

Ao ler o QR, o app:

1. exige que a rota seja `/play`;
2. extrai o Game PIN;
3. identifica a origem (`https://seu-dominio.example`);
4. consulta `/api/rooms/123456` nessa origem;
5. abre o WebSocket `/ws` na mesma origem.

Para permitir a digitação manual do PIN antes de qualquer leitura de QR, passe
a origem no build. O valor pode incluir `/play`; somente a origem será usada:

```bash
flutter run --dart-define=PLAY_BASE_URL=https://seu-dominio.example/play
```

Sem essa opção, a primeira entrada deve ser feita pela câmera para que o
servidor seja identificado.

## Executar e validar

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

Android e iOS já incluem as declarações de uso da câmera. Para um servidor
local, use o endereço alcançável pelo dispositivo ou emulador no QR/build.

## Protocolo

O fluxo implementa lobby, envio de resposta, resultado, pontuação, ranking,
saída voluntária e retomada automática de sessão. O token, o nome, o PIN e a
origem identificada ficam salvos localmente apenas enquanto a sessão puder ser
retomada.
