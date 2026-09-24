#!/usr/bin/env bash
# Étape 5 (finale) :
#  - re-capture du pôle Joueur desktop (scénario vérifié : retour au hub par la barre latérale) ;
#  - réassemblage du pôle Club mobile (parcours étendu à 24 modules) ;
#  - réassemblage du pôle Joueur desktop (shell corrigé + parcours complet).
set -u
REC=/tmp/proday-rec
ORIG="/Users/gibeau--ahoussinou/PRODAY"
OUT="$ORIG/walkthrough-exports"
SHOTS=/tmp/proday-shots

cp "$ORIG/scripts/walkthrough/record.mjs" "$REC/record.mjs"
cp "$ORIG/scripts/walkthrough/lib.mjs" "$REC/lib.mjs"
cp "$ORIG/scripts/walkthrough/assemble.mjs" "$REC/assemble.mjs"
cp "$ORIG/scripts/walkthrough/configs/player-desktop.json" "$REC/player-desktop.json"

echo "=== recapture player-desktop $(date +%H:%M:%S)"
node "$REC/record.mjs" "$REC/player-desktop.json"
echo "=== assemble club-mobile $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/club-mobile" "$OUT/ProDay-Club-Mobile.mp4" "Pôle Club — version Mobile" --width 1080
echo "=== assemble player-desktop $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/player-desktop" "$OUT/ProDay-Player-Desktop.mp4" "Pôle Joueur — version Desktop" --width 1920

echo "STAGE5_DONE $(date +%H:%M:%S)"
