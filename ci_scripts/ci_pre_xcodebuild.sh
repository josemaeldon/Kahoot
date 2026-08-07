#!/bin/sh

set -eu

repository_path="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
mobile_path="$repository_path/play-mobile"
flutter_version="${FLUTTER_VERSION:-3.44.9}"
flutter_path="${HOME}/flutter-${flutter_version}"

if [ ! -x "$flutter_path/bin/flutter" ]; then
  rm -rf "$flutter_path"
  git clone --depth 1 --branch "$flutter_version" \
    https://github.com/flutter/flutter.git "$flutter_path"
fi

export PATH="$flutter_path/bin:$PATH"
export FLUTTER_ROOT="$flutter_path"
cd "$mobile_path"

flutter pub get
flutter build ios --config-only --no-codesign
flutter build macos --config-only --no-codesign

generated_package="$mobile_path/ios/Flutter/ephemeral/Packages/FlutterGeneratedPluginSwiftPackage/Package.swift"
if [ ! -f "$generated_package" ]; then
  echo "Flutter did not generate the plugin Swift package: $generated_package" >&2
  exit 1
fi

echo "Generated Flutter plugin package: $generated_package"

macos_generated_package="$mobile_path/macos/Flutter/ephemeral/Packages/FlutterGeneratedPluginSwiftPackage/Package.swift"
if [ ! -f "$macos_generated_package" ]; then
  echo "Flutter did not generate the macOS plugin Swift package: $macos_generated_package" >&2
  exit 1
fi

echo "Generated macOS plugin package: $macos_generated_package"
