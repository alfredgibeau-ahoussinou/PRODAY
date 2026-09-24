#!/usr/bin/env bash
# Étape 4 : re-captures ciblées puis assemblage.
#  - Club mobile : tour étendu (24 étapes) — la capture précédente avait échoué à l'étape 14.
#  - Joueur desktop : scénario réécrit avec les identifiants stables du hub (data-testid).
#  - Joueur mobile : réassemblage (libellés honnêtes pour les modules « Bientôt »).
set -u
REC=/tmp/proday-rec
ORIG="/Users/gibeau--ahoussinou/PRODAY"
OUT="$ORIG/walkthrough-exports"
SHOTS=/tmp/proday-shots

# Attend la fin de l'étape 3 (assemblages en cours).
for _ in $(seq 1 240); do
  if ! pgrep -f "run-stage3.sh" >/dev/null; then
    break
  fi
  sleep 15
done
echo "[stage4] étape 3 terminée $(date +%H:%M:%S)"

mkdir -p "$SHOTS/crashed"
if [ -f "$SHOTS/club-mobile/steps.json" ]; then
  cp "$SHOTS/club-mobile/steps.json" "$SHOTS/crashed/club-mobile-steps-crash.json" || true
fi

cp "$ORIG/scripts/walkthrough/record.mjs" "$REC/record.mjs"
cp "$ORIG/scripts/walkthrough/lib.mjs" "$REC/lib.mjs"
cp "$ORIG/scripts/walkthrough/assemble.mjs" "$REC/assemble.mjs"
cp "$ORIG/scripts/walkthrough/configs/club-mobile.json" "$REC/club-mobile.json"
cp "$ORIG/scripts/walkthrough/configs/player-desktop.json" "$REC/player-desktop.json"

echo "=== recapture club-mobile $(date +%H:%M:%S)"
node "$REC/record.mjs" "$REC/club-mobile.json"
echo "=== recapture player-desktop $(date +%H:%M:%S)"
node "$REC/record.mjs" "$REC/player-desktop.json"

echo "=== assemble club-mobile $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/club-mobile" "$OUT/ProDay-Club-Mobile.mp4" "Pôle Club — version Mobile" --width 1080
echo "=== assemble player-desktop $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/player-desktop" "$OUT/ProDay-Player-Desktop.mp4" "Pôle Joueur — version Desktop" --width 1920
echo "=== assemble player-mobile $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/player-mobile" "$OUT/ProDay-Player-Mobile.mp4" "Pôle Joueur — version Mobile" --width 1080

echo "STAGE4_DONE $(date +%H:%M:%S)"
