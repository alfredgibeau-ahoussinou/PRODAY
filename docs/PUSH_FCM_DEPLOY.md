# Push FCM / Expo — déploiement

Pipeline actuel : token Expo → `users/{uid}.fcm_token` → Cloud Functions (`sendPushToUser`) via Expo Push API ou FCM natif.

## Ce qui est livré dans le code

| Couche | Rôle |
|--------|------|
| Client `registerPushTokenIfPossible` | Permission + `ExponentPushToken[…]` après login (pas Expo Go, pas simulateur) |
| `staff_notifications` + `onStaffNotificationCreated` | Inbox staff + push |
| `push_outbox` + `onPushOutboxCreated` | Push générique (matchday, etc.) |
| `notificationService.sendPush` | Écrit `push_outbox` (plus de stub console) |

## À configurer côté Firebase / Apple / EAS

1. **Firebase Blaze** + déployer les Functions :
   ```bash
   cd functions && npm run build
   firebase deploy --only functions:onStaffNotificationCreated,functions:onPushOutboxCreated,functions:scheduledEventReminders,functions:onTeamEventCreated
   firebase deploy --only firestore:rules
   ```
2. **EAS credentials push** (projet Expo `extra.eas.projectId`) :
   - iOS : clé APNs (Apple Developer → Keys) reliée via `eas credentials`
   - Android : FCM server key / google-services déjà dans le repo
3. **Build device** preview ou production — **pas** Expo Go, **pas** le profil `development` (simulateur).
4. **APNs entitlement** : `app.config.js` force `aps-environment: production` pour les profils EAS `production` / `testflight` ; `development` sinon.
5. Smoke test : se connecter sur device → vérifier `users/{uid}.fcm_token` commence par `ExponentPushToken[` → créer une notif staff ou une ligne `push_outbox` → logs CF sans `[Expo push fail]`.

## Limites honnêtes

- Pas de `GoogleService-Info.plist` → pas de FCM natif iOS ; le chemin **Expo Push + APNs Expo** suffit.
- Sans deploy Functions / sans credentials APNs EAS, l’inbox staff fonctionne mais **aucun push distant**.
- Optionnel : `EXPO_ACCESS_TOKEN` côté Functions pour l’API Expo authentifiée (volume élevé).
