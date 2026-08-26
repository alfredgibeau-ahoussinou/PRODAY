# Application mobile ProDay (`src/`)

**CONNECTER. PROGRESSER. RÉVÉLER.**

Code source React Native / Expo (SDK ~54). Point d’entrée : `index.js` → `App.tsx` → shells de rôle dans `src/navigation/`.

| | |
|---|---|
| **Version** | `1.0.8` (`app.json` / `package.json`) |
| **iOS** | build **17** (TestFlight) — `ios.buildNumber` |
| **Android** | `versionCode` **10** |
| **Icône / splash** | `assets/branding/proday-app-icon.png`, `proday-splash.png` |
| **Bundle** | `com.proday.app` |

## Liens

- Code : [github.com/alfredgibeau-ahoussinou/PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY)
- Docs publiques : [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)
- Site / bêta : [proday75.fr](https://proday75.fr)

## Rôle

App mobile multi-pôles : joueur, coach, club, parent, sponsor, admin (et scaffolds associés). Données **réelles** Firestore — pas de mock en production.

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
| `theme/` | Tokens design + `prodayBrand.ts` | — |
| `models/` | Types TypeScript domaine | — |
| `content/` | Textes produit, chapitres, légal embarqué | — |
| `utils/` | Helpers (géo, PDF, pricing…) | — |
| `i18n/` | Traductions (`messages/`) | — |
| `config/` | Feature flags, constantes env | — |
| `__tests__/` | Tests Jest | [../e2e/README.md](../e2e/README.md) |

## Lancer (dev)

Prérequis : Node 20+, Xcode (iOS) et/ou Android Studio. Copier `.env` depuis `.env.example` (jamais committer de secrets).

```bash
npm install
npm start              # Metro / Expo Go (QR)
npm run start:ios      # Metro en localhost (souvent plus stable sur Mac)
npm run ios:sim        # Simulateur iOS (script dédié)
npm run ios            # expo run:ios
npm run android        # expo run:android
npm run web            # Expo Web (grand écran Mac)
npm test               # Jest
npm run typecheck      # tsc --noEmit
```

## Builds EAS / TestFlight

Pas d’OTA (`expo-updates` absent) : chaque livraison = build EAS natif.

```bash
npm run eas:build:testflight      # iOS → App Store Connect / TestFlight
npm run eas:build:android:apk     # APK interne (preview)
npm run eas:build:android:aab     # AAB Play
npm run eas:submit:testflight     # Soumettre le dernier IPA iOS
```

Détail profils (`eas.json`) et checklist : [../docs/STORE_RELEASE.md](../docs/STORE_RELEASE.md).

### Note build 17 (crash fix)

Le build TestFlight **16** pouvait crasher au démarrage (violation Rules of Hooks : `useWindowDimensions()` après early returns auth/rôle dans `AppShell`).  
Le **build 17** (v1.0.8) corrige ça — hooks avant les early returns. Rebuild EAS obligatoire, pas de patch OTA.

## Mac / grand écran

Pas d’app macOS native. Sur Mac :

| Mode | Commande | Grand écran |
|------|----------|-------------|
| **Expo Web** | `npm run web` | Oui — sidebars dès ~900px |
| Simulateur iOS | `npm run ios:sim` | Non — viewport mobile |
| TestFlight | build store | Non — téléphone / iPad |

Breakpoints : `src/theme/desktopShellChrome.ts` + chrome coach / club / parent / président / admin.

## V3 vs legacy

`EXPO_PUBLIC_V3_SHELL=1` active le shell V3 (`V3TabShell`, `features/v3/`). Les profils EAS `preview` / `production` / `testflight` l’activent déjà. Détail : [STRUCTURE.md](./STRUCTURE.md).

## Guides

- Navigation : [STRUCTURE.md](./STRUCTURE.md)
- Monorepo : [../docs/STRUCTURE.md](../docs/STRUCTURE.md)
- Architecture : [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Schéma données : [../docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)
- Release stores : [../docs/STORE_RELEASE.md](../docs/STORE_RELEASE.md)
- Branding : [../assets/branding/README.md](../assets/branding/README.md)
