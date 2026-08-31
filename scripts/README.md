# Scripts CLI (`scripts/`)

Outils Node / shell invoqués via `npm run` à la racine du monorepo. **Pas d’import depuis `src/`** — exploitation, seeds, branding, docs.

App cible : Expo **1.0.8** · tagline **CONNECTER. PROGRESSER. RÉVÉLER.**

> Ne jamais committer de secrets (`.env`, clés service account, mots de passe). Les scripts de comptes lisent l’env locale.

## Firebase & données

| Script | Commande npm | Rôle |
|--------|--------------|------|
| `seed-firestore.mjs` | `firebase:seed` | Données de démo Firestore |
| `seed-demo-club.mjs` | `seed:demo-club` | Club démo (équipes + stade) |
| `seed-demo-player.mjs` | `seed:demo-player` | Joueur démo Lucas (adulte · ASC) |
| `seed-demo-parent.mjs` | `seed:demo-parent` | Parent + enfant U17 dédié |
| `seed-demo-review.mjs` | `seed:demo-review` | Orchestrateur App Review (tous comptes) |
| `firebase-health.mjs` | `firebase:health` · `firebase:deploy:check` | Santé projet |
| `firestore-rules.test.mjs` | `firebase:rules:test` | Tests règles (émulateur) |
| `cleanup-demo-data.mjs` | `cleanup:demo` | Nettoyage démo |
| `migrate-product-lines.mjs` | `migrate:product-lines` | Migration lignes produit |
| `migrate-joueur-pole.mjs` | `migrate:joueur-pole` | Migration pôle joueur |
| `refresh-platform-stats.mjs` | `stats:refresh` | Stats plateforme |
| `scale-load-test.mjs` | `test:scale` | Test charge |
| `beta-readiness.mjs` | `beta:check` | Checklist bêta |
| `stripe-subscriptions-readiness.mjs` | `stripe:subscriptions:check` | Checklist Stripe |

## Comptes test & auth

| Script | Commande npm |
|--------|--------------|
| `setup-admin.mjs` | `admin:setup` |
| `setup-test-account.mjs` | `test-account:setup` |
| `setup-partner-test-account.mjs` | `partner-account:setup` |
| `send-verification-email.mjs` | `auth:send-verification` |
| `send-password-reset-email.mjs` | `auth:send-password-reset` |

## Branding & assets (app)

| Script | Commande npm | Rôle |
|--------|--------------|------|
| `generate-app-brand.mjs` | `branding:app` | Icône / splash / adaptive / lockup officiels |
| `generate-transparent-logos.mjs` | `branding:logos` | Logos transparents |
| `generate-woman-logos.mjs` | `branding:logos:woman` | Variantes Woman |
| `generate-universe-logos.mjs` | `branding:logos:universes` | Pictos pôles |
| `download-*-showcase-images.mjs` | *(manuel)* | Images showcase |
| `generate-app-store-screenshots.mjs` | `marketing:app-store-ios` | Captures App Store iOS 6,5" (1284×2778) |

Guide logos : [../assets/branding/README.md](../assets/branding/README.md).  
Captures store : [../assets/marketing/app-store/ios-6.5/README.md](../assets/marketing/app-store/ios-6.5/README.md).

## Natif & bêta APK

| Script | Commande npm | Rôle |
|--------|--------------|------|
| `run-ios-simulator.sh` | `ios:sim` | Lancer le simulateur iOS |
| `build-beta-apk.mjs` | `android:apk:beta` | Build APK bêta local |
| `publish-beta-apk.mjs` | `android:apk:publish` | Publier APK bêta |
| `broadcast-beta-ios-pre-announcement.mjs` | `beta:broadcast-ios` | Annonce pré-lancement iOS |

Builds store (EAS, pas dans `scripts/` mais via CLI) :

```bash
npm run eas:build:testflight      # iOS build 17+ → TestFlight
npm run eas:build:android:apk
npm run eas:build:production
```

Voir [../docs/STORE_RELEASE.md](../docs/STORE_RELEASE.md) (crash fix build 17, profils `eas.json`).

## Documentation & PDF

| Script | Commande npm |
|--------|--------------|
| `generate-pacte-pdf.mjs` | `docs:pactes` |
| `generate-legal-pdf.mjs` | `docs:legal` |
| `generate-guide-restant-pdf.mjs` | `docs:guide-restant` |
| `generate-player-cv.mjs` | `docs:cv` |
| `build-intro-video.mjs` | `intro:build` |
| `build-website-intro-video.mjs` | `intro:build:website` |

## i18n

| Script | Commande npm |
|--------|--------------|
| `generate-handcraft-locales.mjs` | `i18n:locales` |
| `sync-tertiary-locales.mjs` | *(manuel)* |
| `wire-i18n-files.mjs` | *(manuel)* |

## Sous-dossier `lib/`

Helpers partagés entre scripts (pas destinés à l’app runtime).

## Liens

- [../src/README.md](../src/README.md) — app Expo
- [../docs/STORE_RELEASE.md](../docs/STORE_RELEASE.md) — EAS / TestFlight
- [../package.json](../package.json) — liste complète des commandes npm
- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) · [proday75.fr](https://proday75.fr)
