# Navigation (`src/navigation/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — ProDay **1.0.9**

Couche de routage mobile : onglets, overlays d’auth, shells parent / sponsor / supporter. Les shells coach, club, président et admin vivent sous `features/*/shell/` et sont branchés depuis `App.tsx`.

## Contenu

| Fichier / dossier | Rôle |
|-------------------|------|
| `MainTabs.tsx` | Barre d’onglets joueur (accueil, mercato, matchs, feed, profil…) |
| `resolveMainTabScreen.tsx` | Résolution écran ↔ onglet |
| `mainTabConfig.ts` · `mobileTabConfig.ts` | Config onglets |
| `ParentAppShell.tsx` | Shell parent (tabs + contexte nav) |
| `SponsorAppShell.tsx` | Shell sponsor (sidebar / tabs produit) |
| `SupporterAppShell.tsx` | Shell supporter |
| `AuthOverlayHost.tsx` · `authOverlay.ts` | Overlay connexion / inscription |
| `guestAccess.ts` | Accès invité |
| `sponsorTabConfig.ts` · `sponsorTabNavigationBridge.ts` | Navigation pôle sponsor |
| `tabBarLayout.ts` · `screenLayout.ts` | Mesures layout barre / écrans |
| `shells/` | Helpers partagés (ex. `productShellTabs`) |
| `parentShellContext.ts` | Contexte navigation parent |

## Qui orchestre quoi

```
App.tsx
  ├─ AdminAppShell          → features/admin/
  ├─ CoachAppShell          → features/coach/
  ├─ ClubAppShell           → features/club/
  ├─ PresidentAppShell      → features/president/
  ├─ ParentAppShell         → ici
  ├─ SponsorAppShell        → ici
  ├─ SupporterAppShell      → ici
  └─ MainTabs (joueur)      → ici + features/joueur/
```

Flag V3 : `EXPO_PUBLIC_V3_SHELL=1` active le shell / dashboard V3 (voir `features/v3/`).

## Conventions

- Importer les écrans depuis `screens/` — pas de logique métier lourde ici.
- Shells dédiés : ne pas réutiliser le chrome HUD joueur sur coach / club / admin.
- Pagers horizontaux (`ProDayTabPager`, hubs profil) : passer une hauteur mesurée aux pages.

## Lancer

```bash
npm start
npm run ios:sim
```

Repo : [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · Site : [proday75.fr](https://proday75.fr) · Docs : [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

Voir aussi : [`../README.md`](../README.md) · [`../screens/README.md`](../screens/README.md)
