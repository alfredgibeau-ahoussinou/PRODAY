# Structure du dépôt ProDay

> Carte commentée du monorepo. **Ne pas déplacer** `src/`, `website/src/`, `functions/src/` ni les configs racine sans mettre à jour imports et CI.

## Vue d'ensemble

```
PRODAY/                          Monorepo ProDay (app mobile + site + backend)
├── src/                         Application React Native / Expo
├── website/                     Site vitrine Next.js (root deploy = website/)
├── functions/                   Cloud Functions Firebase (TypeScript)
├── firebase/                    Règles Firestore, Storage, templates Auth
├── docs/                        Documentation produit, technique, juridique
├── scripts/                     Outils CLI (seed, PDF, branding, tests)
├── assets/                      Images, logos, diagrammes Mermaid
├── .maestro/                    Flows E2E mobile (Maestro)
├── e2e/                         Point d'entrée doc tests E2E
├── android/ · ios/              Projets natifs Expo (ne pas réorganiser)
└── [configs racine]             package.json, app.json, firebase.json, eas.json…
```

## Dossiers racine

| Dossier | Rôle | README |
|---------|------|--------|
| `src/` | App mobile Expo — écrans, composants, services Firebase | [src/README.md](../src/README.md) |
| `website/` | Site public Next.js (proday75.fr) | [website/README.md](../website/README.md) |
| `functions/` | Logique serveur (IAP, push, bêta, IA, sync) | [functions/README.md](../functions/README.md) |
| `firebase/` | Règles sécurité + templates e-mail Auth | [firebase/README.md](../firebase/README.md) |
| `docs/` | Toute la doc hors code | [docs/README.md](./README.md) |
| `scripts/` | Scripts npm (`docs:*`, `firebase:*`, branding…) | [scripts/README.md](../scripts/README.md) |
| `assets/` | Médias statiques (branding, shop, mockups) | [assets/README.md](../assets/README.md) |
| `.maestro/` | Scénarios UI mobile | [.maestro/README.md](../.maestro/README.md) |
| `e2e/` | Index tests E2E (Jest + Maestro) | [e2e/README.md](../e2e/README.md) |
| `android/` · `ios/` | Builds natifs générés par Expo — structure standard | — |
| `.github/workflows/` | CI (déploiement site, checks) | — |

## Application mobile (`src/`)

```
src/
├── screens/          Écrans navigation (1 fichier ≈ 1 route)
├── components/       UI par domaine (mercato, matchs, profile…)
├── features/         Modules V3 (home IA, engines)
├── core/             Moteurs métier purs (reco, santé, géo…)
├── services/         Accès Firebase et APIs externes
├── navigation/       Onglets, shells (joueur, sponsor, admin)
├── hooks/            État React réutilisable
├── context/          Providers globaux (auth, thème, segment)
├── theme/            Tokens Homme / Woman / Pro
├── models/           Types domaine (User, Club, Event…)
├── content/          Copy produit, chapitres, textes légaux embarqués
├── utils/            Helpers sans UI
├── i18n/             Traductions
├── config/           Feature flags, env
├── __tests__/        Tests Jest (unitaires + e2e-adjacents)
└── STRUCTURE.md      Guide navigation détaillé dans src/
```

**Admin** : pas de dossier racine `admin/` — console dans `src/screens/admin/` et `src/components/admin/`.

**V3 vs legacy** : voir [src/STRUCTURE.md](../src/STRUCTURE.md).

## Site vitrine (`website/`)

```
website/
├── src/
│   ├── app/          Routes Next.js App Router (21+ pages)
│   ├── components/   Blocs UI (demo, pricing, universe…)
│   ├── content/      Textes marketing
│   └── lib/          Utilitaires (API bêta, thèmes)
├── public/           Assets statiques (branding, legal, showcase)
├── scripts/          Scripts propres au site
└── netlify.toml      Config déploiement Netlify
```

Déploiement : root directory = `website` (Netlify). Voir [website/README.md](../website/README.md).

## Backend (`functions/` + `firebase/`)

```
functions/src/
├── index.ts                  Export de toutes les fonctions
├── sponsorGeoPush.ts         Push géo offres sponsors
├── teamEventActivitySync.ts  Sync activités joueur
├── analyzeActivityHighlight.ts  Analyse IA séances (Mistral)
├── authCustomEmails.ts       E-mails Auth brandés (Resend)
├── subscriptionIap.ts        Abonnements store
├── betaWaitlist*.ts          Liste d'attente bêta
└── …

firebase/
├── firestore.rules           Sécurité Firestore
├── firestore.indexes.json    Index composites
├── storage.rules             Sécurité Storage
└── auth-email-templates/     HTML e-mails Auth (fallback Console)
```

## Documentation (`docs/`)

| Sous-dossier | Contenu |
|--------------|---------|
| `design/` | Brief, maquettes HTML, design system, Figma |
| `legal/` | CGU, confidentialité, pactes associés, PDF |
| `emailjs/` | Config templates bêta waitlist |
| `*.md` (racine) | Architecture, Firebase, stores, bêta, V3… |

Index complet : [docs/README.md](./README.md).

## Scripts (`scripts/`)

Scripts invoqués via `npm run` à la racine. Catégories : Firebase, PDF/docs, branding, comptes test, i18n, charge. Détail : [scripts/README.md](../scripts/README.md).

## Assets (`assets/`)

| Sous-dossier | Contenu |
|--------------|---------|
| `branding/` | Logos officiels light/dark |
| `mockups/` | Planches UI présentation |
| `diagrams/` | Sources Mermaid (`.mmd`) |
| `shop/` | Visuels boutique par univers |
| `generated/` | Assets générés par scripts |

## Tests

| Emplacement | Type |
|-------------|------|
| `src/__tests__/` | Jest — unitaires et e2e-adjacents |
| `scripts/firestore-rules.test.mjs` | Règles Firestore (émulateur) |
| `.maestro/` | Maestro — flows UI device/simulateur |
| `e2e/README.md` | Guide complet |

## Fichiers de config (ne pas déplacer)

| Fichier | Rôle |
|---------|------|
| `package.json` | Scripts et deps app mobile |
| `app.json` / `eas.json` | Config Expo / builds store |
| `firebase.json` | Cibles deploy Firebase |
| `tsconfig.json` | TypeScript app |
| `jest.config.js` | Tests Jest |
| `netlify.toml` (racine) | Redirect monorepo → `website/` |

## Liens utiles

- [README racine](../README.md) — démarrage rapide
- [ARCHITECTURE.md](./ARCHITECTURE.md) — diagrammes Mermaid
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Firestore
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — configuration Firebase
