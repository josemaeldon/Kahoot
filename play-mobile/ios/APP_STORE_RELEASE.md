# Publicação na App Store

Configuração iOS preparada para a conta Apple:

- Equipa: `OBRAS SOCIAIS DA DIOCESE DE BRAGANCA`
- Team ID: `DHLAYBVJ2Z`
- Bundle ID: `app.cloudbr.Play-Mobile-ios-ipad`
- Nome público: `Play! Quiz CloudBR`
- Versão: `1.0.1`
- Build técnico: `4`

## Gerar o arquivo para envio

```bash
flutter pub get
flutter analyze
flutter test
flutter build ipa --release \
  --build-name=1.0.1 \
  --build-number=3 \
  --dart-define=PLAY_BASE_URL=https://SEU-DOMINIO
```

O app usa `https://play.cloudbr.app` por padrão, permitindo a entrada manual
com Game PIN. O QR Code continua podendo apontar para outros domínios; nesse
caso, o endereço do QR Code tem prioridade.

## Antes do primeiro envio

1. No Apple Developer, registrar o Bundle ID `app.cloudbr.Play-Mobile-ios-ipad` na equipa
   `DHLAYBVJ2Z` e habilitar a assinatura automática para o app.
2. No App Store Connect, criar o app com o nome `Play!`, plataforma iOS e o
   mesmo Bundle ID.
3. Preencher privacidade, classificação etária, categoria, preço e screenshots.
4. Confirmar a URL de suporte e a política de privacidade exigidas pelo
   App Store Connect.
5. No Xcode, selecionar a equipa `OBRAS SOCIAIS DA DIOCESE DE BRAGANCA` no
   target `Runner` e deixar `Automatically manage signing` ativo.

O envio efetivo depende da sessão Apple com acesso à equipa e da criação dos
recursos no Developer/App Store Connect; essas credenciais não ficam no
repositório.

## Xcode Cloud

O repositório inclui `../ci_scripts/ci_post_clone.sh`. Ele instala a versão
Flutter `3.44.9`, executa `flutter pub get` e gera os pacotes iOS efêmeros antes
do `xcodebuild`. No Xcode Cloud, selecione o scheme `Runner` e a configuração
`Release`; não é necessário versionar `ios/Flutter/ephemeral`.
