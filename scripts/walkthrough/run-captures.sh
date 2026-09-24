#!/usr/bin/env bash
# Lance les captures ProDay restantes, une par une, dans un processus détaché.
# Usage : bash scripts/walkthrough/run-captures.sh [config...]
# Chaque config produit /tmp/proday-shots/<nom>/{frames,steps.json} + un log.
set -u
REC=/tmp/proday-rec
SRC="$(cd "$(dirname "$0")/../.." && pwd)/scripts/walkthrough"
LOG_DIR=/tmp/proday-shots/logs
mkdir -p "$LOG_DIR"

ensure_metro() {
  for i in 1 2 3 4 5 6; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 http://localhost:8081/ || true)
    [ "$code" = "200" ] && { echo "[metro] ok"; return 0; }
    echo "[metro] indisponible ($code) — relance"
    (cd "$SRC/../.." && nohup npx expo start --web --port 8081 --localhost > /tmp/proday-metro.log 2>&1 & disown)
    sleep 25
  done
  echo "[metro] ÉCHEC"; return 1
}

run_one() {
  local name="$1"
  local cfg="$SRC/configs/$name.json"
  [ -f "$cfg" ] || { echo "[skip] config absente : $name"; return 0; }
  echo "=== $name $(date +%H:%M:%S)"
  ensure_metro || return 1
  rm -rf "/tmp/proday-shots/$name"
  cp "$cfg" "$REC/$name.json"
  node "$REC/record.mjs" "$REC/$name.json" "/tmp/proday-shots/$name" \
    > "$LOG_DIR/$name.log" 2>&1
  echo "[done] $name rc=$? frames=$(ls /tmp/proday-shots/$name/frames 2>/dev/null | wc -l | tr -d ' ')"
}

for name in "$@"; do
  run_one "$name"
done
echo "ALL_CAPTURES_DONE"
