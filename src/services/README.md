# Services (`src/services/`)

> Couche d'accès aux données : Firestore, Storage, Cloud Functions, APIs externes, IAP.

## Rôle

Encapsuler Firebase et les callables serveur. Les écrans et hooks appellent les services — pas d'accès Firestore direct dans les composants UI.

## Catégories

| Préfixe / fichier | Domaine |
|-------------------|---------|
| `auth*.service.ts` | Authentification, credentials |
| `profile.service.ts` | Profils, validation coach/agent |
| `clubs.service.ts` · `teamEvents.service.ts` | Clubs, événements équipe |
| `sponsors.service.ts` | Offres, push géo partenaires |
| `mercato*.ts` · `recruitment*.ts` | Recrutement |
| `messaging.service.ts` | Conversations |
| `notification*.ts` | FCM / Expo push |
| `subscription*.ts` · `iap*.ts` | Abonnements store |
| `admin*.service.ts` | Opérations admin |
| `wearableHealth/` | Santé connectée (Health Connect…) |

## Conventions

- Suffixe `.service.ts`
- Callables : région `europe-west1` (aligné Firestore eur3)
- Contrats API : [../../docs/API_CONTRACTS.md](../../docs/API_CONTRACTS.md)

## Liens

- [../../functions/README.md](../../functions/README.md) — Cloud Functions
- [../../docs/FIREBASE_SETUP.md](../../docs/FIREBASE_SETUP.md) — config Firebase
