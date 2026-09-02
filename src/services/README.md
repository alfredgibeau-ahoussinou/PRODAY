# Services (`src/services/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — ProDay **1.0.9**

Couche d’accès données côté client Expo : Auth, Firestore, Storage, Cloud Functions (`europe-west1`), push, IAP. Les écrans et hooks appellent les services — pas d’appels Firebase dispersés dans l’UI.

## Familles de fichiers

| Préfixe / zone | Domaine |
|----------------|---------|
| `auth*.service.ts` · `biometricAuth` | Authentification |
| `profile.service.ts` | Profils & validations rôle |
| `clubs*` · `club*` · `teamEvents*` | Clubs, équipements, finance, tournois |
| `coach*` | Évaluations, objectifs, paiements séance |
| `sponsors*` · `mercato*` · `recruitment*` | Sponsoring & recrutement |
| `friendlyMatches*` · `competition*` | Matchs & compétitions |
| `messaging*` · `communityReels*` · `actorReels*` | Messages & reels |
| `notification*` · `pushToken*` | Notifications |
| `subscription*` · `iap*` | Abonnements stores |
| `admin*` | Opérations console admin |
| `carpool*` | Covoiturage |
| `wearableHealth/` (si présent) | Santé connectée |
| `aiTraining*` · `brainState*` | IA / coaching |

Suffixe standard : `.service.ts`.

## Sécurité

- Aucun secret dans le repo (pas de clés privées, pas de mots de passe de comptes test).
- Config client : variables `EXPO_PUBLIC_*` et secrets EAS.
- Contrats API documentés côté docs monorepo / [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs).

## Scripts liés (hors `src/`)

Seeds, santé Firebase, migrations : voir [`../../scripts/README.md`](../../scripts/README.md).

```bash
npm run firebase:health
npm run firebase:seed
```

[PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr)

[`../README.md`](../README.md) · [`../core/README.md`](../core/README.md)
