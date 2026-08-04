# Évolution stratégique des pôles — fondations

**Branche :** `feature/ecosystem-poles-evolution`  
**Date :** août 2026

## Vision

ProDay = écosystème foot complet : joueurs, clubs, agents, staff, académies, organisateurs d’événements — **amateur → pro sans changer d’environnement**.

## Livré (fondations)

### 1. Pôle Joueur unifié
- Fusion marketing / carousel : Amateur + Pro Joueur → **Pôle Joueur**
- Badges : Amateur (bleu), Centre de formation / Aspirant (vert), Professionnel (jaune)
- Filtres recruteur : `all` | `amateurs` | `professionnels` | `centres_de_formation`
- Signature pro : `promotePlayerToProfessional()` — même profil, badge seul
- Routes site : `/joueur` ; `/amateur` et `/pro-joueur` redirigent

### 2. Pôle Club
- Calendrier structure → **Pôle Staff** (copy + `canEditStructureCalendar`)
- Club free : **plus de convocations** (`clubFreeTierIncludesConvocations() === false`)
- Convocations = feature Staff premium (`canManageConvocations`)

### 3. Pipeline candidatures club
- Étapes kanban : inbox → reviewing → shortlist → trial → offer → hired (+ rejected / withdrawn)
- Mapping compat legacy `PENDING` / `VIEWED` / …

### 4. Agent — offre lancement
- **19,99 €/mois** pour les 20 premiers (`AGENT_LAUNCH_OFFER`)
- Puis **29,99 €/mois** (plan `agent_elite` mis à jour ; ancien 99,99 € retiré)
- Grandfather via `user.agent_launch_offer`

### 5. Joueur vérifié
- Licence (`player_verification.club_license`) **OU** `club_certification_verified`
- Badge `JOUEUR_VERIFIE_BADGE`

### 6. Confidentialité contacts
- `contact_privacy` sur `User` ; audiences par champ (phone / email / other)

### 7. Demandes de message (style Instagram)
- Joueur ↔ agent → `pending` jusqu’à accept / refuse
- Conversation active seulement si `accepted`

### 8. Pôle Événements (scaffolding)
- Carousel + page `/evenements` + modèle `OrganizerEvent` / `EventRegistration`
- **Paiements tournoi Arena :** Checkout Stripe plateforme (`createTournamentCheckoutSession`) — pas Connect / pas IAP
- Listes live / résultats / médias natifs : suite produit

## Fichiers clés

| Zone | Fichiers |
|------|----------|
| Badges / filtres | `src/models/PlayerLevel.ts`, `src/utils/playerLevelBadge.ts` |
| Pricing agent | `src/utils/agentLaunchPricing.ts`, `src/content/subscriptionPlans.ts` |
| Privacy | `src/models/ContactPrivacy.ts`, `src/utils/contactPrivacyVisibility.ts` |
| Messaging | `src/models/MessageRequest.ts`, `src/utils/messageRequestState.ts` |
| Pipeline | `src/models/ClubApplicationPipeline.ts`, `src/utils/clubApplicationPipeline.ts` |
| Events | `src/models/EventOrganizer.ts` |
| Carousel app | `src/models/CarouselPole.ts` |
| Site | `website/src/lib/poles.ts`, `routes.ts`, `/joueur`, `/evenements` |
| Tests | `src/__tests__/ecosystemPolesEvolution.test.ts` |

## Suivi produit (suite)

### Livré (follow-up)
1. UI app : pills badges, filtres badge recruteur (annuaire), privacy + badge settings profil, inbox demandes message
2. Firestore rules + indexes : `message_requests`, `request_status` sur threads, `player_level`
3. Compteur seats agent : callable `claimAgentLaunchSeat` + hook `activateStoreSubscription` (`platform_config/agent_launch`)
4. Migration : `npm run migrate:joueur-pole -- --dry-run` puis `--confirm`
5. Événements : helpers listes/résultats (`eventOrganizerScaffold`) + Checkout inscription tournoi (`createTournamentCheckoutSession`)

### Restant
- Paiements / UI organisateur native : branche `feature/pole-evenements` (PR #18) — hors scope « prévoir futur » (scaffolding main suffit)
- Déployer rules/indexes/functions (`firebase deploy --only firestore,functions`) si pas déjà fait
- Affiner `canResolveRequests` (vérifier recipient_uid vs requester_uid côté UI)

### Correctifs checklist (post-merge #17)
- Gates UI convocations branchées sur `userCanManageConvocations` (Matchs, Gestion équipe, Création événement, Détections)
- `canManageTeamEvent` : rôle `club` exclu de la gestion (Staff uniquement)
- Pipeline candidatures : `pipeline_stage` à la création + labels kanban dans `ApplicationReviewCard`
- Docs store agent : 29,99 € (lancement 19,99 €)
