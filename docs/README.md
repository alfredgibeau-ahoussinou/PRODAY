# Documentation ProDay

Index hors code. Carte du dépôt : [STRUCTURE.md](./STRUCTURE.md).

**CONNECTER. PROGRESSER. RÉVÉLER.** — *L’infrastructure de votre football* · App **1.0.8** · [proday75.fr](https://proday75.fr)

## GitHub

| Dépôt | URL | Contenu |
|-------|-----|---------|
| Code (privé) | [alfredgibeau-ahoussinou/PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) | Monorepo app Expo + site + Cloud Functions |
| Docs publiques | [alfredgibeau-ahoussinou/PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) | README / infos produit publiques |
| Auth Git | [GITHUB_AUTH.md](./GITHUB_AUTH.md) | Push HTTPS / SSH / `gh` |

Version app marketing : **1.0.8** (`app.json`) — [STORE_RELEASE.md](./STORE_RELEASE.md).  
Logo : [`assets/branding/`](../assets/branding/README.md) · CDN : https://proday75.fr/branding/logo-proday-official.png

## Démarrage

| Document | Public | Description |
|----------|--------|-------------|
| [../README.md](../README.md) | Tous | Point d’entrée monorepo |
| [STRUCTURE.md](./STRUCTURE.md) | Dev | Arborescence commentée |
| [ProDay_Brief_NonDev.md](./ProDay_Brief_NonDev.md) | Non-dev | Brief produit |
| [design/ProDay_Brief.html](./design/ProDay_Brief.html) | Non-dev | Brief exportable PDF |

## Produit & vision

| Document | Sujet |
|----------|-------|
| [PRODAY_VISION.md](./PRODAY_VISION.md) | Vision long terme |
| [PRODAY_POLES_ARCHITECTURE.md](./PRODAY_POLES_ARCHITECTURE.md) | Six portes / pôles |
| [ECOSYSTEM_POLES_EVOLUTION.md](./ECOSYSTEM_POLES_EVOLUTION.md) | Évolution écosystème |
| [PRODAY_V3_MODULES.md](./PRODAY_V3_MODULES.md) | Modules V3 |
| [PRODAY_V3_PRODUCT_ANALYSIS.md](./PRODAY_V3_PRODUCT_ANALYSIS.md) | Analyse produit V3 |
| [PRICING_STRATEGY.md](./PRICING_STRATEGY.md) | Grille tarifaire |
| [CONVENTION_SPONSOR.md](./CONVENTION_SPONSOR.md) | Convention partenaire |

## Technique

| Document | Sujet |
|----------|-------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Diagrammes |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Firestore |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | Cloud Functions |
| [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) | Config Firebase |
| [FIRESTORE_DEPLOY.md](./FIRESTORE_DEPLOY.md) | Règles & index |
| [FIREBASE_RECONNECT.md](./FIREBASE_RECONNECT.md) | Reconnexion projet |
| [AI_SETUP.md](./AI_SETUP.md) | Mistral / IA |
| [ADMIN_SETUP.md](./ADMIN_SETUP.md) | Comptes admin |
| [WEBSITE_SECURITY.md](./WEBSITE_SECURITY.md) | Sécurité site |

## Stores & release

| Document | Sujet |
|----------|-------|
| [STORE_SETUP.md](./STORE_SETUP.md) | SKU IAP |
| [STORE_RELEASE.md](./STORE_RELEASE.md) | Process release |
| [APP_STORE_LISTING.md](./APP_STORE_LISTING.md) | Fiches store |
| [APP_REVIEW.md](./APP_REVIEW.md) | Comptes démo + Notes examen Apple |
| [PRODAY_V3_DEPLOY.md](./PRODAY_V3_DEPLOY.md) | Déploiement V3 |
| [PRODAY_V3_QA.md](./PRODAY_V3_QA.md) | QA V3 |

## Bêta & domaine

| Document | Sujet |
|----------|-------|
| [BETA_GUIDE.md](./BETA_GUIDE.md) | Guide opérateur |
| [BETA_WAITLIST.md](./BETA_WAITLIST.md) | Waitlist + EmailJS |
| [BETA_LAUNCH.md](./BETA_LAUNCH.md) | Go/no-go |
| [BETA_IOS_LAUNCH.md](./BETA_IOS_LAUNCH.md) | Campagne iOS TestFlight |
| [DOMAIN_PRODAY75_FR.md](./DOMAIN_PRODAY75_FR.md) | Domaine proday75.fr |

## Design

| Document / dossier | Sujet |
|--------------------|-------|
| [design/DESIGN_SYSTEM.md](./design/DESIGN_SYSTEM.md) | Couleurs, typo, UI |
| [design/FIGMA_BRIEF.md](./design/FIGMA_BRIEF.md) | Maquettes Figma |
| [design/mockups/](./design/mockups/) | Maquettes HTML |
| [../assets/branding/](../assets/branding/) | Logos officiels |

## Juridique

| Document | Sujet |
|----------|-------|
| [legal/TERMS_OF_USE.md](./legal/TERMS_OF_USE.md) | CGU |
| [legal/PRIVACY_POLICY.md](./legal/PRIVACY_POLICY.md) | Confidentialité |
| [legal/pactes/](./legal/pactes/) | Pactes (`npm run docs:pactes`) |
| [legal/pdf/](./legal/pdf/) | PDF générés |

## Commandes utiles

```bash
npm run docs:open-brief      # Brief HTML
npm run docs:open-mockups    # Maquettes
npm run docs:guide-restant   # PDF guide associés
npm run docs:pactes          # PDF pactes
npm run docs:legal           # PDF CGU / confidentialité
npm run docs:cv              # CV joueur exemple
```
