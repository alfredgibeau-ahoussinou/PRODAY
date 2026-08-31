# Services (`src/services/`)

Couche d’accès données : Firestore, Storage, Cloud Functions, APIs, IAP.

## Rôle

Encapsuler Firebase et les callables. Écrans / hooks appellent les services — pas d’accès Firestore direct dans l’UI.

## Catégories

| Préfixe / fichier | Domaine |
|-------------------|---------|
| `auth*.service.ts` | Authentification |
| `profile.service.ts` | Profils, validation coach/agent |
| `clubs.service.ts` · `teamEvents.service.ts` | Clubs, événements équipe |
| `sponsors.service.ts` | Offres, push géo partenaires |
| `mercato*.ts` · `recruitment*.ts` | Recrutement |
| `messaging.service.ts` | Conversations |
| `notification*.ts` · `pushToken.service.ts` | FCM / Expo push |
| `subscription*.ts` · `iap*.ts` | Abonnements store |
| `admin*.service.ts` | Opérations admin |
| `wearableHealth/` | Santé connectée |

## Conventions

- Suffixe `.service.ts`
- Callables : région `europe-west1`
- Contrats : [../../docs/API_CONTRACTS.md](../../docs/API_CONTRACTS.md)
- Pas de secrets dans le code — variables `EXPO_PUBLIC_*` / EAS secrets

## Liens

- [../README.md](../README.md)
- [../../functions/README.md](../../functions/README.md)
- [../../docs/FIREBASE_SETUP.md](../../docs/FIREBASE_SETUP.md)
