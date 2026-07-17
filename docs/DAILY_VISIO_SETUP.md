# Visio Daily.co — secours

> **Flux principal :** voir [CAL_VISIO_SETUP.md](./CAL_VISIO_SETUP.md) (Cal Video via Cal.com).

Daily.co n'est utilisé que si la création du booking Cal.com échoue ou si `cal.api_key` n'est pas configuré.

## Configuration secours

```bash
firebase functions:config:set visio.daily_api_key="VOTRE_CLE_DAILY"
firebase functions:config:set visio.daily_domain="proday"
firebase deploy --only functions:getVisioJoinUrl,functions:onMedicalAppointmentUpdated
```

Sans clé Daily, seul Cal.com est tenté.
