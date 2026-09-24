#!/usr/bin/env bash
# Pôle Coach — chaîne de production « haute qualité » (HQ).
#
# Ce que fait cette chaîne, dans l'ordre :
#   1. synchronise les scripts du projet vers /tmp/proday-rec (l'environnement
#      d'exécution où vivent les node_modules de la chaîne) ;
#   2. capture le pôle Coach **desktop** puis **mobile** avec record.mjs :
#      - rendu en densité 2 (desktop) et 3 (mobile),
#      - images suréchantillonnées (« hi/ ») prises toutes les 2 s + à chaque
#        étape : ce sont elles qui représentent les écrans tenus au montage ;
#   3. monte chaque capture en MP4 **muet** via assemble-silent.mjs (prologue de
#      connexion retiré, temps morts plafonnés, chapitres recalculés).
#
# La version commentée (narration FR + sous-titres) part des mêmes captures :
#   bash scripts/walkthrough/assemble-all.sh   (ou assemble.mjs par vidéo)
#
# Usage :
#   bash scripts/walkthrough/run-coach-hq.sh              # desktop + mobile
#   bash scripts/walkthrough/run-coach-hq.sh desktop      # desktop seulement
#   bash scripts/walkthrough/run-coach-hq.sh mobile       # mobile seulement
#
# Sorties :
#   /tmp/proday-shots/coach-desktop-hq, /tmp/proday-shots/coach-mobile-hq
#   walkthrough-silent/ProDay-Coach-Desktop-Silent.mp4
#   walkthrough-silent/ProDay-Coach-Mobile-Silent.mp4
set -u
REC=/tmp/proday-rec
ORIG="$(cd "$(dirname "$0")/../.." && pwd)"
SHOTS=/tmp/proday-shots
OUT="$ORIG/walkthrough-silent"
LOGS="$SHOTS/logs"
mkdir -p "$OUT" "$LOGS"

WANT_DESKTOP=0
WANT_MOBILE=0
if [ "$#" -eq 0 ]; then WANT_DESKTOP=1; WANT_MOBILE=1
else
  for a in "$@"; do
    case "$a" in
      desktop) WANT_DESKTOP=1 ;;
      mobile)  WANT_MOBILE=1 ;;
      *) echo "[?] cible inconnue : $a (desktop|mobile)"; exit 1 ;;
    esac
  done
fi

# ---------- 1. Synchronisation projet → environnement d'exécution ----------
echo "[sync] scripts $(date +%H:%M:%S)"
for f in record.mjs lib.mjs assemble.mjs assemble-silent.mjs verify-config.mjs; do
  cp "$ORIG/scripts/walkthrough/$f" "$REC/$f"
done
cp "$ORIG/scripts/walkthrough/configs/coach-desktop.json" "$REC/coach-desktop.json"
cp "$ORIG/scripts/walkthrough/configs/coach-mobile.json" "$REC/coach-mobile.json"

ensure_metro() {
  for _ in 1 2 3 4 5 6; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 http://localhost:8081/ || true)
    [ "$code" = "200" ] && return 0
    echo "[metro] indisponible ($code) — relance"
    (cd "$ORIG" && nohup npx expo start --web --port 8081 --localhost > /tmp/proday-metro.log 2>&1 & disown)
    sleep 25
  done
  echo "[metro] ÉCHEC — capture annulée"
  return 1
}

capture() {
  local name="$1" dir="$2"
  echo "=== capture $name -> $dir $(date +%H:%M:%S)"
  ensure_metro || return 1
  rm -rf "$SHOTS/$dir"
  node "$REC/record.mjs" "$REC/$name.json" "$SHOTS/$dir" > "$LOGS/$dir.log" 2>&1
  local frames
  frames=$(ls "$SHOTS/$dir/frames" 2>/dev/null | wc -l | tr -d ' ')
  local w h
  read -r w h < <(sips -g pixelWidth -g pixelHeight "$SHOTS/$dir/frames/$(ls "$SHOTS/$dir/frames" | head -1)" 2>/dev/null \
    | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{print w, h}')
  echo "[done] $dir frames=$frames rendu=${w}x${h} $(date +%H:%M:%S)"
  grep -E "\[retry\]|sans effet" "$LOGS/$dir.log" | head -5 || true
}

assemble_silent() {
  local dir="$1" file="$2" title="$3" width="$4"
  echo "=== montage $file $(date +%H:%M:%S)"
  node "$REC/assemble-silent.mjs" "$SHOTS/$dir" "$OUT/$file" "$title" --width "$width" \
    > "$LOGS/$dir-montage.log" 2>&1 \
    || { echo "!!! échec montage $dir"; tail -20 "$LOGS/$dir-montage.log"; return 1; }
  tail -3 "$LOGS/$dir-montage.log"
}

if [ "$WANT_DESKTOP" = 1 ]; then
  capture coach-desktop coach-desktop-hq
  assemble_silent coach-desktop-hq ProDay-Coach-Desktop-Silent.mp4 \
    "Pôle Coach — version Desktop (muette)" 1920
fi

if [ "$WANT_MOBILE" = 1 ]; then
  capture coach-mobile coach-mobile-hq
  assemble_silent coach-mobile-hq ProDay-Coach-Mobile-Silent.mp4 \
    "Pôle Coach — version Mobile (muette)" 1080
fi

echo "COACH_HQ_DONE $(date +%H:%M:%S)"
