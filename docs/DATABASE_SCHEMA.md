# Schéma Firestore — ProDay

## Collections principales

| Collection | Description |
|------------|-------------|
| `users` | Profils multi-rôles + vérification + contrôle parental |
| `users/{uid}/documents` | Diplômes, licences agent |
| `clubs` | Clubs et géolocalisation |
| `tournaments` | Tournois, poules, awards |
| `friendly_matches` | Matchs amicaux |
| `team_events` | Convocations, entraînements, live stats, rapports match |
| `team_payment_requests` | Cotisations et trésorerie club |
| `club_announcements` | Fil d'actualités club (SportEasy-like) |
| `sponsor_offers` | Marketplace sponsors |
| `recruitment_posts` | Mur Mercato |
| `recruitment_applications` | Candidatures joueurs |
| `message_threads` / `messages` | Messagerie |
| `platform_stats` | Compteurs publics (Discover) |

## Champs critiques — `users/{uid}`

| Champ | Type | Défaut | Notes |
|-------|------|--------|-------|
| `role` | string | — | `player`, `coach`, `agent`, `organizer`, `sponsor` |
| `email_verified` | boolean | `false` | Synchro Firebase Auth (comptes email/mot de passe) |
| `is_verified` | boolean | `false` | `true` seulement après validation admin (coach/agent) |
| `verification_status` | string | `PENDING` ou `NOT_REQUIRED` | `PENDING`, `VERIFIED`, `REJECTED` |
| `parental_settings` | map | — | Contrôle parental (comptes mineurs) |
| `location` | GeoPoint | — | Géofencing agents (50 km) |
| `notification_radius_km` | number | `50` | Rayon alertes agent |
| `profile.club_id` | string | — | Lien club pour gestion équipe / cotisations |

### `parental_settings` (mineurs)

| Champ | Type | Notes |
|-------|------|-------|
| `is_minor` | boolean | Compte enregistré &lt; 18 ans |
| `guardian_name` | string | Nom tuteur |
| `guardian_email` | string | Email tuteur |
| `guardian_consent` | boolean | Consentement inscription |
| `supervision_enabled` | boolean | Supervision active |
| `contacts_filter_enabled` | boolean | Filtre contacts messagerie |
| `screen_time_enabled` | boolean | Limite temps d'écran |
| `daily_limit_minutes` | number | Quota journalier |
| `active_days` | string[] | Jours autorisés |
| `approved_contacts` | array | Contacts approuvés |

## `team_events/{eventId}`

| Champ | Type | Notes |
|-------|------|-------|
| `event_type` | string | `training`, `detection`, `meeting`, `friendly`, `tournament`, `other` |
| `tournament_id` | string | Lien tournoi Arena (convocation auto) |
| `friendly_match_id` | string | Lien match amical (évite doublons convocation) |
| `club_id` | string | Club organisateur |
| `organizer_uid` | string | Créateur |
| `starts_at` | timestamp | Date/heure |
| `invitee_uids` | string[] | Convoqués |
| `rsvps` | map | `{ uid: pending \| yes \| no \| maybe }` |
| `rsvp_notes` | map | Motif absence/retard par uid |
| `attendance_marks` | map | `{ uid: present \| late \| excused \| absent }` |
| `lineup` | map | Composition tactique |
| `live_actions` | array | Actions live (buts, passes, cartons) |
| `player_match_stats` | map | Feuille individuelle (minutes, note, buts…) |
| `match_report_finalized_at` | timestamp | Verrouillage rapport |
| `stats_applied_at` | timestamp | Stats saison appliquées |

## `team_payment_requests/{requestId}`

| Champ | Type | Notes |
|-------|------|-------|
| `club_id` | string | Club |
| `label` | string | Intitulé cotisation |
| `amount_eur` | number | Montant € |
| `due_at` | timestamp | Échéance |
| `member_uid` | string | Membre concerné |
| `member_name` | string | Nom affiché |
| `status` | string | `pending`, `paid`, `late` |
| `paid_at` | timestamp | Date paiement |
| `created_by_uid` | string | Staff créateur |

## `club_announcements/{announcementId}`

| Champ | Type | Notes |
|-------|------|-------|
| `club_id` | string | Club concerné |
| `author_uid` | string | Staff auteur |
| `author_name` | string | Nom affiché |
| `title` | string | Titre |
| `body` | string | Contenu |
| `created_at` | timestamp | Tri desc |

## `tournaments/{tournamentId}/matches/{matchId}`

| Champ | Type | Notes |
|-------|------|-------|
| `team_a_name`, `team_b_name` | string | Équipes |
| `score_a`, `score_b` | number | Scores |
| `phase` | string | `poule` \| `elimination` |
| `scheduled_at` | timestamp | Date/heure |
| `played` | boolean | Match joué |

## Workflow validation (coach / agent)

1. `createProfile` → `is_verified: false`, `verification_status: PENDING`
2. Upload document → sous-collection `documents`
3. Admin `validateProfile` callable → `VERIFIED` ou `REJECTED`
4. Firestore rules : l'utilisateur ne peut pas modifier `is_verified` lui-même

## Workflow email (tous rôles email/mot de passe)

1. Inscription → `sendEmailVerification`
2. App bloquée tant que `emailVerified === false`
3. Synchro Firestore `email_verified` après `reload` Auth

Voir `firebase/firestore.rules`, `docs/API_CONTRACTS.md`, `docs/FIRESTORE_DEPLOY.md`.
