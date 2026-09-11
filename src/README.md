# ProDay — application mobile (`src/`)

**CONNECTER. PROGRESSER. RÉVÉLER.**

Code source Expo / React Native de ProDay. Point d’entrée : `App.tsx` (racine du monorepo) → shells de rôle ou onglets principaux.

| | |
|---|---|
| Version | **1.0.10** (`package.json` / `app.json`) |
| Bundle | `com.proday.app` |
| Stack | Expo ~54 · React Native · TypeScript |
| Site | [proday75.fr](https://proday75.fr) |
| Code | [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) |
| Docs | [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) |

## Lancer l’app

Depuis la racine du monorepo :

```bash
npm start              # Metro / Expo
npm run start:ios      # Expo en mode localhost (appareil / sim)
npm run ios:sim        # Simulateur iOS (scripts/run-ios-simulator.sh)
npm run ios            # expo run:ios (Dev Client)
npm run android        # expo run:android
```

Builds EAS (profils dans `eas.json`) :

```bash
eas build --profile development   # Dev Client (sim iOS possible)
eas build --profile preview       # Interne (APK Android)
eas build --profile production    # Store
eas build --profile testflight    # iOS store / TestFlight
```

Tests : `npm test` · `npm run typecheck` · E2E Jest `npm run test:e2e` · Maestro `npm run test:e2e:maestro`.

Ne pas committer de secrets (`.env`, clés service account, mots de passe). Config publique uniquement via `EXPO_PUBLIC_*` / secrets EAS.

## Branding app

Fichiers référencés par `app.json` :

| Usage | Chemin |
|-------|--------|
| Icône | `assets/branding/proday-app-icon.png` |
| Splash | `assets/branding/proday-splash.png` |
| Adaptive Android | `assets/branding/proday-adaptive-foreground.png` |
| Notification | `assets/branding/proday-notification-icon.png` |
| Lockup source | `assets/branding/proday-lockup-official-source.png` |
| Symboles pôles | `assets/branding/proday-symbol-pole-*.png` |

Régénération : `npm run branding:app`.

## Structure `src/`

```
src/
├── navigation/     Onglets, deep links, shells parent/sponsor/supporter
├── screens/        Écrans navigables (pôles + flux auth / match / reels…)
├── features/       Modules riches par rôle (coach, club, joueur, admin…)
├── components/     UI réutilisable (pas d’accès Firebase direct)
├── services/       Firestore, Auth, Storage, callables, IAP
├── core/           Moteurs métier purs (santé, reco, géo, gamification…)
├── context/        Providers React (auth, produit, shells)
├── hooks/          Orchestration d’état côté UI
├── theme/          Tokens, typo (Inter titres, Syne brand), chrome desktop
├── models/         Types et modèles métier
├── content/        Copy produit, légal embarqué
├── motion/         Primitives d’animation
├── i18n/           Locales
├── utils/          Helpers sans UI
└── __tests__/      Jest (unitaires + e2e sous __tests__/e2e/)
```

Guide complémentaire : [`STRUCTURE.md`](./STRUCTURE.md).

### Navigation & shells

`App.tsx` choisit le shell selon le rôle de session :

| Rôle | Emplacement principal |
|------|------------------------|
| Coach | `features/coach/shell/CoachAppShell` |
| Club | `features/club/shell/ClubAppShell` |
| Président | `features/president/shell/PresidentAppShell` |
| Parent | `navigation/ParentAppShell` |
| Sponsor | `navigation/SponsorAppShell` |
| Supporter | `navigation/SupporterAppShell` |
| Admin | `features/admin/shell/AdminAppShell` |
| Joueur (onglets) | `navigation/MainTabs` + extras `features/joueur/` |

Détails : [`navigation/README.md`](./navigation/README.md).

### Règles utiles

- Typo : titres UI (`title` / `section` / `hero`) → **Inter** via `ProDayText` ; Syne réservé au `brand`.
- Univers joueur : âge × genre (`theme` / identity) — Firebase `birth_date` / genre priment sur le gate local.
- Pagers horizontaux : mesurer la hauteur ; `flex: 1` ne suffit pas dans un `ScrollView` horizontal.
- Les shells coach/club gèrent déjà le safe-area haut : ne pas doubler `insets.top` sur les headers profil.

## Liens internes

- [`screens/`](./screens/README.md) · [`features/`](./features/README.md) · [`services/`](./services/README.md)
- [`components/`](./components/README.md) · [`core/`](./core/README.md)
- Scripts CLI : [`../scripts/README.md`](../scripts/README.md)
- E2E : [`../e2e/README.md`](../e2e/README.md) · Maestro : [`../.maestro/README.md`](../.maestro/README.md)
