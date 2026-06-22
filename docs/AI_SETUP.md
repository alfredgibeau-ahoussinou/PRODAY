# Configuration IA — Mistral (analyse highlight activité)

L'analyse des séances joueur (`analyzeActivityHighlight`) utilise l'API Mistral (Pixtral pour la vision, Mistral Small pour le texte).

## Clé API

### Production (Firebase Functions config)

```bash
firebase functions:config:set mistral.api_key="VOTRE_CLE_MISTRAL"
```

La fonction lit `functions.config().mistral.api_key` (voir `functions/src/analyzeActivityHighlight.ts`).

### Développement local / émulateur

```bash
export MISTRAL_API_KEY="VOTRE_CLE_MISTRAL"
```

Ou dans `functions/.env` si votre setup local le charge.

## Déploiement

```bash
cd functions && npm run build
firebase deploy --only functions:analyzeActivityHighlight
```

Déployez aussi les règles Storage si vous utilisez les miniatures activité :

```bash
firebase deploy --only storage
```

## Miniatures vidéo (vision MP4)

- Le client génère une frame (`expo-video-thumbnails`) et l'upload dans `player_activity_thumbnails/{uid}/{activityId}.jpg`.
- Sans miniature : poster profil (`gallery_urls` aligné sur `highlight_video_urls`) si disponible.
- **Limite serveur** : pas d'extraction frame côté Cloud Function (pas de ffmpeg). Un MP4 sans `thumbnail_url` ni poster → analyse texte uniquement (tags + notes). Un HEAD HTTP sur l'URL vidéo peut détecter un `Content-Type: image/*` mal typé.

## Notification

À la fin d'une analyse réussie, une push FCM/Expo est envoyée au joueur (`type: player_activity_analysis`). Le tap ouvre l'onglet Profil.

## Vérification

1. Créer une séance match avec highlight vidéo depuis l'app.
2. Vérifier dans Firestore : `thumbnail_url`, puis `analysis_status: analyzed`.
3. Contrôler les logs Functions : `[analyzeActivityHighlight]`.
