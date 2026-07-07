# Templates e-mail Firebase Auth — ProDay

Templates versionnés pour **Authentication → Templates** (Identity Platform `verifyEmailTemplate` et `resetPasswordTemplate`).

Projet Firebase : **`proday-155b0`** (voir `.firebaserc`).

## Fichiers — validation e-mail

| Fichier | Rôle |
| --- | --- |
| `email-verification.config.json` | Métadonnées (expéditeur, objet, reply-to) |
| `email-verification.html` | Corps HTML dark `#000` + accent cyan `#22d3ee` |
| `email-verification.fr.txt` | Version texte (référence / mode `--plain-text`) |

## Déploiement automatique (recommandé)

Prérequis : clé Admin SDK locale (`firebase/*-adminsdk-*.json`, **gitignored**).

```bash
npm run firebase:deploy:auth-email
# ou explicitement :
node scripts/deploy-auth-email-template.mjs email-verification
```

Simulation sans écriture :

```bash
node scripts/deploy-auth-email-template.mjs email-verification --dry-run
```

Autres templates :

```bash
node scripts/deploy-auth-email-template.mjs password-reset
```

Le script appelle l’API Identity Platform (`projects.updateConfig`).

## Saisie manuelle — Console Firebase

Si vous n’avez pas de clé Admin SDK :

1. Ouvrir [Firebase Console](https://console.firebase.google.com) → projet **proday-155b0**
2. **Authentication** → **Templates** → **Validation de l'adresse e-mail**
3. Remplir **exactement** :

| Champ console | Valeur |
| --- | --- |
| **Nom de l'expéditeur** (De) | `ProDay` |
| **Adresse de réponse** (Reply-to) | `contact@proday.app` |
| **Objet** | `Confirmez votre adresse e-mail ProDay` |
| **Message** | Coller le contenu de `email-verification.html` |
| **URL d'action** | `%LINK%` (valeur par défaut — ne pas modifier) |

4. **Enregistrer** le template.

Si les balises HTML s’affichent en clair dans l’e-mail reçu, le format n’est pas HTML — relancer le script de déploiement (il force `bodyFormat: HTML`).

## Placeholders Firebase

| Placeholder | Usage |
| --- | --- |
| `%LINK%` | Lien de validation (URL d'action) |
| `%EMAIL%` | Adresse e-mail du compte |
| `%DISPLAY_NAME%` | Nom affiché de l'utilisateur |
| `%APP_NAME%` | Nom du projet Firebase |

## Comportement app mobile

- `sendEmailVerification()` est appelé **sans** `actionCodeSettings` (`src/services/auth.service.ts`).
- Après clic sur le lien, l'utilisateur revient dans l'app et appuie sur **« J'ai confirmé mon email »** (`EmailVerificationScreen`).
- Callback Firebase : `https://proday-155b0.firebaseapp.com/__/auth/action`

Pour un deep link `proday://` futur, ajouter `actionCodeSettings` côté app **et** autoriser le domaine dans Authentication → Settings → Authorized domains.

## Valeurs finales recommandées

- **Expéditeur** : ProDay
- **Reply-to** : contact@proday.app
- **Objet** : Confirmez votre adresse e-mail ProDay
- **CTA** : Valider mon e-mail (bouton cyan `#22d3ee`)
- **URL d'action** : `%LINK%`
