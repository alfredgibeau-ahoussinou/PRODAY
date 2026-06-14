# ProDay V3 — Déploiement

## Feature flag client

```bash
# .env
EXPO_PUBLIC_V3_SHELL=1
```

Sans cette variable, l’application reste en mode legacy.

## Cloud Function Brain (anti-régression XP)

Fichier : `functions/src/v3Brain.ts` — trigger `onV3BrainWrite` (région `europe-west1`).

```bash
cd functions && npm run build
firebase deploy --only functions:onV3BrainWrite
```

Prérequis : CLI Firebase authentifiée, projet `EXPO_PUBLIC_FIREBASE_PROJECT_ID` configuré.

## Règles Firestore

Le snapshot Brain est stocké sous `users/{userId}/v3_brain/state` (lecture/écriture propriétaire). Déployer si modifié :

```bash
firebase deploy --only firestore:rules
```

## Build natif (calendrier device)

La sync `expo-calendar` nécessite un **development build** ou build store — pas Expo Go pur :

```bash
npx expo prebuild
npx expo run:ios   # ou run:android
```

## Checklist release

1. `npm test` + `npx tsc --noEmit`
2. Déployer `onV3BrainWrite`
3. Vérifier `.env.example` contient `EXPO_PUBLIC_V3_SHELL=1`
4. QA manuel (`PRODAY_V3_QA.md`)
5. Activer le flag en production progressivement (bêta → 100 %)
