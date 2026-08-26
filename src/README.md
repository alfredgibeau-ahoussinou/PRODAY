# Application mobile ProDay (`src/`)

> Code source React Native / Expo. Point d'entrée : `index.js` (racine) → navigation dans `src/navigation/`.
>
> **Version marketing :** `1.0.8` (`app.json`) · **Icônes / splash :** `assets/branding/proday-*.png`  
> **Dépôt :** [github.com/alfredgibeau-ahoussinou/PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · **Docs publiques :** [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

## Rôle

Toute l'app mobile : joueurs, staff, sponsors, admin. Données **réelles** Firestore (pas de mock en prod).

## Structure

| Dossier | Rôle | README |
|---------|------|--------|
| `screens/` | Écrans (routes navigation) | [screens/README.md](./screens/README.md) |
| `components/` | UI réutilisable par domaine | [components/README.md](./components/README.md) |
| `features/` | Modules V3 (home IA, engines) | [features/README.md](./features/README.md) |
| `core/` | Logique métier pure (sans UI) | [core/README.md](./core/README.md) |
| `services/` | Firebase, APIs, IAP | [services/README.md](./services/README.md) |
| `navigation/` | Onglets, shells, routing | [navigation/README.md](./navigation/README.md) |
| `hooks/` | Hooks React partagés | — |
| `context/` | Providers (auth, thème, segment joueur) | — |
| `theme/` | Tokens design Homme / Woman / Pro (`prodayBrand.ts`) | — |
| `models/` | Types TypeScript domaine | — |
| `content/` | Textes produit, chapitres, légal embarqué | — |
| `utils/` | Helpers (géo, PDF, pricing…) | — |
| `i18n/` | Traductions (`messages/`) | — |
| `config/` | Feature flags, constantes env | — |
| `__tests__/` | Tests Jest | [../e2e/README.md](../e2e/README.md) |

## Guides

- Navigation détaillée : [STRUCTURE.md](./STRUCTURE.md)
- Carte monorepo : [../docs/STRUCTURE.md](../docs/STRUCTURE.md)
- Architecture : [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Schéma données : [../docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)
- Release stores : [../docs/STORE_RELEASE.md](../docs/STORE_RELEASE.md)
- Branding / logos : [../assets/branding/README.md](../assets/branding/README.md)
- Push GitHub : [../docs/GITHUB_AUTH.md](../docs/GITHUB_AUTH.md)

## Lancer

```bash
npm install
npm run web          # Expo Web (navigateur — mode grand écran Mac recommandé)
npm start            # Expo Go (QR)
npm run ios          # Simulateur iOS
npm run android      # Émulateur Android
```

## Mac / grand écran — ce qui est supporté

**Il n’existe pas d’app macOS native** (pas de cible `macos` dans EAS / `app.json`). Sur un Mac :

| Mode | Commande / canal | Grand écran |
|------|------------------|-------------|
| **Expo Web** | `npm run web` puis fenêtre navigateur plein écran | Oui — sidebars / rail dès ~900px |
| TestFlight iOS | build iOS | Non — UI téléphone / iPad portrait |
| Simulateur iOS | `npm run ios:sim` | Non — viewport mobile |

Breakpoints partagés : `src/theme/desktopShellChrome.ts` (Joueur / onglets génériques), plus `coachChrome` / `clubChrome` / `parentChrome` / `presidentChrome` / `adminChrome`.

## V3 vs legacy

Flag `EXPO_PUBLIC_V3_SHELL=1` active le shell V3 (`V3TabShell`, `features/v3/`). Détail : [STRUCTURE.md](./STRUCTURE.md).
