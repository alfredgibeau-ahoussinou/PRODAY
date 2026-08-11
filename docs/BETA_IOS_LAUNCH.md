# Bêta iOS — campagne email & lancement TestFlight

Ouverture bêta iOS : **15 août 2026 à 18 h** (Europe/Paris).

> **Report** : initialement annoncée le 11 août 2026, la bêta a été **décalée au 15 août 2026** en raison d'améliorations nécessaires au bon développement de l'application.

## Vue d'ensemble

| Étape | Quand | Action |
|-------|-------|--------|
| Email report date | **Maintenant** | Email « bêta décalée au 15 août 2026 » |
| Annonce date iOS | Après report (+ chaque nouvelle inscription) | Email « bêta iOS le 15 août à 18 h » |
| Mise à jour site | Déploiement site | Bandeau + pages bêta + formulaire waitlist |
| Lancement TestFlight | **15 août 2026 18 h** | Cloud Function horaire + lien TestFlight |
| Email ouverture | **15 août 2026 18 h** | Email avec lien TestFlight à tous les inscrits |
| Engagement | Tous les **2 jours** après lancement | Email astuces / fonctionnalités (12 thèmes) |

## 1. Envoyer l'info report (inscrits existants)

### Option A — Admin site

1. Connexion [proday75.fr/admin/login](https://proday75.fr/admin/login)
2. [proday75.fr/admin/beta](https://proday75.fr/admin/beta)
3. Bouton **« Email report 15 août »**

### Option B — Script CLI

```bash
BETA_WAITLIST_ADMIN_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/websiteBetaWaitlistAdmin \
BETA_WEBSITE_ADMIN_SECRET=… \
node scripts/broadcast-beta-ios-delay-notice.mjs
```

## 2. Annonce date iOS (optionnel / nouvelles inscriptions)

### Option A — Admin site

Bouton **« Annonce date iOS »** sur [proday75.fr/admin/beta](https://proday75.fr/admin/beta).

### Option B — Script CLI

```bash
BETA_WAITLIST_ADMIN_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/websiteBetaWaitlistAdmin \
BETA_WEBSITE_ADMIN_SECRET=… \
node scripts/broadcast-beta-ios-pre-announcement.mjs
```

### Nouvelles inscriptions

Dès qu'une personne s'inscrit via `/beta/inscription`, l'email d'annonce iOS part **automatiquement** (si pas déjà envoyé à cette adresse).

## 3. Configuration avant le 15 août 18 h

### Firebase Functions

```bash
# Lien public TestFlight (obligatoire pour le lancement auto)
firebase functions:config:set beta.testflight_url="https://testflight.apple.com/join/XXXX"
# ou variable d'env BETA_TESTFLIGHT_URL au déploiement
```

### Site (Netlify / env)

| Variable | Rôle |
|----------|------|
| `NEXT_PUBLIC_BETA_TESTFLIGHT_URL` | Lien TestFlight — affiché sur `/beta/installer` **après** le 15 août 2026 à 18 h |

Le bouton TestFlight n'apparaît sur le site qu'**après le 15 août 2026 à 18 h** (même si l'URL est déjà configurée).

## 4. Lancement automatique — 15 août 2026 à 18 h

La Cloud Function `scheduledBetaIosCampaign` (horaire, Europe/Paris) :

1. Si `now >= 15 août 2026 18 h` et lancement pas encore fait :
   - Envoie l'email TestFlight à tous les inscrits non refusés
   - Marque `beta_campaign/state.ios_launch_executed_at`
2. Ensuite, tous les 2 jours : email d'engagement

Checklist manuelle :

- [ ] Déployer functions + site avec les nouvelles dates
- [ ] Envoyer **Email report 15 août** aux inscrits
- [ ] Vérifier `BETA_TESTFLIGHT_URL` / `NEXT_PUBLIC_BETA_TESTFLIGHT_URL`
- [ ] **15 août 18 h** : vérifier logs `[scheduledBetaIosCampaign]` et emails reçus

## Templates email

| Template | Fichier |
|----------|---------|
| Report date | `functions/src/betaIosCampaignEmails.ts` → `buildBetaIosDelayNoticeEmail` |
| Pré-annonce | `buildBetaIosPreAnnouncementEmail` |
| Ouverture | `buildBetaIosLaunchEmail` |
| Engagement | `buildBetaEngagementEmail` |

Paste EmailJS (optionnel) : `docs/emailjs/beta-delay-notice.html`
