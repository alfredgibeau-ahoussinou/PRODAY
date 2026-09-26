# Pôle Joueur — version Mobile

- Pôle : **Joueur**
- Version de l'application : **ProDay 1.0.10** (build web Expo/Metro)
- Interface : **mobile (portrait)** — viewport 390 × 844 px (DSF 3, simulation iPhone)
- Rendu : **simulation navigateur** (Chrome headless piloté par CDP) — pas d'appareil physique
- Compte : `player.demo@proday.app` (compte de démonstration, club FC ProDay Démo)
- Durée : 06:48 · 17 chapitres · narration FR + sous-titres incrustés

## Chapitres

| # | Temps | Chapitre | Contenu expliqué | Écran affiché (extrait d'accessibilité) |
|---|-------|----------|------------------|------------------------------------------|
| 1 | 00:00 | start | Début de la capture | — |
| 2 | 00:00 | login | Connexion au pôle Joueur avec un compte de démonstration isolé. Le mot de passe reste masqué à l'écran. | Bonjour, Lucas |
| 3 | 00:17 | question-semaine | Fermeture de la « Question de la semaine » — popup d'accueil du joueur | Bonjour, Lucas |
| 4 | 00:28 | accueil | Accueil joueur (mobile) — carte de joueur, quêtes du jour, objectifs de saison et radar de progression | Bonjour, Lucas |
| 5 | 00:52 | calendrier | Onglet Calendrier — rendez-vous, filtres par type, convocations et carte des terrains | Bonjour, Lucas |
| 6 | 01:25 | equipe | Onglet Équipe — annuaire du club et fiches des membres | FC PRODAY DÉMO · SAISON Saison 2026-2027 |
| 7 | 01:46 | menu | Onglet Menu — hub « Tout ProDay » du joueur : tous les modules et services | Centre Match — Tout ProDay |
| 8 | 02:07 | ma-saison | Ma Saison — matchs & calendrier, classement de championnat et mes statistiques | Centre Match — Tout ProDay |
| 9 | 02:28 | progression | Progression — XP, niveau et défis débloqués | Bonjour, Lucas |
| 10 | 03:04 | vestiaire | Vestiaire — messagerie d'équipe et fils de discussion | Bonjour, Lucas |
| 11 | 03:43 | clips-landscape | Clips en plein écran — rotation paysage pour la lecture vidéo verticale | Bonjour, Lucas |
| 12 | 04:32 | boutique | Boutique — vitrine des produits et équipements du club | Bonjour, Lucas |
| 13 | 05:14 | coach-ia | Mon Coach IA — programme personnalisé (démonstration) | Où allez-vous ? — Tout ProDay |
| 14 | 05:49 | trajet | Trajet — covoiturage et déplacements vers les rencontres | Passeport & Carrière — Transport & Logistique |
| 15 | 06:10 | mon-compte | Mon compte — profil joueur, vitrine CV et réglages | Passeport & Carrière —  |
| 16 | 06:34 | retour-accueil | Retour à l'accueil joueur — synthèse du parcours mobile | Passeport & Carrière —  |
| 17 | 06:47 | end | Fin de la visite guidée du pôle Joueur. | Passeport & Carrière —  |

## Limites et écarts

- **Rendu** : simulation de navigateur (Chrome piloté par CDP), pas d'appareil physique. La mise en page mobile est celle du site web responsive, pas d'un build natif.
- La colonne « écran affiché » provient de l'arbre d'accessibilité (texte concaténé autour de l'étape) : elle atteste qu'une navigation réelle a eu lieu sans être un titre officiel.
- Données : club de démonstration `FC ProDay Démo` uniquement (aucun membre réel, aucun paiement réel, aucune donnée de production).
- flux de capture interrompu 19s à l'étape accueil : relance du screencast
- flux de capture interrompu 35s à l'étape equipe : relance du screencast
- flux de capture interrompu 20s à l'étape progression : relance du screencast
- blocage détecté à l'étape vestiaire : deux interactions sans effet → rechargement de la session
- blocage détecté à l'étape boutique : deux interactions sans effet → rechargement de la session

## Étapes sans cible (documenté, non omis)

- **equipe** — Onglet Équipe — annuaire du club et fiches des membres
  - Cibles tentées : Équipe, scroll
  - Écran au moment de l'échec :  | Carrière |  | Passeport & CV |  | Forme & Récup |  | Tactique | Bonjour, Lucas | Sans club affilié · Milieu | 󰕥 | Régional |  | PROCHAIN MATCH |  | Au


## Transcript (narration)

**00:00 — start**

Début de la capture

**00:00 — login**

Connexion au pôle Joueur avec un compte de démonstration isolé. Le mot de passe reste masqué à l'écran.

**00:17 — question-semaine**

Fermeture de la « Question de la semaine » — popup d'accueil du joueur

**00:28 — accueil**

Accueil joueur (mobile) — carte de joueur, quêtes du jour, objectifs de saison et radar de progression

**00:52 — calendrier**

Onglet Calendrier — rendez-vous, filtres par type, convocations et carte des terrains

**01:25 — equipe**

Onglet Équipe — annuaire du club et fiches des membres

**01:46 — menu**

Onglet Menu — hub « Tout ProDay » du joueur : tous les modules et services

**02:07 — ma-saison**

Ma Saison — matchs & calendrier, classement de championnat et mes statistiques

**02:28 — progression**

Progression — XP, niveau et défis débloqués

**03:04 — vestiaire**

Vestiaire — messagerie d'équipe et fils de discussion

**03:43 — clips-landscape**

Clips en plein écran — rotation paysage pour la lecture vidéo verticale

**04:32 — boutique**

Boutique — vitrine des produits et équipements du club

**05:14 — coach-ia**

Mon Coach IA — programme personnalisé (démonstration)

**05:49 — trajet**

Trajet — covoiturage et déplacements vers les rencontres

**06:10 — mon-compte**

Mon compte — profil joueur, vitrine CV et réglages

**06:34 — retour-accueil**

Retour à l'accueil joueur — synthèse du parcours mobile

**06:47 — end**

Fin de la visite guidée du pôle Joueur.


## Vérification

- Fichier : `ProDay-Player-Mobile.mp4`
- Flux vidéo : H.264, 1080 × 2340 px, 30 fps
- Flux audio : AAC 160 kbps (voix FR)
- Sous-titres : incrustés + `captions.srt` fourni
- Chapitres : intégrés dans le conteneur + table ci-dessus
