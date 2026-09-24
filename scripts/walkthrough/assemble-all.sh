#!/usr/bin/env bash
# Assemble les 8 vidéos finales (narration FR + sous-titres incrustés + chapitres).
# Chaque capture dispose de son propre README.md dans walkthrough-exports/.
set -u
REC=/tmp/proday-rec
ORIG="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ORIG/walkthrough-exports"
SHOTS=/tmp/proday-shots
mkdir -p "$OUT"

assemble() {
  local dir="$1" file="$2" title="$3" width="$4"
  if [ ! -f "$SHOTS/$dir/steps.json" ]; then
    echo "[skip] $dir (capture absente)"
    return 0
  fi
  echo "=== $file $(date +%H:%M:%S)"
  node "$REC/assemble.mjs" "$SHOTS/$dir" "$OUT/$file" "$title" --width "$width"
}

assemble club-desktop   ProDay-Club-Desktop.mp4   "Pôle Club — version Desktop"   1920
assemble club-mobile    ProDay-Club-Mobile.mp4    "Pôle Club — version Mobile"    1080
assemble coach-desktop  ProDay-Coach-Desktop.mp4  "Pôle Coach — version Desktop"  1920
assemble coach-mobile   ProDay-Coach-Mobile.mp4   "Pôle Coach — version Mobile"   1080
assemble player-desktop ProDay-Player-Desktop.mp4 "Pôle Joueur — version Desktop" 1920
assemble player-mobile  ProDay-Player-Mobile.mp4  "Pôle Joueur — version Mobile"  1080
assemble parent-desktop ProDay-Parent-Desktop.mp4 "Pôle Parent — version Desktop" 1920
assemble parent-mobile  ProDay-Parent-Mobile.mp4  "Pôle Parent — version Mobile"  1080

echo "ASSEMBLE_ALL_DONE $(date +%H:%M:%S)"
