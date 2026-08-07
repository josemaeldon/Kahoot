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

flutter --version
cd "$mobile_path"
flutter precache --ios
flutter pub get

# Flutter generates ios/Flutter/ephemeral, including the local Swift package
# referenced by Runner.xcodeproj. It must exist before Xcode Cloud invokes
# xcodebuild to resolve package dependencies.
flutter build ios --config-only --no-codesign
flutter build macos --config-only --no-codesign
