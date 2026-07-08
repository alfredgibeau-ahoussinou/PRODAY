# Documentation ProDay

> Index de toute la documentation hors code. Pour la carte du dépôt : [STRUCTURE.md](./STRUCTURE.md).

## Démarrage

| Document | Public | Description |
|----------|--------|-------------|
| [../README.md](../README.md) | Tous | Point d'entrée du dépôt |
| [STRUCTURE.md](./STRUCTURE.md) | Dev | Arborescence commentée du monorepo |
| [ProDay_Brief_NonDev.md](./ProDay_Brief_NonDev.md) | Non-dev | Brief produit (source Markdown) |
| [design/ProDay_Brief.html](./design/ProDay_Brief.html) | Non-dev | Brief exportable PDF via navigateur |

## Produit & vision

| Document | Sujet |
|----------|-------|
| [PRODAY_VISION.md](./PRODAY_VISION.md) | Vision long terme |
| [PRODAY_POLES_ARCHITECTURE.md](./PRODAY_POLES_ARCHITECTURE.md) | Six pôles produit (détail) |
| [PRODAY_V3_MODULES.md](./PRODAY_V3_MODULES.md) | Modules V3 |
| [PRODAY_V3_PRODUCT_ANALYSIS.md](./PRODAY_V3_PRODUCT_ANALYSIS.md) | Analyse produit V3 |
| [PRICING_STRATEGY.md](./PRICING_STRATEGY.md) | Stratégie tarifaire |
| [CONVENTION_SPONSOR.md](./CONVENTION_SPONSOR.md) | Modèle convention partenaire |

## Technique

| Document | Sujet |
|----------|-------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Diagrammes architecture |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schéma Firestore |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | Cloud Functions & services |
| [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) | Configuration Firebase |
| [FIRESTORE_DEPLOY.md](./FIRESTORE_DEPLOY.md) | Déploiement règles & index |
| [FIREBASE_RECONNECT.md](./FIREBASE_RECONNECT.md) | Reconnexion projet Firebase |
| [AI_SETUP.md](./AI_SETUP.md) | Mistral / analyse IA |
| [ADMIN_SETUP.md](./ADMIN_SETUP.md) | Comptes admin plateforme |
| [WEBSITE_SECURITY.md](./WEBSITE_SECURITY.md) | Sécurité site vitrine |

## Stores & release

| Document | Sujet |
|----------|-------|
| [STORE_SETUP.md](./STORE_SETUP.md) | SKU IAP App Store / Play |
| [STORE_RELEASE.md](./STORE_RELEASE.md) | Process release |
| [APP_STORE_LISTING.md](./APP_STORE_LISTING.md) | Fiches store |
| [PRODAY_V3_DEPLOY.md](./PRODAY_V3_DEPLOY.md) | Déploiement V3 |
| [PRODAY_V3_QA.md](./PRODAY_V3_QA.md) | Checklist QA V3 |

## Bêta & domaine

| Document | Sujet |
|----------|-------|
| [BETA_GUIDE.md](./BETA_GUIDE.md) | Guide opérateur bêta |
| [BETA_WAITLIST.md](./BETA_WAITLIST.md) | Liste d'attente + EmailJS |
| [BETA_LAUNCH.md](./BETA_LAUNCH.md) | Lancement bêta |
| [DOMAIN_PRODAY75_FR.md](./DOMAIN_PRODAY75_FR.md) | Domaine proday75.fr |

## Design

| Document / dossier | Sujet |
|--------------------|-------|
| [design/DESIGN_SYSTEM.md](./design/DESIGN_SYSTEM.md) | Couleurs, typo, composants |
| [design/FIGMA_BRIEF.md](./design/FIGMA_BRIEF.md) | Reprise maquettes Figma |
| [design/mockups/](./design/mockups/) | Maquettes HTML interactives |
| [../assets/branding/](../assets/branding/) | Logos et planches UI |

## Juridique

| Document | Sujet |
|----------|-------|
| [legal/TERMS_OF_USE.md](./legal/TERMS_OF_USE.md) | CGU |
| [legal/PRIVACY_POLICY.md](./legal/PRIVACY_POLICY.md) | Confidentialité |
| [legal/pactes/](./legal/pactes/) | Pactes associés (`npm run docs:pactes`) |
| [legal/pdf/](./legal/pdf/) | PDF générés |

## Commandes doc utiles

```bash
npm run docs:open-brief      # Brief HTML
npm run docs:open-mockups    # Maquettes interactives
npm run docs:guide-restant   # PDF guide associés
npm run docs:pactes          # PDF pactes (4 exemplaires)
npm run docs:legal           # PDF CGU / confidentialité
npm run docs:cv              # CV joueur exemple
```
