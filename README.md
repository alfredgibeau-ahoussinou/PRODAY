<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/branding/logo-proday-lockup-white.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/branding/logo-proday-lockup-black.png">
  <img src="assets/branding/logo-proday-official.png" alt="ProDay · CONNECTER. PROGRESSER. RÉVÉLER." width="380" />
</picture>

<br /><br />

# CONNECTER · PROGRESSER · RÉVÉLER

*Pas un outil de plus. L’infrastructure de votre football.*

App mobile **1.0.9** (iOS build 18 · Android versionCode 11) · [proday75.fr](https://proday75.fr)

[![Site](https://img.shields.io/badge/Site-proday75.fr-F5D04A?style=flat-square&logo=googlechrome&logoColor=black)](https://proday75.fr)
[![Bêta](https://img.shields.io/badge/Bêta-Inscription-0891b2?style=flat-square)](https://proday75.fr/beta/inscription)
[![Docs publiques](https://img.shields.io/badge/Docs-PRODAY--docs-0ea5e9?style=flat-square)](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

© ProDay 2026 · Tous droits réservés · Code propriétaire  
Documentation publique : [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

</div>

---

## Qu’est-ce que ProDay ?

ProDay n’est pas une collection d’apps séparées. C’est **l’infrastructure unifiée** du football amateur et professionnel : joueurs, coachs, clubs, familles, supporters et sponsors partagent le **même graphe de données**.

Six portes d’entrée, une seule plateforme :

| Porte | Rôle |
|-------|------|
| **Joueur** | CV digital, saison, Pulse, Mercato, highlights |
| **Coach** | Forme, tactique, convocations, séances |
| **Club** | Équipes, licenciés, tournois, organisation |
| **Parent** | Agenda, messages, trajets, contrôle tuteur |
| **Supporter** | Scores, compositions, communauté |
| **Sponsor** | Activations locales, packages, impact |

Agent, recruteur, organisateur et santé restent des **rôles intégrés**, pas des produits séparés.

| | |
|--|--|
| Slogan | CONNECTER · PROGRESSER · RÉVÉLER |
| Site | [https://proday75.fr](https://proday75.fr) |
| App | **1.0.9** (`app.json` / `package.json`) |
| Bundle | `com.proday.app` |
| Logo | `assets/branding/logo-proday-official.png` |
| Palette | `#000` / `#FFF` / `#C5A059` (or master) · accents site `#07100c` / `#F5D04A` |
| Dépôt code | [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) (privé) |
| Docs publiques | [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) |

---

## Structure du monorepo

```
PRODAY/
├── src/            App mobile Expo (React Native + TypeScript)
├── website/        Site officiel Next.js 16 · Netlify · proday75.fr
├── functions/      Cloud Functions Firebase
├── firebase/       Règles Firestore / Storage / index
├── assets/         Branding, marketing, intro vidéo, mockups
├── docs/           Guides opérateur, architecture, légal, stores
├── presentation/   Deck HTML pitch
└── scripts/        CLI build, seed, branding, marketing
```

---

## Stack

| Couche | Techno |
|--------|--------|
| Mobile | Expo SDK 54 · React Native 0.81 · React 19 · TypeScript |
| Web | Next.js 16 (App Router) · Tailwind CSS 4 · Netlify |
| Backend | Firebase Auth · Firestore · Storage · Cloud Functions |
| Paiements | Stripe (abonnements clubs / sponsoring) |
| Builds | EAS (TestFlight / APK) · Gradle |

---

## Démarrage

### Prérequis

Node.js LTS, npm, compte Firebase configuré (voir `docs/FIREBASE_SETUP.md`).

### Installation

```bash
git clone https://github.com/alfredgibeau-ahoussinou/PRODAY.git
cd PRODAY
npm install
cp .env.example .env   # renseigner Firebase / clés nécessaires
```

### App mobile

```bash
npm start              # Metro Expo
npm run start:ios      # simulateur iOS
npm run android        # émulateur Android
```

### Site web

```bash
npm run website:dev    # http://localhost:3000
# ou
cd website && npm install && npm run dev
```

### Qualité

```bash
npm run typecheck
npm test
```

---

## Déploiements (aperçu)

| Cible | Commande / doc |
|-------|----------------|
| Site Netlify | `cd website && npm run netlify:deploy` |
| APK bêta | `npm run android:apk:beta` |
| TestFlight | voir `docs/STORE_RELEASE.md` et `docs/BETA_IOS_LAUNCH.md` |

Bêta publique : [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription)

---

## Documentation

- Index interne : [`docs/README.md`](docs/README.md)
- Sécurité site : [`docs/WEBSITE_SECURITY.md`](docs/WEBSITE_SECURITY.md)
- Branding : [`assets/branding/README.md`](assets/branding/README.md)
- Site : [`website/README.md`](website/README.md)

---

## Licence

© 2026 ProDay · Tous droits réservés.  
Logiciel propriétaire. Reproduction ou distribution non autorisée interdite.
