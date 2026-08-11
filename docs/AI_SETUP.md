# Configuration IA — Mistral

ProDay utilise **Mistral Medium 3.5** (`mistral-medium-3-5`, avril 2026) pour :

1. Analyse highlight activité joueur (`analyzeActivityHighlight`) — vision
2. Vérification documents onboarding (`mistralVerification`) — vision
3. **Copilote Club** — chat live (`clubAssistantChat`) + `reasoning_effort: high`

Texte rapide (tags) : `mistral-small-latest` (Small 4, mars 2026).

Modèles : `functions/src/mistralModels.ts`.

## Clé API

### Production

```bash
firebase functions:config:set mistral.api_key="VOTRE_CLE_MISTRAL"
```

Ou variable Gen2 : `MISTRAL_API_KEY` (voir `functions/src/runtimeConfig.ts`).

### Développement local / émulateur

```bash
export MISTRAL_API_KEY="VOTRE_CLE_MISTRAL"
```

Ou `functions/.env` si votre setup le charge.

## Déploiement

```bash
cd functions && npm run build
firebase deploy --only functions:analyzeActivityHighlight,functions:clubAssistantChat
```

## Copilote Club (`clubAssistantChat`)

- Callable `europe-west1`, Auth **rôle club**.
- Dialogue libre (historique court) + contexte roster chargé serveur.
- UI : `ClubAssistantPane` → `ClubLiveChat` (réponses générées, pas FAQ).
- FAQ dossiers : lien secondaire via `PoleHelpChatbot`.

## Miniatures vidéo (vision MP4)

- Le client génère une frame (`expo-video-thumbnails`) et l'upload dans `player_activity_thumbnails/{uid}/{activityId}.jpg`.
- Sans miniature : poster profil (`gallery_urls` aligné sur `highlight_video_urls`) si disponible.
- **Limite serveur** : pas d'extraction frame côté Cloud Function (pas de ffmpeg). Un MP4 sans `thumbnail_url` ni poster → analyse texte uniquement (tags + notes).

## Notification (highlights)

À la fin d'une analyse réussie, une push FCM/Expo est envoyée au joueur (`type: player_activity_analysis`).

## Vérification highlight

1. Créer une séance match avec highlight vidéo depuis l'app.
2. Vérifier Firestore : `thumbnail_url`, puis `analysis_status: analyzed`.
3. Logs Functions : `[analyzeActivityHighlight]`.
