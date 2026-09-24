#!/usr/bin/env bash
# Produit les enregistrements **muets** (vidéo seule) dans walkthrough-silent/.
# Aucune piste audio, aucun sous-titre, aucun habillage : les captures d'écran
# brutes déjà réalisées sont réassemblées puis réencodées.
#
# La chaîne a été renforcée :
#   - chaque écran est représenté par une image stabilisée (jamais une image
#     prise en pleine transition) ;
#   - un écran inchangé n'est jamais tenu plus de 13 s (--hold-cap) : les gels
#     de capture ne deviennent plus des minutes d'image fixe ;
#   - le prologue de connexion (sélection d'univers, porte, formulaire) est
#     retiré : la visite commence sur le premier écran réel ;
#   - encodage crf15 / preset slow / paramètres x264 orientés texte.
#
# Usage :
#   bash run-silent.sh                  # les 8 enregistrements
#   bash run-silent.sh club-mobile ...  # seulement ceux-ci (reprise après échec)
set -u
REC=/tmp/proday-rec
ORIG="/Users/gibeau--ahoussinou/PRODAY"
SHOTS=/tmp/proday-shots
OUT="$ORIG/walkthrough-silent"
LOGS="$SHOTS/logs"
mkdir -p "$OUT" "$LOGS"

cp "$ORIG/scripts/walkthrough/assemble-silent.mjs" "$REC/assemble-silent.mjs"

# <dossier>|<fichier>|<titre>|<largeur>
CATALOGUE=(
  "club-desktop|ProDay-Club-Desktop-Silent.mp4|Pôle Club — version Desktop (muette)|1920"
  "club-mobile|ProDay-Club-Mobile-Silent.mp4|Pôle Club — version Mobile (muette)|1080"
  "coach-desktop|ProDay-Coach-Desktop-Silent.mp4|Pôle Coach — version Desktop (muette)|1920"
  "coach-mobile|ProDay-Coach-Mobile-Silent.mp4|Pôle Coach — version Mobile (muette)|1080"
  "player-desktop|ProDay-Player-Desktop-Silent.mp4|Pôle Joueur — version Desktop (muette)|1920"
  "player-mobile|ProDay-Player-Mobile-Silent.mp4|Pôle Joueur — version Mobile (muette)|1080"
  "parent-desktop|ProDay-Parent-Desktop-Silent.mp4|Pôle Parent — version Desktop (muette)|1920"
  "parent-mobile|ProDay-Parent-Mobile-Silent.mp4|Pôle Parent — version Mobile (muette)|1080"
)

for entry in "${CATALOGUE[@]}"; do
  IFS='|' read -r dir file title width <<<"$entry"
  if [ "$#" -gt 0 ]; then
    found=0
    for want in "$@"; do [ "$want" = "$dir" ] && found=1; done
    [ "$found" = 1 ] || continue
  fi
  echo "=== $file $(date +%H:%M:%S)"
  node "$REC/assemble-silent.mjs" "$SHOTS/$dir" "$OUT/$file" "$title" --width "$width" || echo "!!! échec sur $file"
done

echo "SILENT_DONE $(date +%H:%M:%S)"
