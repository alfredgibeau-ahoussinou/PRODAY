# Visio Daily.co — téléconsultation Santé

Daily.co est le **fournisseur principal** de la téléconsultation in-app (Call Object :
caméra, micro, partage d’écran, chat, fin d’appel). Cal Video reste un secours si
`DAILY_API_KEY` est absente.

## Configuration

```bash
# Secrets (ou functions/.env)
# DAILY_API_KEY=...
# VISIO_DAILY_DOMAIN=proday

firebase functions:config:set visio.daily_api_key="VOTRE_CLE_DAILY"
firebase functions:config:set visio.daily_domain="proday"
firebase deploy --only functions:getVisioJoinUrl,functions:onMedicalAppointmentCreated,functions:onMedicalAppointmentUpdated
```

## Flux

1. RDV visio créé → Cloud Function crée une salle **privée** `proday-rdv-{appointmentId}`
2. Participant (praticien / joueur) → `getVisioJoinUrl` (auth + flag `sante_visio`)
3. Token meeting Daily (owner = praticien) → app rejoint via Call Object
4. Contrôles : mute cam/mic, screenshare, chat `app-message`, hangup

## App native

Visio native Daily retirée du client Expo (bêta). Les salles Daily restent côté Cloud Functions
(`functions/src/dailyVisio.ts`) pour les liens de rendez-vous ; plus de plugin
`@daily-co/config-plugin-rn-daily-js` dans `app.json`.

Rebuild natif requis (`eas build` / `npx expo prebuild`) — pas compatible Expo Go.

## Flag

Admin → Système → `sante_visio` = ON pour autoriser le join.

Sans clé Daily, seul Cal Video est tenté (navigateur / iframe).
