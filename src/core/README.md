# Core (`src/core/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — ProDay **1.0.9**

Moteurs métier **sans UI** : scores, règles, agrégations, recommandations. Importables depuis `services/`, `hooks/`, `features/` et tests.

## Modules

| Dossier | Rôle |
|---------|------|
| `recommendation/` | Scoring & suggestions (matchs, contenus…) |
| `recruitment/` | Logique recrutement / mercato |
| `health/` | Programmes & règles santé |
| `gamification/` | Badges, progression |
| `geo/` | Proximité, filtres géo |
| `calendar/` | Agrégation calendrier |
| `social/` | Règles sociales / feed |
| `ai/` | Helpers IA côté client |
| `analytics/` | Événements analytics métier |
| `notifications/` | Règles de notification |
| `events/` | Modèle événements |
| `state/` | État métier partagé (non-React) |
| `types/` | Types partagés core |
| `actionDispatch.ts` · `index.ts` | Dispatch / barrel exports |

## Conventions

- Pas de composants React, pas d’imports `screens/` / `components/`.
- Fonctions pures ou quasi-pures préférées — facile à tester dans `__tests__/`.
- UI et I/O réseau restent dans `components/` et `services/`.

## Exemple d’import

```ts
import { /* helpers exportés */ } from '../core';
```

[PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

[`../README.md`](../README.md) · [`../services/README.md`](../services/README.md) · [`../features/README.md`](../features/README.md)
