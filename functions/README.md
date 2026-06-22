# Cloud Functions — notes d'exploitation

## Push géo sponsors (`sponsorGeoPush.ts`)

### Triggers Firestore Gen2 (`europe-west1`)

Alignés sur Firestore **eur3** (région Functions `europe-west1`) :

- **`onSponsorOfferCreated`** — nouvelle offre active (`firebase-functions/v2/firestore`)
- **`onSponsorOfferUpdated`** — réactivation (`active: false → true`)

### Callable

- **`notifySponsorOfferInCityCallable`** — Gen2 `onCall`, région `europe-west1`
- Auth : propriétaire sponsor de l'offre ou admin
- Paramètres : `{ offerId: string, force?: boolean }`

Le client appelle ce callable après création d'offre (`sponsors.service.ts`). Les triggers Gen2 servent de filet automatique.

### Déploiement Gen2 (après suppression Gen1)

Firebase **ne permet pas** de mettre à jour une fonction Gen1 existante vers Gen2 sous le même nom. Procédure :

```bash
# 1. Supprimer les anciennes fonctions Gen1 (europe-west1)
firebase functions:delete onSponsorOfferCreated onSponsorOfferUpdated notifySponsorOfferInCityCallable --region europe-west1 --force

# 2. Rebuild + déployer Gen2
cd functions && npm run build
firebase deploy --only functions:onSponsorOfferCreated,functions:onSponsorOfferUpdated,functions:notifySponsorOfferInCityCallable
```

**État au 2026-06-19** : le build TypeScript passe ; le déploiement direct a échoué avec  
`Upgrading from 1st Gen to 2nd Gen is not yet supported` — exécuter l’étape 1 ci-dessus puis redéployer.

Variables : plan Blaze, `firebase use` sur le bon projet.

---

## IAP — `activateStoreSubscription`

Voir [`docs/STORE_SETUP.md`](../docs/STORE_SETUP.md) pour la création des 16 SKU store.

```bash
firebase deploy --only functions:activateStoreSubscription
```

---

## Activation Territorial (admin)

Lors de l'approbation d'une demande `sponsor_upgrade_requests` (admin), le client met à jour :

- la demande → `status: approved`
- `users/{sponsor_uid}` → `sponsor_tier: 'territorial'`, `sponsor_territorial_approved_at`

Les règles Firestore empêchent l'auto-modification de `sponsor_tier` par le sponsor ; seul un admin (ou le serveur) peut écrire ces champs.

Déployer les règles après modification :

```bash
firebase deploy --only firestore:rules
```

---

## Sync team_events → player_activities (`teamEventActivitySync.ts`)

Quand le staff met à jour la présence, la compo ou les stats d'un `team_event`, le serveur crée ou met à jour les documents `player_activities` des joueurs concernés (déduplication par `player_uid` + `team_event_id`).

### Trigger Firestore Gen2 (`europe-west1`)

- **`onTeamEventUpdated`** — écoute `team_events/{eventId}` (champs présence, compo, stats, RSVP, live)

### Callable (filet de secours)

- **`syncTeamEventActivities`** — Gen2 `onCall`, région `europe-west1`
- Auth : organisateur de l'événement, staff club (`coach`, `agent`, `organizer`) ou admin
- Paramètres : `{ eventId: string }`
- Le client appelle ce callable après `markAttendance` / `saveLineup` (`teamEvents.service.ts`) si le trigger n'est pas déployé.

```bash
cd functions && npm run build
firebase deploy --only functions:onTeamEventUpdated,functions:syncTeamEventActivities
```

**Note** : comme pour les triggers sponsor, un passage Gen1 → Gen2 peut exiger la suppression de l'ancienne fonction avant redéploiement.

---

## Analyse highlight activité (`analyzeActivityHighlight.ts`)

- **`analyzeActivityHighlight`** — Gen2 `onCall`, région `europe-west1`
- Auth : propriétaire de l'activité ou admin
- Image / data URL → Mistral Pixtral (vision)
- MP4 → `thumbnail_url` (client Storage) ou poster profil (`gallery_urls`) si dispo ; HEAD HTTP si `Content-Type: image/*` ; sinon Mistral texte sur tags + notes (**pas d'extraction frame serveur**)
- Sans vidéo → Mistral texte sur données séance
- Push FCM/Expo à la fin : « Analyse de votre séance prête » (`type: player_activity_analysis`)
- Champs écrits : `analysis_status`, `analysis_summary_fr`, `analysis_strengths`, `analysis_improvements`, `analyzed_at`
- Sans clé Mistral : `analysis_status: failed`, message « Analyse IA indisponible »

**Configuration clé Mistral** : voir `docs/AI_SETUP.md`

```bash
firebase functions:config:set mistral.api_key="VOTRE_CLE"
cd functions && npm run build
firebase deploy --only functions:analyzeActivityHighlight
```

---

## Migration Gen1 → Gen2 (historique)

Les triggers sponsor geo étaient en Gen1 (`functions.region('europe-west1').firestore`). Ils sont passés en **Gen2** pour compatibilité eur3 et déploiement fiable. Les autres fonctions du projet restent en Gen1 pour l'instant.
