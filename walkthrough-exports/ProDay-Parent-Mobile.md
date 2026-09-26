# Pôle Parent — version Mobile

- Pôle : **Parent**
- Version de l'application : **ProDay 1.0.10** (build web Expo/Metro)
- Interface : **mobile (portrait)** — viewport 390 × 844 px (DSF 3, simulation iPhone)
- Rendu : **simulation navigateur** (Chrome headless piloté par CDP) — pas d'appareil physique
- Compte : `parent.demo@proday.app` (compte de démonstration, club FC ProDay Démo)
- Durée : 04:05 · 13 chapitres · narration FR + sous-titres incrustés

## Chapitres

| # | Temps | Chapitre | Contenu expliqué | Écran affiché (extrait d'accessibilité) |
|---|-------|----------|------------------|------------------------------------------|
| 1 | 00:00 | start | Début de la capture | — |
| 2 | 00:00 | login | Connexion au pôle Parent avec un compte de démonstration isolé. Le mot de passe reste masqué à l'écran. | Enfants liés — Parent |
| 3 | 00:19 | accueil | Accueil parent (mobile) — enfants liés, bascule de supervision, alertes et invitations | Enfants liés — Parent |
| 4 | 00:40 | enfant | Enfant — fiche de Léo : agenda, convocations et suivi de saison | Enfants liés — Parent |
| 5 | 01:14 | second-enfant | Second enfant — bascule vers Lucas, le second profil supervisé | Suggestions — Parent |
| 6 | 01:30 | guide | Guide IA — suggestions pour accompagner l'enfant (conseils personnalisés) | Suggestions — Parent |
| 7 | 02:01 | menu | Onglet Menu — hub « Outils famille » : messages, agenda et trajet | Outils famille — Parent |
| 8 | 02:17 | messages | Messages — contacts approuvés et conversations de l'enfant | Outils famille — Parent |
| 9 | 02:35 | agenda | Agenda — réponse de présence « Je viens / Absent » et signalement de retard | Outils famille — Parent |
| 10 | 02:60 | trajet | Trajet — suivi live du covoiturage et partage de position (paysage pour la carte) | Contacts approuvés — Parent |
| 11 | 03:31 | profil | Profil parent — langue de l'application, mot de passe et documents légaux | Demande de temps d’écran — Parent |
| 12 | 03:50 | retour-accueil | Retour à l'accueil parent — synthèse du parcours mobile | Demande de temps d’écran — Parent |
| 13 | 04:04 | end | Fin de la visite guidée du pôle Parent. | Demande de temps d’écran — Parent |

## Limites et écarts

- **Rendu** : simulation de navigateur (Chrome piloté par CDP), pas d'appareil physique. La mise en page mobile est celle du site web responsive, pas d'un build natif.
- La colonne « écran affiché » provient de l'arbre d'accessibilité (texte concaténé autour de l'étape) : elle atteste qu'une navigation réelle a eu lieu sans être un titre officiel.
- Données : club de démonstration `FC ProDay Démo` uniquement (aucun membre réel, aucun paiement réel, aucune donnée de production).
- flux de capture interrompu 26s à l'étape agenda : relance du screencast

## Étapes sans cible (documenté, non omis)

- **agenda** — Agenda — réponse de présence « Je viens / Absent » et signalement de retard
  - Cibles tentées : Agenda, Tout, À venir
  - Écran au moment de l'échec : Parent | Pro Day | Lucas Démo | MENU | Outils famille | Messages, agenda et trajet — sans surcharger le dock. | Outils famille | Les actions du quotidien, regro
- **trajet** — Trajet — suivi live du covoiturage et partage de position (paysage pour la carte)
  - Cibles tentées : Trajet, viewport, viewport
  - Écran au moment de l'échec : Parent | Pro Day | Lucas Démo | MENU | Outils famille | Messages, agenda et trajet — sans surcharger le dock. | Outils famille | Les actions du quotidien, regro


## Transcript (narration)

**00:00 — start**

Début de la capture

**00:00 — login**

Connexion au pôle Parent avec un compte de démonstration isolé. Le mot de passe reste masqué à l'écran.

**00:19 — accueil**

Accueil parent (mobile) — enfants liés, bascule de supervision, alertes et invitations

**00:40 — enfant**

Enfant — fiche de Léo : agenda, convocations et suivi de saison

**01:14 — second-enfant**

Second enfant — bascule vers Lucas, le second profil supervisé

**01:30 — guide**

Guide IA — suggestions pour accompagner l'enfant (conseils personnalisés)

**02:01 — menu**

Onglet Menu — hub « Outils famille » : messages, agenda et trajet

**02:17 — messages**

Messages — contacts approuvés et conversations de l'enfant

**02:35 — agenda**

Agenda — réponse de présence « Je viens / Absent » et signalement de retard

**02:60 — trajet**

Trajet — suivi live du covoiturage et partage de position (paysage pour la carte)

**03:31 — profil**

Profil parent — langue de l'application, mot de passe et documents légaux

**03:50 — retour-accueil**

Retour à l'accueil parent — synthèse du parcours mobile

**04:04 — end**

Fin de la visite guidée du pôle Parent.


## Vérification

- Fichier : `ProDay-Parent-Mobile.mp4`
- Flux vidéo : H.264, 1080 × 2340 px, 30 fps
- Flux audio : AAC 160 kbps (voix FR)
- Sous-titres : incrustés + `captions.srt` fourni
- Chapitres : intégrés dans le conteneur + table ci-dessus
