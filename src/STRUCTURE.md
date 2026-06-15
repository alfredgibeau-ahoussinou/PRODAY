# Structure du code — ProDay

> Guide rapide pour naviguer dans `src/` sans se perdre entre legacy et V3.

## Règle d’or

| Dossier | Rôle |
|---------|------|
| `src/screens/` | Points d’entrée navigation (onglets, modales plein écran) |
| `src/components/` | UI réutilisable par domaine (`mercato/`, `matchs/`, `profile/`…) |
| `src/features/` | Modules V3 riches (`home/`, `v3/engines/`) |
| `src/core/` | Moteurs métier purs (santé, reco, géo, calendrier) |
| `src/services/` | Firebase et APIs |
| `src/hooks/` | État et orchestration React |
| `src/content/` | Textes, chapitres, copy produit |
| `src/utils/` | Helpers sans UI |
| `src/navigation/` | Onglets, résolution d’écrans |

## V3 vs legacy

- **V3** : `EXPO_PUBLIC_V3_SHELL=1` → `HomeIaDashboard`, `V3TabShell`, `features/v3/`
- **Legacy** : `DashboardScreen`, `components/dashboard/` (accueil sans flag)

Objectif : converger vers V3, puis retirer le legacy.

## Imports à privilégier

```ts
import { PressableSpring } from '../motion';
import { rankScore, buildMatchRecommendations } from '../core';
import { V3TabShell } from '../components/v3/V3TabShell';
```

## Nettoyage récent

- Suppression `proday-next/` (migration non branchée)
- Un seul `PressableSpring` : `components/motion/`
- Panneau intelligence par onglet désactivé (`isV3IntelligenceUiEnabled`)
