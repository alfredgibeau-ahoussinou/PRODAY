# Lancement bêta fermée — ProDay

> **Guide opérateur complet :** `docs/BETA_GUIDE.md` (architecture, URLs, variables env).
>
> **Bêta iOS :** ouverture **15 août 2026 à 18 h** (TestFlight) — reportée depuis le 11 août — voir [`docs/BETA_IOS_LAUNCH.md`](./BETA_IOS_LAUNCH.md).

Checklist pour distribuer l'app aux testeurs inscrits sur la waitlist (50–200 personnes).

## 1. Contrôle automatique

```bash
npm run beta:check
```

Vérifie : Firebase `.env`, typecheck, Jest, règles Firestore, pages légales, API bêta site.

## 2. Site vitrine

| URL | Usage |
|-----|--------|
| https://proday75.fr/beta/inscription | Inscription waitlist (public) |
| https://proday75.fr/beta | Hub bêta (invitation email uniquement) |
| https://proday75.fr/beta/programme | Programme — sept pôles (protégé) |
| https://proday75.fr/beta/installer | Guides APK / TestFlight (protégé) |
| https://proday75.fr/beta/aide | FAQ et support bêta (protégé) |
| https://proday75.fr/confidentialite | Politique de confidentialité (stores) |
| https://proday75.fr/cgu | CGU (stores) |
| https://proday75.fr/partenaires/convention | Convention sponsor (modèle) |
| `/legal/*.pdf` | PDF téléchargeables (générés via `npm run docs:legal`) |

Déploiement site : `cd website && npm run netlify:deploy`

## 3. Build mobile (TestFlight + APK interne)

Version app courante : **1.0.8** (iOS build EAS suivant **17**, Android `versionCode` **10**).
Pas d’OTA (`expo-updates` non installé) — chaque MAJ = rebuild EAS natif.

```bash
# iOS → App Store Connect / TestFlight (profil store, pas preview)
npm run eas:build:testflight
# après succès :
npm run eas:submit:testflight

# Android APK testeurs (distribution interne)
# Prérequis : aligner le versionCode distant (≥ 9, car APK local 1.0.7 = 8)
#   eas build:version:set -p android --profile preview
#   → saisir 9 (autoIncrement → 10)
npm run eas:build:preview -- --platform android
```

Les profils `production` / `testflight` / `preview` forcent `EXPO_PUBLIC_V3_SHELL=1` (UI V3).
Le profil `preview` a aussi `autoIncrement: true` (incrémente le versionCode EAS distant à chaque build).

> Le profil `preview` iOS est **adhoc interne**, pas TestFlight. Pour TestFlight utiliser `testflight` (voir `docs/STORE_RELEASE.md`).

Après build iOS : App Store Connect → TestFlight → ajouter testeurs (emails waitlist).

Après build Android : partager l'APK ou piste interne Play Console.

## 4. Firebase (recommandé)

```bash
firebase deploy --only firestore:rules,storage
firebase deploy --only functions:onV3BrainWrite,functions:submitBetaWaitlist,functions:scheduledBetaIosCampaign,functions:websiteBetaWaitlistAdmin
```

Campagne iOS (annonce + lancement auto + engagement) : [`BETA_IOS_LAUNCH.md`](./BETA_IOS_LAUNCH.md).

`activateStoreSubscription` : optionnel en bêta (accès Pro manuel Firestore).

## 5. Compte démo Apple

Préparer pour la revue App Store :

- Email : compte test dédié
- Mot de passe : documenté dans App Store Connect → Notes de revue

## 6. Accès Pro bêta-testeurs

Sans IAP actif :

**A — Demande in-app (recommandé bêta)** : Abonnement → « Demander l’accès Pro (bêta) ».
Admin FOC → Abonnements → **Demandes bêta** → Approuver (essai 1 mois).

**B — Console Firestore** (rapide) :

```
users/{uid}.subscription_tier = "pro"
users/{uid}.subscription_status = "active"
```

Optionnel : `subscription_plan_id` (ex. `player_plus`, `coach_pro`) et
`subscription_period_end` (date future) pour coller au contrôle
`isSubscriptionAccessActive`.

**C — Admin app FOC** → Abonnements : `grantProSubscription` / passage payant
(écrit les mêmes champs + journal d’achat).

Voir `docs/PRICING_STRATEGY.md` § Phase déploiement.

## 7. Canal retours

- Email : proday.admin@gmail.com
- Collecter bugs via messages in-app ou formulaire externe

## 8. Go / no-go

- [ ] `npm run beta:check` vert
- [ ] Build preview iOS + Android réussi
- [ ] URLs légales accessibles (200)
- [ ] Email bêta fonctionne (`POST /api/beta` → `emailSent: true`)
- [ ] Testeurs invités (TestFlight / APK)
- [ ] Compte admin opérationnel
