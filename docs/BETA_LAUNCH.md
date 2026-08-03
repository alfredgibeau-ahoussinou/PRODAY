# Lancement bêta fermée — ProDay

> **Guide opérateur complet :** `docs/BETA_GUIDE.md` (architecture, URLs, variables env).
>
> **Bêta iOS :** ouverture **11 août 2026 à 18 h** (TestFlight) — voir [`docs/BETA_IOS_LAUNCH.md`](./BETA_IOS_LAUNCH.md).

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

```bash
# iOS TestFlight (distribution interne)
eas build --profile preview --platform ios

# Android APK testeurs
npm run eas:build:preview -- --platform android
```

Le profil `preview` active `EXPO_PUBLIC_V3_SHELL=1` (UI V3).

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

Sans IAP actif, activer manuellement dans Firestore :

```
users/{uid}.subscription_tier = "pro"
users/{uid}.subscription_status = "active"
```

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
