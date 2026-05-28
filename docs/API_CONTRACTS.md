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

## `scheduledEventReminders` (Pub/Sub planifié)

- **Schedule :** `every 1 hours` (fuseau `Europe/Paris`)
- **Effet :** pour chaque `team_events` dans les 48 h à venir, si la fenêtre `reminder_hours_before` (défaut 24 h) est active et `auto_reminder_sent_at` absent → push (Expo ou FCM) aux `rsvps.pending` + marque `auto_reminder_sent_at`

## `sendEventRemindersCallable` (HTTPS callable)

**Auth :** organisateur de l’événement ou admin

```json
{ "eventId": "string" }
```

**Réponse :** `{ "success": true, "pending": number, "pushes": number }`

**Effet :** relance manuelle des convoqués encore `pending` via `sendPushToUser` (détecte `ExponentPushToken[...]` → Expo Push API, sinon FCM natif).

## `onTeamEventCreated` (trigger Firestore)

- **Trigger :** `team_events/{eventId}` onCreate
- **Effet :** push « Nouvelle convocation » à chaque `invitee_uid`

## `onTeamPaymentRequestCreated` (trigger Firestore)

- **Trigger :** `team_payment_requests/{requestId}` onCreate
- **Effet :** push au `member_uid` (« Cotisation à régler : X € »)

## `onClubAnnouncementCreated` (trigger Firestore)

- **Trigger :** `club_announcements/{announcementId}` onCreate
- **Effet :** push aux membres du club (`profile.club_id == club_id`)

## Push — `functions/src/messaging.ts`

| Token | Canal |
|-------|--------|
| `ExponentPushToken[...]` / `ExpoPushToken[...]` | [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) |
| Autre | FCM `admin.messaging()` |

**Client :** `teamEventsService.sendReminders(eventId)` appelle `sendEventRemindersCallable` (plus de stub local).

**Déploiement :** `firebase deploy --only functions`

## `team_events` (Firestore)

Événements saison : entraînements, convocations, journées détection.

| Champ | Description |
|-------|-------------|
| `event_type` | `training` \| `detection` \| `meeting` \| `friendly` \| `tournament` \| `other` |
| `tournament_id` | Lien tournoi Arena |
| `friendly_match_id` | Lien match amical |
| `invitee_uids` | Liste convoquée |
| `rsvps` | Map `{ uid: pending \| yes \| no \| maybe }` |
| `rsvp_notes` | Map `{ uid: string }` motif d'absence/retard |
| `attendance_marks` | Map `{ uid: present \| late \| excused \| absent }` |
| `player_match_stats` | Map `{ uid: { minutes_played, rating, goals, assists, yellow_cards, red_cards } }` |
| `match_report_finalized_at` | Date de verrouillage du rapport match |
| `max_participants` | Places max (détections) |

**Client :** `src/services/teamEvents.service.ts`

| Méthode | Rôle |
|---------|------|
| `create` / `updateRsvp` | CRUD + convocations |
| `updateRsvpWithReason` | Réponse + motif |
| `markAttendance` | Pointage coach (présence/retard/absence) |
| `saveLineup` | Composition tactique |
| `addLiveAction` | Saisie live |
| `updatePlayerMatchStat` | Feuille joueur (minutes, note, sanctions) |
| `sendReminders` | Relance des `pending` via callable serveur |
| `applyLiveStatsToPlayers` | Buts/passes → `season_stats` joueur |
| `setMatchReportFinalized` | Verrouiller / déverrouiller rapport match |

## `team_payment_requests` (Firestore)

Gestion des cotisations équipe / club.

| Champ | Description |
|-------|-------------|
| `club_id` | Club concerné |
| `label` | Intitulé de cotisation |
| `amount_eur` | Montant en euros |
| `due_at` | Date d'échéance |
| `member_uid` / `member_name` | Membre concerné |
| `status` | `pending` \| `paid` \| `late` |
| `payment_method` | `manual` \| `stripe` (optionnel) |
| `stripe_checkout_session_id` | Session Stripe Checkout |
| `paid_at` | Date de paiement |
| `created_by_uid` | Staff créateur |

**Client :** `src/services/teamFinance.service.ts`

| Méthode | Rôle |
|---------|------|
| `listByClub` | Liste des demandes club |
| `create` | Création cotisation |
| `setStatus` | Passage `pending/paid/late` |
| `startOnlinePayment` | Callable `createPaymentCheckoutSession` → URL Stripe |
| `markOverdueByClub` | Marquage auto des retards |
| `toCsv` | Export CSV de trésorerie |

### Callable `createPaymentCheckoutSession`

- **Entrée :** `{ requestId }` — le membre doit être `member_uid`
- **Sortie :** `{ url, sessionId }` — ouvrir `url` dans le navigateur (Expo WebBrowser)
- **Webhook :** `stripeWebhook` (HTTP) — événement `checkout.session.completed` → `status: paid`, `payment_method: stripe`

**Config Firebase Functions :**

```bash
firebase functions:config:set stripe.secret_key="sk_test_..." stripe.webhook_secret="whsec_..."
```

Dans le dashboard Stripe, ajouter l’endpoint webhook :
`https://<region>-<project>.cloudfunctions.net/stripeWebhook`

## `recruitment_applications` (Firestore)

| Champ | Description |
|-------|-------------|
| `post_id` | Annonce mercato |
| `post_author_uid` | Coach / staff auteur |
| `player_uid`, `player_name` | Candidat |
| `cover_letter` | Message |
| `status` | `PENDING` \| `VIEWED` \| `ACCEPTED` \| `REJECTED` |
| `rejection_reason` | Motif si refus |

**Client :** `src/services/recruitment.service.ts`

| Méthode | Rôle |
|---------|------|
| `applyToPost` | Candidature joueur |
| `updateApplicationStatus` | Callable staff (vue / acceptée / refusée) |
| `listApplicationsForPost` | Liste pour l’auteur ou staff du club |

### Triggers / callables

| Nom | Rôle |
|-----|------|
| `onRecruitmentApplicationCreated` | Push au recruteur |
| `updateApplicationStatus` | Mise à jour + push joueur |

## `club_announcements` (Firestore)

Fil d’actualités club (remplace partiellement WhatsApp).

| Champ | Description |
|-------|-------------|
| `club_id` | Club concerné |
| `author_uid`, `author_name` | Staff auteur |
| `title`, `body` | Contenu |
| `created_at` | Tri desc |

**Client :** `src/services/clubAnnouncements.service.ts`

## `tournaments/{id}/matches` (sous-collection)

| Champ | Description |
|-------|-------------|
| `team_a_name`, `team_b_name` | Équipes |
| `score_a`, `score_b` | Scores |
| `phase` | `poule` \| `elimination` |
| `scheduled_at` | Date/heure |
| `played` | boolean |

**Client :** `tournamentService.listMatches`, `createMatch`, `updateScore`

## Services client (TypeScript)

| Service | Fichier |
|---------|---------|
| Auth + création profil | `src/services/auth.service.ts` |
| Profil & documents | `src/services/profile.service.ts` |
| Tournois & live score | `src/services/tournament.service.ts` |
| Événements & convocations | `src/services/teamEvents.service.ts` |
| Push & géofencing | `src/services/notification.service.ts` |
