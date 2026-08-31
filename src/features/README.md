# Features (`src/features/`)

Modules produit **riches** (V3) : écrans composites, engines, dashboards. Au-dessus de `core/` et `components/`.

## Contenu

| Dossier | Rôle |
|---------|------|
| `home/` | Dashboard accueil V3 (`HomeIaDashboard`…) |
| `v3/` | Engines V3, intelligence par onglet |

## V3 vs legacy

- **V3** (cible) : `features/` + `components/v3/` + `EXPO_PUBLIC_V3_SHELL=1` (déjà sur profils EAS store)
- **Legacy** : `screens/DashboardScreen` + `components/dashboard/`

Objectif : converger vers V3, puis retirer le legacy.

## Liens

- [../README.md](../README.md)
- [../STRUCTURE.md](../STRUCTURE.md)
- [../../docs/PRODAY_V3_MODULES.md](../../docs/PRODAY_V3_MODULES.md)
