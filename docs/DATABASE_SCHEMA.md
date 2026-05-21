# Schéma Firestore — ProDay

## Collections principales

| Collection | Description |
|------------|-------------|
| `users` | Profils multi-rôles + vérification |
| `users/{uid}/documents` | Diplômes, licences agent |
| `clubs` | Clubs et géolocalisation |
| `tournaments` | Tournois, poules, awards |
| `friendly_matches` | Matchs amicaux |
| `sponsor_offers` | Marketplace sponsors |
| `recruitment_posts` | Mur Mercato |
| `messages` | Messagerie (coach/agent vérifiés uniquement) |

## Champs critiques — `users/{uid}`

| Champ | Type | Défaut | Notes |
|-------|------|--------|-------|
| `role` | string | — | `player`, `coach`, `agent`, `organizer`, `sponsor` |
| `is_verified` | boolean | `false` | `true` seulement après validation admin (coach/agent) |
| `verification_status` | string | `PENDING` ou `NOT_REQUIRED` | `PENDING`, `VERIFIED`, `REJECTED` |
| `location` | GeoPoint | — | Géofencing agents (50 km) |
| `notification_radius_km` | number | `50` | Rayon alertes agent |

## Workflow validation (coach / agent)

1. `createProfile` → `is_verified: false`, `verification_status: PENDING`
2. Upload document → sous-collection `documents`
3. Admin `validateProfile` callable → `VERIFIED` ou `REJECTED`
4. Firestore rules : l'utilisateur ne peut pas modifier `is_verified` lui-même

Voir `firebase/firestore.rules` et `src/services/profile.service.ts`.
