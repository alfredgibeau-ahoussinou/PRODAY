# Scripts CLI (`scripts/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — outils Node / shell pour l’app Expo ProDay **1.0.9**.

Invoqués depuis la racine via `npm run …`. **Pas d’import depuis `src/`** : exploitation, seeds, branding, docs PDF, marketing store.

> Ne jamais committer de secrets (`.env`, service accounts, mots de passe). Les scripts de comptes lisent l’environnement local.

## App & simulateur

| Commande | Script | Rôle |
|----------|--------|------|
| `npm start` | (Expo) | Metro |
| `npm run start:ios` | Expo `--localhost` | Appareil / sim en local |
| `npm run ios:sim` | `run-ios-simulator.sh` | Lance le simulateur iOS |
| `eas build --profile …` | `eas.json` | Dev / preview / production / TestFlight |

## Firebase & données

| npm | Fichier | Rôle |
|-----|---------|------|
| `firebase:seed` | `seed-firestore.mjs` | Seed Firestore démo |
| `seed:demo-club` | `seed-demo-club.mjs` | Club démo |
| `seed:demo-player` | `seed-demo-player.mjs` | Joueur démo |
| `seed:demo-parent` | `seed-demo-parent.mjs` | Parent + enfant |
| `seed:demo-supporter` | `seed-demo-supporter.mjs` | Supporter démo |
| `seed:demo-review` | `seed-demo-review.mjs` | Orchestrateur App Review |
| `firebase:health` | `firebase-health.mjs` | Santé projet |
| `firebase:rules:test` | `firestore-rules.test.mjs` | Règles (émulateur) |
| `cleanup:demo` | `cleanup-demo-data.mjs` | Nettoyage démo |
| `migrate:product-lines` | `migrate-product-lines.mjs` | Migration lignes produit |
| `migrate:joueur-pole` | `migrate-joueur-pole.mjs` | Migration pôle joueur |
| `stats:refresh` | `refresh-platform-stats.mjs` | Stats plateforme |
| `test:scale` | `scale-load-test.mjs` | Charge |
| `beta:check` | `beta-readiness.mjs` | Checklist bêta |
| `stripe:subscriptions:check` | `stripe-subscriptions-readiness.mjs` | Checklist Stripe |

## Comptes & auth (env locale)

| npm | Fichier |
|-----|---------|
| `admin:setup` | `setup-admin.mjs` |
| `test-account:setup` | `setup-test-account.mjs` |
| `partner-account:setup` | `setup-partner-test-account.mjs` |
| `auth:send-verification` | `send-verification-email.mjs` |
| `auth:send-password-reset` | `send-password-reset-email.mjs` |

## Branding & store

| npm | Fichier | Rôle |
|-----|---------|------|
| `branding:app` | `generate-app-brand.mjs` | Icône / splash / adaptive depuis lockup officiel |
| `branding:logos` | `generate-transparent-logos.mjs` | Logos transparents |
| `branding:logos:woman` | `generate-woman-logos.mjs` | Variantes femme |
| `branding:logos:universes` | `generate-universe-logos.mjs` | Logos univers |
| `marketing:app-store-ios` | `generate-app-store-screenshots.mjs` | Captures iOS |
| `marketing:app-store-ipad` | idem `--ipad` | iPad |
| `marketing:app-store-mac` | idem `--mac` | Mac |
| `marketing:capture-supporter` | `capture-supporter-screenshot.mjs` | Capture supporter |
| `android:apk:beta` | `build-beta-apk.mjs` | APK bêta |
| `android:apk:publish` | `publish-beta-apk.mjs` | Publication APK |

Lockup source officiel : `assets/branding/proday-lockup-official-source.png`.

## Docs & i18n (liés app)

| npm | Fichier |
|-----|---------|
| `docs:cv` | `generate-player-cv.mjs` |
| `docs:pactes` | `generate-pacte-pdf.mjs` |
| `docs:legal` | `generate-legal-pdf.mjs` |
| `i18n:locales` | `generate-handcraft-locales.mjs` |
| `intro:build` | `build-intro-video.mjs` |

## Liens

- App source : [`../src/README.md`](../src/README.md)
- E2E : [`../e2e/README.md`](../e2e/README.md) · Maestro : [`../.maestro/README.md`](../.maestro/README.md)
- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) · [proday75.fr](https://proday75.fr)
