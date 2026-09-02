# Features (`src/features/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — ProDay **1.0.9**

Modules produit riches : shells de rôle, hubs, engines V3. Au-dessus de `core/`, `components/` et `services/`.

## Modules

| Dossier | Contenu |
|---------|---------|
| `coach/` | `CoachAppShell`, hub profil, panes menu / outils |
| `club/` | `ClubAppShell`, sidebar, assistant, create sheets |
| `president/` | `PresidentAppShell`, bridge, panes président |
| `joueur/` | Extras shell joueur (HUD, overlays métier) |
| `parent/` | Tab bar / sidebar / contexte nav parent |
| `admin/` | Console admin (`AdminAppShell`, top bar, work queue) |
| `auth/` | Expérience auth (shell présentation) |
| `home/` | Accueil / dashboards feature |
| `supporter/` | Logique feature supporter |
| `v3/` | Engines & shell V3 (`EXPO_PUBLIC_V3_SHELL=1`) |

## Shells vs `navigation/`

- **Coach, club, président, admin** : définis ici (`*/shell/`).
- **Parent, sponsor, supporter, MainTabs joueur** : `src/navigation/`.
- `App.tsx` bascule selon `profile.role` / preview admin.

## Conventions

- Isoler le chrome par rôle : pas de HUD joueur sur coach/club/admin.
- Safe-area : les shells coach/club paddent déjà le haut.
- Profil coach : hub + chapter pager — si corps noir vide, vérifier d’abord la hauteur du pager.

## Liens

```bash
npm start
npm run ios:sim
eas build --profile preview
```

[PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

[`../README.md`](../README.md) · [`../navigation/README.md`](../navigation/README.md) · [`../screens/README.md`](../screens/README.md)
