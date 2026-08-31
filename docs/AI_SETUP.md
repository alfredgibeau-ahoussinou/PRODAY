# Configuration IA — Mistral

ProDay utilise **Mistral Medium 3.5** (`mistral-medium-3-5`, avril 2026) pour :

1. Analyse highlight activité joueur (`analyzeActivityHighlight`) — vision
2. Vérification documents onboarding (`mistralVerification`) — vision
3. **Copilote Club** — chat live (`clubAssistantChat`) + `reasoning_effort: high`
4. Coach IA joueur (`playerCoachAiChat`) + tactique (`playerTacticsChat`)
5. Assistant Président (`presidentAssistantChat`)
6. ProDay AI multi-agents (`prodayAiChat`)
7. Smart Tactics prep match (`smartTacticsMatchPrep`) — fallback **local labellisé** si cloud KO
8. Génération séances (`generateTrainingSession`, `generateHomeTraining`)

Texte rapide (tags) : `mistral-small-latest` (Small 4, mars 2026).

Modèles : `functions/src/mistralModels.ts`.

Dépôt code : [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · Doc publique : [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs).

## Clé API (obligatoire pour le cloud)

Sans `MISTRAL_API_KEY`, les callables renvoient `failed-precondition` avec un message clair.
L’app **ne doit pas** afficher un mock comme une réussite cloud (voir `src/utils/aiUxHonesty.ts`).

### Production

```bash
firebase functions:config:set mistral.api_key="VOTRE_CLE_MISTRAL"
```

Ou variable Gen2 : `MISTRAL_API_KEY` (voir `functions/src/runtimeConfig.ts` + `functions/.env.example`).

### Développement local / émulateur

```bash
export MISTRAL_API_KEY="VOTRE_CLE_MISTRAL"
```

Ou `functions/.env` si votre setup le charge.

## Déploiement

```bash
cd functions && npm run build
firebase deploy --only functions:analyzeActivityHighlight,functions:clubAssistantChat,functions:playerCoachAiChat,functions:playerTacticsChat,functions:presidentAssistantChat,functions:prodayAiChat,functions:smartTacticsMatchPrep,functions:generateTrainingSession,functions:generateHomeTraining
```

(Adaptez la liste selon les exports réellement utilisés dans `functions/src/index.ts`.)

## Surfaces app (honnêteté UX)

| Surface | Cloud | Sinon |
|---|---|---|
| Copilote Club | `clubAssistantChat` | Erreur + guide local **labellisé** |
| Coach IA joueur | `playerCoachAiChat` | Erreur visible |
| FAB ProDay AI | `prodayAiChat` | Erreur visible |
| Tactique IA (XI) | `smartTacticsMatchPrep` | Moteur local, alerte « Mode local » |
| Hub Coach IA | Heuristiques locales | Footnote explicite |
| Admin AI | Règles locales | Sous-titre explicite |
| Guide parent | Tips locaux | Étiquette `guide_suggestion` |

## Copilote Club (`clubAssistantChat`)

- Callable `europe-west1`, Auth **rôle club**.
- Dialogue libre (historique court) + contexte roster chargé serveur.
- UI : `ClubAiAssistant` (réponses générées, pas FAQ).
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
