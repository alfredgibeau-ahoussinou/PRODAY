<div align="center">

<img src="website/public/branding/logo-proday-official.png" alt="ProDay" width="360" />

<br /><br />

**CONNECTER • PROGRESSER • RÉUSSIR**

<br />

*Profil, Mercato, journal d'activités et saison — une app mobile honnête sur ce qui est livré aujourd'hui.*

<br />

[![Site](https://img.shields.io/badge/Site-proday75.fr-22d3ee?style=flat-square)](https://proday75.fr)
[![Bêta](https://img.shields.io/badge/Bêta-Inscription-0891b2?style=flat-square)](https://proday75.fr/beta/inscription)
[![Démo](https://img.shields.io/badge/Démo-Navigateur-0a0a0a?style=flat-square)](https://proday75.fr/demo)

</div>

---

## ProDay

ProDay relie carrière, club et communauté foot amateur et semi-pro. Nous parlons de ce qui existe dans l'app — et de ce qui arrive ensuite.

> Les chiffres du site décrivent l'architecture produit, pas l'audience en temps réel.

### Six univers, une plateforme

Comme sur [proday75.fr](https://proday75.fr), la navigation s'articule autour de **six pôles** distincts :

| Pôle | Public | En bref |
|------|--------|---------|
| **Amateur** | Joueurs & coachs | Convocations, covoiturage, Mercato local — district & régional |
| **Supporter** | Fans & communauté | Tribune 100 % gratuite — live scores, suivis, Reels et fil |
| **Santé** | Praticiens & staff médical | Annuaire vérifié — kiné, mental, nutrition |
| **Pro Joueur** | Joueurs pro | Carrière, portfolio scouting, stats validées coach |
| **Pro Club** | Structures & équipes | Arbre des catégories, recrutement, vitrine club |
| **Pro Staff** | Agent · Recruteur · Coach · Orga | Mercato Pro, mandats, convocations, Arena |

**Partenaires** (hors carousel) — sponsors & marques : [proday75.fr/partenaires](https://proday75.fr/partenaires)

### Fondations de la plateforme

- **Profil & carrière** — Pulse, CV en ligne, stats saison, score carrière
- **Mercato** — annonces, candidatures, pipeline staff et recruteurs
- **Matchs & Arena** — amicaux, convocations RSVP, tournois et palmarès
- **Communauté** — Fil, Reels, question hebdo
- **Partenaires** — Découverte (0 €), Territorial (49 €), National Pro (99 €/mois)
- **Santé & famille** — pôle santé, covoiturage, contrôle parental

Pages détaillées : [Fonctionnalités](https://proday75.fr/fonctionnalites) · [Vision](https://proday75.fr/vision) · [Roadmap](https://proday75.fr/roadmap)

---

## Bêta fermée

Inscrivez-vous sur la [liste d'attente](https://proday75.fr/beta/inscription) pour accéder en avant-première.

| Lien | Usage |
|------|-------|
| [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription) | Inscription waitlist (public) |
| [proday75.fr/beta/installer](https://proday75.fr/beta/installer) | Guides APK / TestFlight |
| [proday75.fr/beta/programme](https://proday75.fr/beta/programme) | Programme — six pôles |

```bash
npm run beta:check   # Firebase, typecheck, Jest, règles Firestore, pages légales
```

Guides : [docs/BETA_LAUNCH.md](docs/BETA_LAUNCH.md) · [docs/BETA_GUIDE.md](docs/BETA_GUIDE.md)

---

## Démarrage rapide

### Prérequis

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (via `npx expo`)
- Compte Firebase (projet `proday-155b0`)

### Installation

```bash
git clone https://github.com/alfredgibeau-ahoussinou/PRODAY.git
cd PRODAY
npm install
cp .env.example .env   # puis remplir les clés Firebase (console proday-155b0)
```

### Lancer l'app mobile

```bash
npm start            # menu Expo — QR code avec Expo Go
npm run web          # Expo Web (navigateur)
npm run ios          # simulateur iOS
npm run android      # émulateur Android
```

### Lancer le site vitrine

```bash
npm run website:dev  # → http://localhost:3000
```

Démo sans installer l'app : [localhost:3000/demo](http://localhost:3000/demo) — sélecteur Homme / Woman / Pro, 9 onglets comme sur mobile.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Mobile** | Expo SDK 54 · React Native 0.81 · TypeScript |
| **Site vitrine** | Next.js (`website/`) — [21+ routes](website/README.md) |
| **Backend** | Firebase Auth, Firestore, Storage, FCM |
| **Serveur** | Cloud Functions TypeScript (`functions/src/`) |
| **Sécurité** | `firebase/firestore.rules` — validation profils admin |
| **Builds store** | EAS Build · `com.proday.app` |

Données **réelles** depuis Firestore (pas de mock en production). Voir [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

---

## Structure du projet

```
PRODAY/                          Monorepo ProDay
├── src/                         App mobile Expo → src/README.md
├── website/                     Site vitrine Next.js → website/README.md
├── functions/                   Cloud Functions → functions/README.md
├── firebase/                    Règles Firestore / Storage → firebase/README.md
├── docs/                        Documentation → docs/README.md
├── scripts/                     Outils CLI → scripts/README.md
├── assets/                      Branding, intro, diagrammes → assets/README.md
├── .maestro/                    E2E Maestro → .maestro/README.md
└── e2e/                         Guide tests → e2e/README.md
```

Carte détaillée : [docs/STRUCTURE.md](docs/STRUCTURE.md)

---

## Scripts essentiels

| Commande | Action |
|----------|--------|
| `npm run beta:check` | Checklist bêta (env, tests, règles, légal) |
| `npm run firebase:deploy` | Déploie règles + index Firestore |
| `npm run firebase:deploy:functions` | Déploie Cloud Functions |
| `npm run eas:build:preview` | Build TestFlight / APK interne |
| `npm run typecheck` | Vérification TypeScript |
| `npm test` | Tests Jest unitaires |
| `npm run test:e2e:maestro` | Flows E2E mobile (Maestro) |
| `npm run website:build` | Build production site Next.js |

---

## Documentation

| Document | Sujet |
|----------|-------|
| [docs/README.md](docs/README.md) | Index complet |
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | Arborescence du monorepo |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrammes techniques |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Schéma Firestore |
| [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) | Configuration Firebase |
| [docs/BETA_LAUNCH.md](docs/BETA_LAUNCH.md) | Lancement bêta |
| [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) | Logo, couleurs, composants |

---

## Contact

[proday75.fr](https://proday75.fr) · [contact@proday.app](mailto:contact@proday.app) · [Dépôt GitHub](https://github.com/alfredgibeau-ahoussinou/PRODAY)

**ProDay © 2026** — Tous droits réservés · Code propriétaire
