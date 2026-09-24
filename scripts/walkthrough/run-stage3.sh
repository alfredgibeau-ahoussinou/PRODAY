#!/usr/bin/env bash
# Étape 3 : assemble les vidéos restantes avec l'assembleur corrigé
# (sous-titres ASS + mode --docs-only fonctionnel).
set -u
REC=/tmp/proday-rec
ORIG="/Users/gibeau--ahoussinou/PRODAY"
OUT="$ORIG/walkthrough-exports"
SHOTS=/tmp/proday-shots

for _ in $(seq 1 120); do
  if ! pgrep -f "record.mjs /tmp/proday-rec/club-mobile.json" >/dev/null; then
    break
  fi
  sleep 10
done
echo "[stage3] capture club-mobile terminée $(date +%H:%M:%S)"

cp "$ORIG/scripts/walkthrough/assemble.mjs" "$REC/assemble.mjs"

assemble() {
  local dir="$1" file="$2" title="$3" width="$4"
  echo "=== $file $(date +%H:%M:%S)"
  node "$REC/assemble.mjs" "$SHOTS/$dir" "$OUT/$file" "$title" --width "$width"
}

assemble player-desktop ProDay-Player-Desktop.mp4 "Pôle Joueur — version Desktop" 1920
assemble club-mobile    ProDay-Club-Mobile.mp4    "Pôle Club — version Mobile"    1080
assemble player-mobile  ProDay-Player-Mobile.mp4  "Pôle Joueur — version Mobile"  1080
assemble parent-desktop ProDay-Parent-Desktop.mp4 "Pôle Parent — version Desktop" 1920
assemble parent-mobile  ProDay-Parent-Mobile.mp4  "Pôle Parent — version Mobile"  1080

echo "STAGE3_DONE $(date +%H:%M:%S)"
