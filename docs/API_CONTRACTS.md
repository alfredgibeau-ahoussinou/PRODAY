# Contrats API — Cloud Functions ProDay

## `onProfileDocumentSubmit` (trigger Firestore)

- **Trigger :** `users/{uid}/documents/{docId}` onCreate
- **Effet :** `verification_status = PENDING`, alerte admin

## `validateProfile` (HTTPS callable)

**Auth :** token admin (`customClaims.admin`)

```json
{
  "uid": "string",
  "action": "approve | reject",
  "rejectionReason": "string (optionnel)"
}
```

**Réponse :** `{ "success": true }`

**Effet :** mise à jour `is_verified`, push FCM utilisateur

## `onTournamentCreated` (trigger Firestore)

- **Trigger :** `tournaments/{id}` onCreate
- **Effet :** query agents + notification &lt; 50 km (`src/utils/geofencing.ts`)

## `submitTournamentAwards` (HTTPS callable)

```json
{
  "tournamentId": "string",
  "bestPlayer": "uid",
  "topScorer": "uid",
  "bestGoalkeeper": "uid"
}
```

**Effet :** awards sur le document tournoi + push abonnés

## Services client (TypeScript)

| Service | Fichier |
|---------|---------|
| Auth + création profil | `src/services/auth.service.ts` |
| Profil & documents | `src/services/profile.service.ts` |
| Tournois & live score | `src/services/tournament.service.ts` |
| Push & géofencing | `src/services/notification.service.ts` |
