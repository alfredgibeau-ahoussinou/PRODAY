#!/usr/bin/env bash
# Étape 1 : captures desktop (coach, parent) puis découvertes restantes
# (carte de navigation Joueur desktop + inventaires des hubs mobiles).
set -u
REC=/tmp/proday-rec
SRC="$(cd "$(dirname "$0")/../.." && pwd)/scripts/walkthrough"
LOGS=/tmp/proday-shots/logs
mkdir -p "$LOGS"

ensure_metro() {
  for _ in 1 2 3 4 5 6; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 http://localhost:8081/ || true)
    [ "$code" = "200" ] && return 0
    echo "[metro] relance (code=$code)"
    (cd "$SRC/../.." && nohup npx expo start --web --port 8081 --localhost > /tmp/proday-metro.log 2>&1 & disown)
    sleep 25
  done
  return 1
}

capture() {
  local name="$1"
  echo "=== capture $name $(date +%H:%M:%S)"
  ensure_metro || { echo "[fatal] metro indisponible"; return 1; }
  rm -rf "/tmp/proday-shots/$name"
  cp "$SRC/configs/$name.json" "$REC/$name.json"
  node "$REC/record.mjs" "$REC/$name.json" "/tmp/proday-shots/$name" > "$LOGS/$name.log" 2>&1
  echo "[done] $name frames=$(ls /tmp/proday-shots/$name/frames 2>/dev/null | wc -l | tr -d ' ')"
}

capture coach-desktop
capture parent-desktop

cd "$REC" || exit 1
{
  echo "=== découvertes $(date +%H:%M:%S)"
  node map-shell.mjs Joueur desktop
  for pole in Club Coach Joueur Parent; do node hub-inventory.mjs "$pole" --shots /tmp/m-shots; done
  echo "STAGE1_DONE"
} >> /tmp/proday-shots/logs/discovery.log 2>&1
