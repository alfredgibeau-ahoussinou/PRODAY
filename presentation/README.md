# ProDay — Pitch & présentation

Diaporama HTML interactif : ouvrir [`index.html`](./index.html) dans un navigateur (flèches ← → ou clic sur les bords).

---

## Elevator pitch (30 secondes)

**ProDay**, c'est l'app qui unifie le foot amateur et semi-pro : profil, matchs, recrutement, club et communauté — **tout au même endroit**.

Aujourd'hui, une équipe U17 jongle entre cinq groupes WhatsApp, un Excel pour les convocations et des annonces Mercato éparpillées sur les réseaux. ProDay remplace ce chaos par **une seule plateforme mobile**, avec des données réelles et une IA **honnête** sur ce qu'elle analyse vraiment.

**Connecter • Progresser • Réussir** — pour joueurs, coachs, clubs, supporters, staff pro, praticiens santé et sponsors.

→ [proday75.fr](https://proday75.fr) · Bêta ouverte : [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription)

---

## Pitch complet (3–5 minutes)

### 1. Le problème

Le foot amateur et semi-pro fonctionne encore avec des outils fragmentés :

- **Convocations** dans WhatsApp, relances manuelles, absences non tracées
- **Recrutement (Mercato)** sur Facebook, LeBonCoin ou bouche-à-oreille
- **Stats et carrière** dans des tableurs ou pas du tout
- **Supporters** sans fil conducteur entre clubs, matchs live et communauté
- **Staff et praticiens** sans annuaire fiable ni confiance graduée

Résultat : perte de temps, visibilité faible pour les joueurs, clubs qui peinent à recruter, et zéro CV vivant alimenté par la vraie activité terrain.

### 2. La solution — ProDay

ProDay est une **application mobile** (React Native / Expo) + **site vitrine** ([proday75.fr](https://proday75.fr)) qui relie **carrière, club et communauté** dans un seul écosystème.

Notre promesse : donner à chaque acteur du foot amateur les **outils du haut niveau**, sans surestimer l'IA.

**Ce qui est livré aujourd'hui :**

| Pilier | Concret |
|--------|---------|
| **Profil & Pulse** | Score de visibilité, CV en ligne, export PDF, timeline carrière |
| **Mercato** | Annonces ciblées, candidatures, pipeline staff/recruteurs |
| **Matchs & Arena** | Convocations RSVP, Live Stats, tournois et palmarès |
| **Communauté** | Fil, Reels, question hebdo |
| **Transversal** | Covoiturage, pôle santé, espace sponsors, contrôle parental |

L'analyse IA porte sur les **highlights de séance** enregistrés dans le journal (vidéo ou image + notes) — pas une promesse frame-by-frame sur tout le terrain. On dit ce qu'on fait, pas ce qu'on rêve.

### 3. Les sept univers

ProDay s'organise autour de **7 pôles**, chacun avec une coque app adaptée :

| Pôle | Public | Promesse |
|------|--------|----------|
| **Amateur** | Joueurs & coachs | Jouer, encadrer, partager — convocations, Mercato local, covoiturage |
| **Supporter** | Fans | 100 % gratuit — live scores, suivis, Reels, shop |
| **Santé** | Kiné, médecin, prépa… | Annuaire vérifié, RDV près des clubs |
| **Pro Joueur** | Joueurs pro | Portfolio scouting, stats validées coach, mandat agent |
| **Pro Club** | Structures | Arbre équipes, recrutement, vitrine publique |
| **Pro Staff** | Agent, recruteur, coach, orga | Mercato Pro, scouting, Arena |
| **Sponsor** | Marques | Visibilité terrain, ROI campagnes, push géo |

Un seul produit, **neuf onglets dynamiques** selon le rôle — Accueil, Mercato, Matchs, Reels, Fil, Covoit., Santé, Messages, Profil.

### 4. Confiance & sécurité

ProDay applique une **confiance graduée** :

- Joueurs et supporters : accès rapide
- Coach, agent, recruteur, praticien, club : **vérification diplôme** avant messagerie complète
- Mineurs : contrôle parental, contacts approuvés, espace jeunes

Badge orange en revue → badge vert validé. Firestore rules + Cloud Functions pour les champs sensibles.

### 5. Modèle économique

| Segment | Modèle |
|---------|--------|
| **Joueur / Supporter** | Freemium — profil, Pulse, limites Mercato ; offres Plus/Pro via IAP |
| **Coach / Staff** | Abonnements Pro (multi-équipes, pipeline, quotas) |
| **Sponsor** | Découverte (0 €), Territorial (49 €/mois), National Pro (99 €/mois) |
| **Santé** | Abonnement léger + 10 % commission sur RDV réservés via ProDay |

16 SKU IAP en déploiement progressif. En bêta, activation Pro manuelle Firestore.

### 6. Traction & bêta

- **Bêta fermée** en cours — TestFlight iOS / APK Android
- Waitlist sur [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription)
- Démo navigateur sans install : [proday75.fr/demo](https://proday75.fr/demo)
- Site 21+ routes, admin panel, analytics portfolio

### 7. Stack & exécution

Monorepo : **Expo SDK 54** (app) + **Next.js** (site) + **Firebase** (Auth, Firestore, Functions, FCM) + **Mistral** (IA highlights).

Une seule source de vérité Firestore. Données réelles en production — pas de mock. Équipe capable de shipper mobile + web + backend.

### 8. Roadmap honnête

| Phase | Exemples |
|-------|----------|
| ✅ **Livré** | Dashboard IA, Mercato, Live Stats, Arena, Fil/Reels, sponsors, admin |
| 🔄 **En cours** | IAP store, push géo sponsors, Cloud Functions Blaze |
| 📋 **Demain** | Analyse vidéo avancée, détection talent, paiements tournois |

### 9. Ce qu'on cherche

- **Testeurs bêta** — joueurs, coachs, clubs en Île-de-France et au-delà
- **Partenaires** — marques locales et nationales (pôle Sponsor)
- **Investisseurs / advisors** — sport-tech, SaaS mobile, communautés sportives

### 10. Closing

> **ProDay — L'app pour le foot. Ton profil, tes matchs, ton club. Tout au même endroit.**

[proday75.fr](https://proday75.fr) · [contact@proday.app](mailto:contact@proday.app) · [partenaires@proday.app](mailto:partenaires@proday.app)

---

## Notes présentateur

| Slide | Durée | Point clé |
|-------|-------|-----------|
| Titre | 15 s | Accroche mission |
| Problème | 30 s | WhatsApp + Excel + Facebook |
| Solution | 45 s | Une app, données réelles |
| 7 pôles | 45 s | Écosystème complet |
| Fonctionnalités | 40 s | Pulse, Mercato, Live Stats |
| Confiance | 25 s | Vérification diplômes |
| Business | 30 s | Freemium + sponsors |
| Bêta | 25 s | Waitlist + démo |
| Tech | 20 s | Monorepo Firebase |
| Roadmap | 25 s | Honnêteté IA |
| CTA | 15 s | Rejoindre la bêta |

**Total : ~4 min 30**

---

## Raccourcis diaporama

| Touche | Action |
|--------|--------|
| `→` `↓` `Espace` | Slide suivante |
| `←` `↑` | Slide précédente |
| `Home` | Première slide |
| `End` | Dernière slide |
| `F` | Plein écran |
| `Esc` | Quitter plein écran |

---

© ProDay 2026 — Tous droits réservés
