# Visites guidées ProDay — méthode de production

Ce dossier contient la chaîne complète qui produit les vidéos de visite guidée
(`walkthrough-exports/ProDay-<Pôle>-<Desktop|Mobile>.mp4`).

## 1. Inventaire préalable

- Les routes et modules de chaque pôle sont inventoriés dans `INVENTORY.md`
  (issu des configurations de navigation du code : `clubNavConfig`, `coachNavConfig`,
  `parentNavConfig`, menus joueur, contenu `src/content/*`).
- `map-shell.mjs` **vérifie sur l'application en marche** la navigation réellement
  cliquable d'un pôle (barre latérale desktop, dock mobile, hub « Tout ProDay »,
  accordéons) et écrit `/tmp/proday-rec/map-<pôle>-<format>.json`.
- `hub-inventory.mjs` déroule le hub mobile et liste ses cartes (paliers de défilement).
- Aucune page n'est déduite « à la lecture du code » sans vérification visuelle.

## 2. Comptes et données

Comptes de démonstration isolés, créés par les scripts `npm run seed:demo-*` sur le
club `FC ProDay Démo` (26 licenciés fictifs, 3 équipes, aucune donnée réelle) :

| Pôle | Compte |
|------|--------|
| Club | `club.demo@proday.app` |
| Coach | `coach.demo@proday.app` |
| Joueur | `player.demo@proday.app` |
| Parent | `parent.demo@proday.app` |

Le mot de passe n'apparaît dans aucune vidéo : la saisie se fait par événements
`input` natifs (les champs restent en puces) et, pour les pôles dont l'entrée
(navigation d'univers) n'existe qu'en disposition mobile, **la connexion a lieu avant
le début de la capture** puis la page est rechargée à la taille filmée.

## 3. Enregistrement

- `record.mjs` pilote Chrome en CDP (`puppeteer-core`, Chrome installé localement) :
  capture d'écran `Page.startScreencast` (JPEG, qualité 80), une frame est écrite dès
  que la page change, avec son horodatage.
- Desktop : viewport 1920 × 1080 (paysage). Mobile : 390 × 844, `deviceScaleFactor 3`,
  `isMobile`, `hasTouch` — soit le rendu mobile réel de l'application, en portrait,
  piloté séparément (jamais un recadrage du desktop).
- Les interactions sont des clics **réels** (souris CDP) sur des éléments vérifiés par
  un test de collision (`elementFromPoint`) : cela évite les cibles fantômes que ce
  shell laisse montées (barre latérale desktop en `pointer-events: none` sur mobile).
- Après chaque action, l'enregistreur attend le **changement d'écran** (3 à 6 s en mode
  développement) avant de lancer la narration : les chapitres montrent l'écran annoncé.
- Robustesse : si le flux de capture s'interrompt ou si deux interactions restent sans
  effet, l'enregistreur tente une sortie par « Retour », puis recharge la session et
  poursuit. Chaque incident est consigné dans `diagnostics.json` et repris dans la
  fiche de la vidéo.
- Bascule paysage (390 × 844 → 844 × 390) pour la lecture vidéo / le tableau tactique :
  la capture est relancée après le changement de viewport (sinon Chrome cesse d'émettre).

## 4. Montage (français)

`assemble.mjs` produit, pour chaque capture :

1. une vidéo muette à fréquence fixe (chaque frame est maintenue jusqu'à la suivante) ;
2. une **narration française** générée par la synthèse vocale macOS (`say`, voix
   « Thomas »), une phrase par chapitre, calée sur l'horodatage réel de l'étape ;
3. des **sous-titres incrustés** — rendus depuis un fichier ASS avec `PlayResX`/`PlayResY`
   explicites (`captions.srt` est également fourni à part, pour la transcription et
   l'accessibilité) ;
4. des **chapitres** intégrés au conteneur MP4 ;
5. une fiche `.md` (liste horodatée des chapitres, transcript, écrans observés,
   étapes sans cible).

## 5. Vérification

- `verify-config.mjs` exécute un scénario sans enregistrer et affiche l'écran atteint
  par étape : il sert à corriger les scénarios avant de lancer une capture complète.
- Après montage, des images sont extraites aux bornes de chapitres pour contrôler la
  lisibilité, la présence des sous-titres et l'absence de fuite d'information.
- `pick-frame.mjs` / les feuilles de contrôle (montages 2 × 2) servent à la revue
  visuelle vidéo par vidéo.
- `make-coverage.mjs` consolide le tout dans `walkthrough-exports/COUVERTURE.md`
  (checklist par vidéo : écran atteint, statut, limites).
- `make-index.mjs` produit `walkthrough-exports/README.md` (index des 8 vidéos :
  durée réelle, résolution, chapitres, commandes de reproduction).

## 6. Incidents rencontrés et correctifs

1. **Zone de contenu vide (pôle Joueur, desktop).** Le pôle Joueur s'affichait sur un
   écran noir en 1920 × 1080 alors que le même compte rendait correctement en portrait.
   Diagnostic : dans `App.tsx`, `styles.screenDesktop` portait `alignSelf: 'center'`;
   la colonne étant l'enfant d'une rangée flex, cet `alignSelf` s'appliquait à l'axe
   **vertical**, réduisant la hauteur au contenu — soit 0 pour un enfant `flex: 1`.
   Correctif : `alignSelf: 'stretch'` (la largeur maximale de 1180 px et la position
   horizontale restent inchangées). La vidéo Joueur desktop a été réenregistrée après
   ce correctif ; la correction est signalée dans `README.md` et `COUVERTURE.md`.
2. **Taille des sous-titres.** libass applique par défaut un canvas de 288 px de haut :
   la même taille de police rendait 6 × trop grand en portrait 1080 × 2340. Les
   sous-titres sont donc produits en ASS avec `PlayResX`/`PlayResY` = dimensions réelles
   du canvas, taille en pixels réels et fond semi-opaque.
3. **Redimensionnement en cours de session.** Redimensionner une session déjà montée
   laissait la zone de contenu vide sur certains pôles : la connexion se fait donc
   avant la capture, puis la page est rechargée à la taille filmée.
4. **Capture interrompue par un changement de viewport.** `Page.startScreencast` cesse
   d'émettre des frames après `setViewport` : le flux est arrêté puis relancé autour des
   bascules paysage (séquences vidéo et tactique).
5. **Application figée pendant une visite.** Deux interactions successives sans effet
   déclenchent une sortie par « Retour » puis, si besoin, un rechargement de la session
   connectée ; l'incident est écrit dans `diagnostics.json` et repris dans la fiche.
6. **Étapes sans cible.** Les cibles absentes (libellés non rendus, modules vides pour
   un club non affilié) sont listées nommément dans la fiche de la vidéo au lieu d'être
   supprimées du parcours.
