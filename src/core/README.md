# Core (`src/core/`)

> Moteurs métier **sans UI** : algorithmes, règles, agrégations. Importable depuis services, hooks et features.

## Modules

| Dossier | Rôle |
|---------|------|
| `ai/` | Orchestration IA côté client |
| `analytics/` | Événements et métriques |
| `calendar/` | Logique calendrier / rappels |
| `events/` | Événements domaine |
| `gamification/` | Badges, scores |
| `geo/` | Géolocalisation, zones |
| `health/` | Calculs santé / charge |
| `notifications/` | Règles de notification |
| `recommendation/` | Reco matchs, joueurs |
| `social/` | Graphe social, feed |
| `state/` | Machines d'état partagées |
| `types/` | Types core transverses |

## Conventions

```ts
import { rankScore, buildMatchRecommendations } from '../core';
```

- Pas d'import React ici
- Tests unitaires dans `src/__tests__/`

## Liens

- [features/README.md](../features/README.md) — modules V3 qui consomment le core
- [../STRUCTURE.md](../STRUCTURE.md)
