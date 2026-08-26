<div align="center">

<img src="website/public/branding/logo-proday-official.png" alt="ProDay — CONNECTER. PROGRESSER. RÉVÉLER." width="360" />

<br /><br />

**CONNECTER. PROGRESSER. RÉVÉLER.**

<br />

*Pas un outil de plus — l’infrastructure de votre football.*  
App mobile **1.0.8** · Site [proday75.fr](https://proday75.fr)

<br />

[![Site](https://img.shields.io/badge/Site-proday75.fr-22d3ee?style=flat-square)](https://proday75.fr)
[![Bêta](https://img.shields.io/badge/Bêta-Inscription-0891b2?style=flat-square)](https://proday75.fr/beta/inscription)
[![App](https://img.shields.io/badge/App-1.0.8-0ea5e9?style=flat-square)](https://proday75.fr/beta/inscription)
[![Docs](https://img.shields.io/badge/Docs-PRODAY--docs-64748b?style=flat-square)](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

<br />

**© ProDay 2026 — Tous droits réservés** · Code propriétaire  
📖 Documentation publique : [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

</div>

---

## ProDay en bref

ProDay n’est **pas huit produits** ni une pile de features marketing. C’est l’**infrastructure** du football amateur et semi-pro : joueurs, clubs, matchs, convocations, stats, parents et sponsors reliés dans **une** app — plus de WhatsApp, tableurs et docs éparpillés.

| | |
|--|--|
| **Tagline** | CONNECTER. PROGRESSER. RÉVÉLER. |
| **Positionnement** | L’infrastructure de votre football |
| **Site** | [proday75.fr](https://proday75.fr) |
| **App** | **1.0.8** (bêta fermée — TestFlight / APK) |
| **Code** | Dépôt **privé** [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) |
| **Docs publiques** | [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) |
| **Logo officiel** | `website/public/branding/logo-proday-official.png` · sources `assets/branding/` |

> Les chiffres du site (onglets, modules, tarifs) décrivent l’**architecture produit**, pas une audience en temps réel. **Pas de métriques inventées.** L’IA analyse les **highlights de séance**, pas chaque geste en match.

---

## Six portes d’entrée

Des **portes d’entrée** vers le même écosystème — pas des apps séparées.

| Porte | Public | En bref |
|-------|--------|---------|
| **Joueur** | Amateur → centre → pro | Saison, Pulse, Mercato, CV |
| **Club** | Structures & équipes | Équipes, licenciés, tournois |
| **Coach** | Staff terrain | Forme, tactique, convocations |
| **Parent** | Familles | Agenda, messages, trajets |
| **Supporter** | Fans | Scores, compositions — tribune gratuite |
| **Sponsor** | Marques | Activations & impact |

Agent, recruteur, organisateur et santé restent des **rôles intégrés**, pas des produits distincts.  
Détail : [proday75.fr/ecosysteme](https://proday75.fr/ecosysteme) · [docs/ECOSYSTEM_POLES_EVOLUTION.md](docs/ECOSYSTEM_POLES_EVOLUTION.md)

---

## Monorepo

```
PRODAY/
├── src/              App mobile Expo (React Native)     → src/README.md
├── website/          Site Next.js — proday75.fr         → website/README.md
├── functions/        Cloud Functions TypeScript         → functions/README.md
├── firebase/         Règles Firestore / Storage         → firebase/README.md
├── docs/             Guides opérateur & architecture    → docs/README.md
├── assets/branding/  Logos & identité officielle        → assets/branding/README.md
└── scripts/          CLI, branding, seed, bêta          → scripts/README.md
```

| Couche | Stack |
|--------|--------|
| **Mobile** | Expo SDK 54 · React Native · TypeScript · `com.proday.app` · version **1.0.8** |
| **Site** | Next.js 16 (App Router) · React 19 · Tailwind 4 · Netlify |
| **Backend** | Firebase Auth · Firestore · Storage · Cloud Functions · FCM |
| **IA** | Mistral (highlights journal) via Cloud Functions |
| **Builds** | EAS (`preview` APK · `testflight` / `production`) |

---

## Démarrage

### Prérequis

Node.js **20+** · compte Firebase `proday-155b0` · (optionnel) EAS CLI pour les builds store.

```bash
git clone https://github.com/alfredgibeau-ahoussinou/PRODAY.git
cd PRODAY
npm install
cp .env.example .env   # clés Firebase — voir docs/FIREBASE_SETUP.md
```

### App mobile

```bash
npm start              # Expo — QR / simulateurs
npm run ios            # Simulateur iOS
npm run android        # Émulateur Android
```

### Site vitrine

```bash
npm run website:dev    # → http://localhost:3000
# ou : cd website && npm run dev
```

Variables site (bêta EmailJS, etc.) : `website/.env.example` → `website/.env.local`.  
Déploiement Netlify : [website/README.md](website/README.md).

### Qualité

```bash
npm run typecheck
npm test
npm run beta:check     # checklist avant PR / release bêta
```

---

## Bêta

Inscription publique : [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription)  
Guides opérateur : [docs/BETA_GUIDE.md](docs/BETA_GUIDE.md) · [docs/BETA_LAUNCH.md](docs/BETA_LAUNCH.md)

Les CTA « Accès anticipé » pointent **uniquement** vers `/beta/inscription`.

---

## Documentation

| Document | Rôle |
|----------|------|
| [docs/README.md](docs/README.md) | Index complet |
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | Carte du monorepo |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrammes techniques |
| [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) | Identité visuelle |
| [assets/branding/README.md](assets/branding/README.md) | Logos (usages store / UI / emails) |
| [website/README.md](website/README.md) | Routes site & Netlify |
| [src/README.md](src/README.md) | Navigation app |

---

## Contact

[proday75.fr](https://proday75.fr) · [proday.admin@gmail.com](mailto:proday.admin@gmail.com)  
Code (privé) : [alfredgibeau-ahoussinou/PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY)  
Docs (public) : [alfredgibeau-ahoussinou/PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

**ProDay © 2026** — Tous droits réservés · [LICENSE](./LICENSE) · [SECURITY.md](./SECURITY.md) · [COPYRIGHT.md](./COPYRIGHT.md)
