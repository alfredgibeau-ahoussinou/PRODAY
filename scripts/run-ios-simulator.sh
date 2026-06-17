#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEME="ProDay"
WORKSPACE="$ROOT/ios/ProDay.xcworkspace"
BUNDLE_ID="com.proday.app"
SIMULATOR_NAME="${IOS_SIMULATOR:-iPhone 17 Pro Max}"
METRO_PORT="${RCT_METRO_PORT:-8081}"

cd "$ROOT"

wait_for_metro() {
  local i
  for i in $(seq 1 45); do
    if curl -sf "http://127.0.0.1:${METRO_PORT}/status" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if ! xcrun simctl list devices available | grep -q "$SIMULATOR_NAME"; then
  echo "Simulateur introuvable : $SIMULATOR_NAME"
  echo "Liste : xcrun simctl list devices available | grep iPhone"
  exit 1
fi

UDID="$(xcrun simctl list devices available | grep "$SIMULATOR_NAME (" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')"
DERIVED_DATA="$ROOT/ios/build/DerivedData"
APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/ProDay.app"

if ! curl -sf "http://127.0.0.1:${METRO_PORT}/status" >/dev/null 2>&1; then
  echo "→ Démarrage Metro sur localhost:${METRO_PORT} (obligatoire en Debug)"
  REACT_NATIVE_PACKAGER_HOSTNAME=localhost npx expo start --localhost --clear &
  METRO_PID=$!
  trap 'kill "$METRO_PID" 2>/dev/null || true' EXIT
  if ! wait_for_metro; then
    echo "❌ Metro n’a pas démarré sur le port ${METRO_PORT}."
    echo "   Lancez dans un autre terminal : npm run start:ios"
    exit 1
  fi
  echo "✓ Metro prêt"
else
  echo "✓ Metro déjà actif sur le port ${METRO_PORT}"
fi

echo "→ Build simulateur ($SIMULATOR_NAME)"
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  build | tail -5

echo "→ Installation sur le simulateur"
xcrun simctl boot "$UDID" 2>/dev/null || true
open -a Simulator >/dev/null 2>&1 || true
xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl launch "$UDID" "$BUNDLE_ID"
echo "✓ ProDay lancé — Metro doit rester ouvert (npm run start:ios)"
