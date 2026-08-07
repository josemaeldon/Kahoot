#!/bin/sh

set -eu

repository_path="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
mobile_path="$repository_path/play-mobile"
flutter_version="${FLUTTER_VERSION:-3.44.9}"
flutter_path="${HOME}/flutter-${flutter_version}"

if [ ! -x "$flutter_path/bin/flutter" ]; then
  echo "Flutter SDK is missing at $flutter_path" >&2
  exit 127
fi

export PATH="$flutter_path/bin:$PATH"
export FLUTTER_ROOT="$flutter_path"
cd "$mobile_path"

flutter pub get
flutter build ios --config-only --no-codesign
