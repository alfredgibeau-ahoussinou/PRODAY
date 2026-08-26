# Scripts CLI (`scripts/`)

> Scripts Node invoqués via `npm run` à la racine. Pas d'import depuis `src/` — outils d'exploitation et génération.

## Catégories

### Firebase & données

| Script | Commande npm | Rôle |
|--------|--------------|------|
| `seed-firestore.mjs` | `firebase:seed` | Données de démo Firestore |
| `seed-demo-club.mjs` | `seed:demo-club` | Club démo complet (équipes + stade) |
| `seed-demo-player.mjs` | `seed:demo-player` | Compte joueur démo Lucas (Pro Day Joueur) |
| `seed-demo-parent.mjs` | `seed:demo-parent` | Parent démo lié à Lucas (Pôle Parent) |
| `firebase-health.mjs` | `firebase:health` · `firebase:deploy:check` | Santé projet |
| `firestore-rules.test.mjs` | `firebase:rules:test` | Tests règles (émulateur) |
| `cleanup-demo-data.mjs` | `cleanup:demo` | Nettoyage données démo |
| `migrate-product-lines.mjs` | `migrate:product-lines` | Migration lignes produit |
| `refresh-platform-stats.mjs` | `stats:refresh` | Stats plateforme |
| `scale-load-test.mjs` | `test:scale` | Test charge |
| `beta-readiness.mjs` | `beta:check` | Checklist bêta |

### Comptes test

| Script | Commande npm |
|--------|--------------|
| `setup-admin.mjs` | `admin:setup` |
| `setup-test-account.mjs` | `test-account:setup` |
| `setup-partner-test-account.mjs` | `partner-account:setup` |

### Documentation & PDF

| Script | Commande npm |
|--------|--------------|
| `generate-pacte-pdf.mjs` (+ `pacte-*.mjs`) | `docs:pactes` |
| `generate-legal-pdf.mjs` | `docs:legal` |
| `generate-guide-restant-pdf.mjs` | `docs:guide-restant` |
| `generate-player-cv.mjs` | `docs:cv` |

### Branding & assets

| Script | Commande npm | Rôle |
|--------|--------------|------|
| `generate-app-brand.mjs` | `branding:app` | Icône / splash / adaptive / lockup officiels |
| `generate-transparent-logos.mjs` | `branding:logos` | Logos transparents |
| `generate-woman-logos.mjs` | `branding:logos:woman` | Variantes Woman |
| `generate-universe-logos.mjs` | `branding:logos:universes` | Pictos pôles |
| `download-*-showcase-images.mjs` | *(manuel)* | Images showcase |

### i18n

| Script | Commande npm |
|--------|--------------|
| `generate-handcraft-locales.mjs` | `i18n:locales` |
| `sync-tertiary-locales.mjs` | *(manuel)* |
| `wire-i18n-files.mjs` | *(manuel)* |

### Natif

| Script | Commande npm |
|--------|--------------|
| `run-ios-simulator.sh` | `ios:sim` |

## Sous-dossier `lib/`

Helpers partagés entre scripts (pas destinés à l'app).

## Liens

- [../docs/README.md](../docs/README.md) — index documentation
- [../docs/GITHUB_AUTH.md](../docs/GITHUB_AUTH.md) — push vers GitHub
- [../assets/branding/README.md](../assets/branding/README.md) — logos officiels
- [../package.json](../package.json) — liste complète des commandes npm
- Code : https://github.com/alfredgibeau-ahoussinou/PRODAY · Docs : https://github.com/alfredgibeau-ahoussinou/PRODAY-docs
