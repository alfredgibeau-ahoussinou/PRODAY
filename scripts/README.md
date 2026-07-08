# Scripts CLI (`scripts/`)

> Scripts Node invoqués via `npm run` à la racine. Pas d'import depuis `src/` — outils d'exploitation et génération.

## Catégories

### Firebase & données

| Script | Commande npm | Rôle |
|--------|--------------|------|
| `seed-firestore.mjs` | `firebase:seed` | Données de démo Firestore |
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

| Script | Commande npm |
|--------|--------------|
| `generate-transparent-logos.mjs` | `branding:logos` |
| `generate-woman-logos.mjs` | `branding:logos:woman` |
| `generate-universe-logos.mjs` | `branding:logos:universes` |
| `download-*-showcase-images.mjs` | *(manuel)* |

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

- [../docs/README.md](../docs/README.md) — documentation générée
- [../package.json](../package.json) — liste complète des commandes npm
