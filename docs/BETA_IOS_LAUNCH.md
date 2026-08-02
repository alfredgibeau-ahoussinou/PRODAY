# Bêta iOS — campagne email & lancement TestFlight

Ouverture bêta iOS : **11 août 2026 à 18 h** (Europe/Paris).

## Vue d'ensemble

| Étape | Quand | Action |
|-------|-------|--------|
| Annonce date iOS | **Aujourd'hui** (+ chaque nouvelle inscription) | Email « bêta iOS le 11 août à 18 h » |
| Mise à jour site | Déploiement site | Bandeau + pages bêta + formulaire waitlist |
| Lancement TestFlight | **11 août 2026 18 h** | Cloud Function horaire + lien TestFlight |
| Email ouverture | **11 août 2026 18 h** | Email avec lien TestFlight à tous les inscrits |
| Engagement | Tous les **2 jours** après lancement | Email astuces / fonctionnalités (12 thèmes) |

## 1. Envoyer l'annonce aujourd'hui (inscrits existants)

### Option A — Admin site

1. Connexion [proday75.fr/admin/login](https://proday75.fr/admin/login)
2. [proday75.fr/admin/beta](https://proday75.fr/admin/beta)
3. Bouton **« Annonce date iOS »**

### Option B — Script CLI

```bash
BETA_WAITLIST_ADMIN_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/websiteBetaWaitlistAdmin \
BETA_WEBSITE_ADMIN_SECRET=… \
node scripts/broadcast-beta-ios-pre-announcement.mjs
```

### Nouvelles inscriptions

Dès qu'une personne s'inscrit via `/beta/inscription`, l'email d'annonce iOS part **automatiquement** (si pas déjà envoyé à cette adresse).

## 2. Configuration avant le 11 août 18 h

### Firebase Functions

```bash
# Lien public TestFlight (obligatoire pour le lancement auto)
firebase functions:config:set beta.testflight_url="https://testflight.apple.com/join/XXXXX"

# Site URL (si pas déjà défini)
firebase functions:config:set beta.site_url="https://proday75.fr"

# Email Brevo ou EmailJS (voir docs/BETA_WAITLIST.md)
```

Déployer :

```bash
firebase deploy --only functions:scheduledBetaIosCampaign,functions:websiteBetaWaitlistAdmin,functions:submitBetaWaitlist
```

### Site Netlify

```env
NEXT_PUBLIC_BETA_TESTFLIGHT_URL=https://testflight.apple.com/join/XXXXX
```

Le bouton TestFlight n'apparaît sur le site qu'**après le 11 août 2026 à 18 h** (même si l'URL est déjà configurée).

### Build iOS TestFlight

```bash
npm run eas:build:preview   # ou workflow EAS preview iOS
# Soumettre à TestFlight App Store Connect
```

## 3. Lancement automatique — 11 août 2026 à 18 h

La Cloud Function `scheduledBetaIosCampaign` s'exécute **toutes les heures** (Europe/Paris) :

1. Si `now >= 11 août 2026 18 h` et lancement pas encore fait :
   - Envoie l'email « bêta iOS ouverte » avec lien TestFlight à tous les inscrits (hors refusés)
   - Marque `beta_campaign/state.ios_launch_executed_at` dans Firestore
2. Après lancement : envoie un email d'engagement **tous les 2 jours** (Pulse, Mercato, Matchs…)

### Lancement manuel (test ou secours)

Admin site → **« Ouvrir bêta iOS »** ou :

```bash
curl -X POST "$BETA_WAITLIST_ADMIN_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $BETA_WEBSITE_ADMIN_SECRET" \
  -d '{"action":"trigger_ios_launch"}'
```

## 4. Emails d'engagement (tous les 2 jours)

12 thèmes en rotation : Pulse, Mercato, Matchs, Live Stats, Arena, Fil/Reels, Covoiturage, Santé, Journal IA, Navigation, Retours, Mises à jour.

Envoi manuel : admin → **« Email engagement »**

## 5. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `functions/src/betaIosCampaign*.ts` | Templates, envoi, planification |
| `functions/src/betaWaitlist.ts` | Email annonce à l'inscription |
| `website/src/lib/betaIosLaunch.ts` | Date + visibilité TestFlight site |
| `website/src/components/beta/BetaIosLaunchBanner.tsx` | Bandeau pages bêta |
| `scripts/broadcast-beta-ios-pre-announcement.mjs` | Broadcast CLI |

## 6. Checklist opérateur

- [ ] Brevo / EmailJS configuré et testé
- [ ] **Aujourd'hui** : bouton « Annonce date iOS » ou script broadcast
- [ ] `beta.testflight_url` + `NEXT_PUBLIC_BETA_TESTFLIGHT_URL` renseignés
- [ ] Build iOS sur TestFlight validée Apple
- [ ] Functions déployées (`scheduledBetaIosCampaign`)
- [ ] Site déployé (bandeau + contenu bêta)
- [ ] **11 août 18 h** : vérifier logs `[scheduledBetaIosCampaign]` et emails reçus

---

Voir aussi [BETA_WAITLIST.md](./BETA_WAITLIST.md) · [BETA_LAUNCH.md](./BETA_LAUNCH.md)
