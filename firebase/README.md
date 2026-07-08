# Configuration Firebase (`firebase/`)

> Règles de sécurité et ressources Auth — déployées via `firebase.json` (racine).

## Contenu

| Fichier / dossier | Rôle |
|-------------------|------|
| `firestore.rules` | Sécurité Firestore (`is_verified`, rôles admin…) |
| `firestore.indexes.json` | Index composites requis |
| `storage.rules` | Sécurité Firebase Storage |
| `auth-email-templates/` | HTML/TXT e-mails Auth brandés |

## Déploiement

```bash
npm run firebase:deploy          # règles + index + refresh stats
npm run firebase:deploy:storage  # storage.rules
npm run firebase:rules:test      # tests émulateur
```

## E-mails Auth

Templates Console souvent verrouillés → contournement via Cloud Functions (`authCustomEmails.ts`).

→ [auth-email-templates/README.md](./auth-email-templates/README.md)

## Liens

- [../docs/FIREBASE_SETUP.md](../docs/FIREBASE_SETUP.md)
- [../docs/FIRESTORE_DEPLOY.md](../docs/FIRESTORE_DEPLOY.md)
- [../functions/README.md](../functions/README.md)

## Attention

Le fichier `*-firebase-adminsdk-*.json` est une clé de service — **ne pas committer** en public (vérifier `.gitignore`).
