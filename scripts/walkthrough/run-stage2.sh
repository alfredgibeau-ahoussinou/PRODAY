#!/usr/bin/env bash
# Étape 2 : assemble la capture Joueur desktop corrigée, ré-enregistre la visite
# mobile Club (tour étendu + séquence paysage), puis assemble les vidéos restantes.
set -u
REC=/tmp/proday-rec
ORIG="/Users/gibeau--ahoussinou/PRODAY"
OUT="$ORIG/walkthrough-exports"
SHOTS=/tmp/proday-shots

# Attend la fin de la capture Joueur desktop en cours (le recorder se termine).
for _ in $(seq 1 120); do
  if ! pgrep -f "record.mjs /tmp/proday-rec/player-desktop.json" >/dev/null; then
    break
  fi
  sleep 10
done
echo "[stage2] capture player-desktop terminée $(date +%H:%M:%S)"

cp "$ORIG/scripts/walkthrough/assemble.mjs" "$REC/assemble.mjs"
cp "$ORIG/scripts/walkthrough/record.mjs" "$REC/record.mjs"
cp "$ORIG/scripts/walkthrough/lib.mjs" "$REC/lib.mjs"
cp "$ORIG/scripts/walkthrough/configs/club-mobile.json" "$REC/club-mobile.json"

echo "=== assemble player-desktop $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/player-desktop" "$OUT/ProDay-Player-Desktop.mp4" "Pôle Joueur — version Desktop" --width 1920

echo "=== recapture club-mobile $(date +%H:%M:%S)"
node "$REC/record.mjs" "$REC/club-mobile.json"
echo "=== assemble club-mobile $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/club-mobile" "$OUT/ProDay-Club-Mobile.mp4" "Pôle Club — version Mobile" --width 1080

echo "=== assemble player-mobile $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/player-mobile" "$OUT/ProDay-Player-Mobile.mp4" "Pôle Joueur — version Mobile" --width 1080
echo "=== assemble parent-desktop $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/parent-desktop" "$OUT/ProDay-Parent-Desktop.mp4" "Pôle Parent — version Desktop" --width 1920
echo "=== assemble parent-mobile $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/parent-mobile" "$OUT/ProDay-Parent-Mobile.mp4" "Pôle Parent — version Mobile" --width 1080

echo "STAGE2_DONE $(date +%H:%M:%S)"
