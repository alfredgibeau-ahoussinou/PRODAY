#!/usr/bin/env bash
# Étape 7 :
#  - re-capture du pôle Coach desktop : le parcours précédent montrait le même accueil
#    pendant dix minutes (navigation figée). Scénario réécrit après vérification
#    (`verify-config.mjs --shots`) : barre latérale + cartes du hub.
#  - réassemblage Coach desktop ;
#  - réassemblage Club mobile (libellé de la dernière étape aligné sur ce que montre
#    réellement la capture, où le retour à l'accueil club n'a pas pu être déclenché).
set -u
REC=/tmp/proday-rec
ORIG="/Users/gibeau--ahoussinou/PRODAY"
OUT="$ORIG/walkthrough-exports"
SHOTS=/tmp/proday-shots

cp "$ORIG/scripts/walkthrough/record.mjs" "$REC/record.mjs"
cp "$ORIG/scripts/walkthrough/lib.mjs" "$REC/lib.mjs"
cp "$ORIG/scripts/walkthrough/assemble.mjs" "$REC/assemble.mjs"
cp "$ORIG/scripts/walkthrough/configs/coach-desktop.json" "$REC/coach-desktop.json"
cp "$ORIG/scripts/walkthrough/configs/club-mobile.json" "$REC/club-mobile.json"

# Les libellés du manifeste sont ceux du scénario : on les resynchronise pour que
# la narration décrive exactement ce que la capture montre.
node -e '
const fs = require("fs");
for (const [dir, cfg] of [["club-mobile", "club-mobile.json"], ["coach-desktop", "coach-desktop.json"]]) {
  const m = `/tmp/proday-shots/${dir}/steps.json`;
  if (!fs.existsSync(m)) continue;
  const j = JSON.parse(fs.readFileSync(m, "utf8"));
  const c = JSON.parse(fs.readFileSync(`/tmp/proday-rec/${cfg}`, "utf8"));
  for (const s of j.steps) {
    const found = c.steps.find((x) => x.id === s.id);
    if (found) s.label = found.label;
  }
  fs.writeFileSync(m, JSON.stringify(j));
  console.log(`[labels] ${dir} synchronisé`);
}
'

echo "=== recapture coach-desktop $(date +%H:%M:%S)"
node "$REC/record.mjs" "$REC/coach-desktop.json"
echo "=== assemble coach-desktop $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/coach-desktop" "$OUT/ProDay-Coach-Desktop.mp4" "Pôle Coach — version Desktop" --width 1920
echo "=== assemble club-mobile $(date +%H:%M:%S)"
node "$REC/assemble.mjs" "$SHOTS/club-mobile" "$OUT/ProDay-Club-Mobile.mp4" "Pôle Club — version Mobile" --width 1080

echo "STAGE7_DONE $(date +%H:%M:%S)"
