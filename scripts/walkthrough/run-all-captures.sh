#!/usr/bin/env bash
# Captures restantes : Coach/Joueur/Parent desktop + les 4 tours mobile.
set -u
REC=/tmp/proday-rec
ORIG="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ORIG/scripts/walkthrough"
LOGS=/tmp/proday-shots/logs
mkdir -p "$LOGS"

ensure_metro() {
  for _ in 1 2 3 4 5 6; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 http://localhost:8081/ || true)
    [ "$code" = "200" ] && return 0
    echo "[metro] relance (code=$code)"
    (cd "$ORIG" && nohup npx expo start --web --port 8081 --localhost > /tmp/proday-metro.log 2>&1 & disown)
    sleep 25
  done
  return 1
}

capture() {
  local name="$1"
  [ -f "$SRC/configs/$name.json" ] || { echo "[skip] $name"; return 0; }
  echo "=== capture $name $(date +%H:%M:%S)"
  ensure_metro || { echo "[fatal] metro indisponible"; return 1; }
  rm -rf "/tmp/proday-shots/$name"
  cp "$SRC/configs/$name.json" "$REC/$name.json"
  node "$REC/record.mjs" "$REC/$name.json" "/tmp/proday-shots/$name" > "$LOGS/$name.log" 2>&1
  echo "[done] $name frames=$(ls /tmp/proday-shots/$name/frames 2>/dev/null | wc -l | tr -d ' ') etapes=$(grep -c '\[step\]' "$LOGS/$name.log" 2>/dev/null)"
}

cp "$SRC/lib.mjs" "$SRC/record.mjs" "$REC/" 2>/dev/null || true

for name in coach-desktop parent-desktop player-desktop club-mobile coach-mobile player-mobile parent-mobile; do
  capture "$name"
done
echo "ALL_CAPTURES_DONE $(date +%H:%M:%S)"
