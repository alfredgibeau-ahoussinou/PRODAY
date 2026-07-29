# ProDay — Pitch & présentation

Ouvre [`index.html`](./index.html) dans un navigateur. Tu navigues avec les flèches ← →, la barre d'espace, ou les boutons sur les côtés.

---

## En 30 secondes

ProDay, c'est l'app pour le foot amateur et semi-pro : ton profil, tes matchs, ton club, le recrutement, la communauté — le tout au même endroit.

Concrètement, une équipe U17 aujourd'hui, c'est cinq groupes WhatsApp, un Excel pour les convocs, et des annonces Mercato perdues sur Facebook. ProDay remplace tout ça par une seule app mobile, avec de vraies données. Et on est transparents sur l'IA : elle analyse les highlights de séance que tu enregistres, pas tout le match en temps réel.

**Connecter • Progresser • Réussir**

→ [proday75.fr](https://proday75.fr) · Bêta : [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription)

---

## Le pitch complet (~4 min)

### 1. Le problème

Le foot amateur tourne encore au bricolage :

- Les convocs partent sur WhatsApp, les relances sont manuelles, personne ne sait vraiment qui vient.
- Le Mercato, c'est Facebook, LeBonCoin ou le réseau du vestiaire.
- Les stats et la carrière ? Excel, ou rien du tout.
- Les supporters n'ont pas de fil conducteur entre clubs, live et communauté.
- Staff et praticiens : pas d'annuaire fiable, pas de confiance claire.

Résultat : du temps perdu, peu de visibilité pour les joueurs, des clubs qui galèrent à recruter, et aucun CV qui se construit tout seul à partir de ce qui se passe vraiment sur le terrain.

### 2. Ce qu'on propose

ProDay, c'est une app mobile + un site ([proday75.fr](https://proday75.fr)) qui met carrière, club et communauté dans le même écosystème.

L'idée : donner aux acteurs du foot amateur des outils dignes du haut niveau, sans promettre la lune côté IA.

**Déjà en place :**

- **Profil & Pulse** — score de visibilité, CV en ligne, export PDF, timeline carrière
- **Mercato** — annonces, candidatures, pipeline pour staff et recruteurs
- **Matchs & Arena** — convocations avec RSVP, live stats, tournois
- **Communauté** — fil, Reels, question de la semaine
- **Le reste** — covoiturage, pôle santé, espace sponsors, contrôle parental

Sur l'IA : on analyse les highlights que le joueur ou le coach enregistre dans son journal (vidéo, photo, notes). On ne prétend pas décortiquer tout le terrain image par image. On dit ce qu'on fait.

### 3. Les 7 pôles

Une seule app, sept univers selon qui tu es :

- **Amateur** — joueurs et coachs : convocs, Mercato local, covoiturage
- **Supporter** — 100 % gratuit : live, Reels, shop
- **Santé** — kinés, médecins, préparateurs : annuaire vérifié, RDV près des clubs
- **Pro Joueur** — portfolio scouting, stats validées par le coach
- **Pro Club** — arbre d'équipes, recrutement, vitrine publique
- **Pro Staff** — agents, recruteurs, coachs, orgas Arena
- **Sponsor** — visibilité terrain, ROI des campagnes

L'interface s'adapte au rôle : Accueil, Mercato, Matchs, Reels, Fil, Covoit., Santé, Messages, Profil.

### 4. Confiance

Pas tout le monde a les mêmes droits d'emblée :

- Joueurs et supporters : accès rapide
- Coach, agent, recruteur, praticien, club : vérification du diplôme avant la messagerie complète
- Mineurs : contrôle parental, contacts approuvés

Badge orange pendant la revue, badge vert une fois validé. Côté technique : règles Firestore + Cloud Functions sur les données sensibles.

### 5. Comment on gagne de l'argent

- **Joueur / Supporter** — gratuit au départ, offres Plus/Pro en abonnement in-app
- **Coach / Staff** — abonnements Pro (multi-équipes, pipeline, quotas scouting)
- **Sponsor** — Découverte 0 €, Territorial 49 €/mois, National Pro 99 €/mois
- **Santé** — abonnement léger + 10 % sur les RDV pris via ProDay

Les abonnements in-app sont en cours de déploiement. En bêta, l'activation Pro se fait encore à la main.

### 6. Où on en est

- Bêta fermée en cours — TestFlight iOS, APK Android
- Liste d'attente : [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription)
- Démo sans install : [proday75.fr/demo](https://proday75.fr/demo)

### 7. La technique (en bref)

App Expo / React Native, site Next.js, backend Firebase (Auth, Firestore, Functions, notifications). IA Mistral pour les highlights. Une seule base de données, des vraies données en prod — pas de démo bidon.

### 8. La suite

- **Déjà livré** — dashboard IA, Mercato, live stats, Arena, fil/Reels, sponsors, admin
- **En cours** — abonnements store, push géo sponsors, montée en puissance Firebase
- **Plus tard** — analyse vidéo poussée, détection de talents, paiements tournois (pas promis pour aujourd'hui)

### 9. Ce qu'on cherche

- Des testeurs bêta — joueurs, coachs, clubs (Île-de-France et au-delà)
- Des partenaires — marques locales et nationales
- Des investisseurs ou advisors — sport-tech, mobile, communautés sportives

### 10. Pour finir

> **ProDay — L'app pour le foot. Ton profil, tes matchs, ton club. Tout au même endroit.**

[proday75.fr](https://proday75.fr) · [contact@proday.app](mailto:contact@proday.app) · [partenaires@proday.app](mailto:partenaires@proday.app)

---

## Notes pour présenter

| Slide | ~Durée | À retenir |
|-------|--------|-----------|
| Titre | 15 s | La mission en une phrase |
| Problème | 30 s | WhatsApp, Excel, Facebook |
| Solution | 45 s | Une app, des vraies données |
| 7 pôles | 45 s | Tout l'écosystème |
| Fonctionnalités | 40 s | Pulse, Mercato, live stats |
| Confiance | 25 s | Diplômes vérifiés |
| Business | 30 s | Gratuit + Pro + sponsors |
| Bêta | 25 s | Waitlist et démo |
| Tech | 20 s | Mobile + web + Firebase |
| Roadmap | 25 s | On ne sur-vend pas l'IA |
| CTA | 15 s | Rejoindre la bêta |

**Total : environ 4 min 30**

---

## Raccourcis clavier

| Touche | Action |
|--------|--------|
| `→` `↓` `Espace` | Slide suivante |
| `←` `↑` | Slide précédente |
| `Home` / `End` | Première / dernière slide |
| `F` | Plein écran |

---

© ProDay 2026
