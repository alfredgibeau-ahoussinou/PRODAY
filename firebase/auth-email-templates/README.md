# Templates e-mail Firebase Auth — ProDay

Templates versionnés pour **Authentication → Templates** (Identity Platform `verifyEmailTemplate` et `resetPasswordTemplate`).

Projet Firebase : **`proday-155b0`** (voir `.firebaserc`).

## Pourquoi les anciens fichiers ne marchaient pas

Les fichiers `email-verification.html` et `password-reset.html` sont des **documents HTML complets** (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`). Firebase Console traite le champ **Message** comme un **fragment de corps** : elle enveloppe déjà le contenu dans son propre layout. Coller un document entier provoque :

- un rendu cassé (balises visibles, styles ignorés, double `<body>`) ;
- des images externes parfois bloquées ;
- des couleurs `rgba()` ou CSS avancé mal interprétés.

Les fichiers **`*-firebase.html`** corrigent cela : fragment table-based, styles inline uniquement, variables Firebase officielles, `%LINK%` en bouton **et** en texte clair.

## Fichiers — validation e-mail

| Fichier | Rôle |
| --- | --- |
| `email-verification.config.json` | Métadonnées (expéditeur, objet, reply-to) |
| `email-verification-firebase.html` | **Fragment HTML à coller dans Console** |
| `email-verification-firebase.plain.txt` | **Version texte pure** (fallback si HTML cassé) |
| `email-verification.html` | Archive — document complet (ne pas coller tel quel) |
| `email-verification.fr.txt` | Version texte étendue (référence) |

## Fichiers — réinitialisation mot de passe

| Fichier | Rôle |
| --- | --- |
| `password-reset.config.json` | Métadonnées (expéditeur, objet, reply-to) |
| `password-reset-firebase.html` | **Fragment HTML à coller dans Console** |
| `password-reset-firebase.plain.txt` | **Version texte pure** (fallback) |
| `password-reset.html` | Archive — document complet (ne pas coller tel quel) |
| `password-reset.fr.txt` | Version texte étendue (référence) |

## Coller dans Firebase Console

### Validation e-mail

1. Ouvrir [Firebase Console](https://console.firebase.google.com) → projet **proday-155b0**
2. **Authentication** → **Templates** → **Validation de l'adresse e-mail** → crayon (modifier)
3. Remplir **exactement** :

| Champ console | Valeur |
| --- | --- |
| **Nom de l'expéditeur** (De) | `ProDay` |
| **Adresse de réponse** (Reply-to) | `contact@proday.app` |
| **Objet** | `Confirmez votre adresse e-mail ProDay` |
| **Message** | Coller **tout** le contenu de `email-verification-firebase.html` |
| **URL d'action** | `%LINK%` (valeur par défaut — **ne pas modifier**) |

4. **Enregistrer**.

### Réinitialisation mot de passe

| Champ console | Valeur |
| --- | --- |
| **Nom de l'expéditeur** (De) | `ProDay` |
| **Adresse de réponse** (Reply-to) | `contact@proday.app` |
| **Objet** | `Réinitialisez votre mot de passe ProDay` |
| **Message** | Coller **tout** le contenu de `password-reset-firebase.html` |
| **URL d'action** | `%LINK%` (valeur par défaut — **ne pas modifier**) |

> **Objet**, **Nom expéditeur** et **Reply-to** se configurent dans leurs champs dédiés — **pas** dans le HTML.

### Fallback texte brut

Si le rendu HTML reste cassé (balises visibles, mise en page absente) :

1. Remplacer le **Message** par le contenu de `*-firebase.plain.txt`
2. Ou déployer avec `--plain-text` (voir ci-dessous)

## Troubleshooting

| Symptôme | Action |
| --- | --- |
| Balises HTML visibles dans l'e-mail | Utiliser `*-firebase.plain.txt` ou vérifier `bodyFormat: HTML` via l'API |
| Bouton absent / lien mort | Vérifier que `%LINK%` est présent dans le message |
| Styles ignorés | Utiliser les fichiers `*-firebase.html` (inline only, pas de `<head>`) |
| Image logo bloquée | Les templates Firebase n'utilisent pas d'image externe — texte « ProDay » uniquement |
| Lien renvoie une erreur | Vérifier **Authorized domains** dans Authentication → Settings |
| Ne pas utiliser | `email-verification.html` / `password-reset.html` (documents complets avec DOCTYPE) |

## Déploiement automatique (recommandé)

Prérequis : clé Admin SDK locale (`firebase/*-adminsdk-*.json`, **gitignored**).

```bash
npm run firebase:deploy:auth-email
# ou explicitement :
node scripts/deploy-auth-email-template.mjs email-verification
node scripts/deploy-auth-email-template.mjs password-reset
```

Simulation sans écriture :

```bash
node scripts/deploy-auth-email-template.mjs email-verification --dry-run
```

Corps en texte brut (fallback) :

```bash
node scripts/deploy-auth-email-template.mjs email-verification --plain-text
```

Le script envoie le fragment `*-firebase.html` (sans wrapper document) via l'API Identity Platform (`projects.updateConfig`).

## Placeholders Firebase

| Placeholder | Usage |
| --- | --- |
| `%LINK%` | Lien d'action (obligatoire dans le message) |
| `%EMAIL%` | Adresse e-mail du compte |
| `%DISPLAY_NAME%` | Nom affiché de l'utilisateur |
| `%APP_NAME%` | Nom du projet Firebase |

## Structure du fragment Firebase

```
<table> (fond #0a0a0a, max 600px)
  ├── En-tête : « ProDay » (#22d3ee)
  ├── Titre + texte (#ffffff / #cccccc)
  ├── Bouton CTA : <a href="%LINK%"> (fond #22d3ee)
  ├── Lien alternatif : %LINK% en clair
  └── Pied de page : contact@proday.app
```

Couleurs ProDay : fond `#0a0a0a`, accent `#22d3ee`, texte `#ffffff`.

## Comportement app mobile

- `sendEmailVerification()` est appelé **sans** `actionCodeSettings` (`src/services/auth.service.ts`).
- Après clic sur le lien, l'utilisateur revient dans l'app et appuie sur **« J'ai confirmé mon email »** (`EmailVerificationScreen`).
- Callback Firebase : `https://proday-155b0.firebaseapp.com/__/auth/action`

Pour un deep link `proday://` futur, ajouter `actionCodeSettings` côté app **et** autoriser le domaine dans Authentication → Settings → Authorized domains.

## Réinitialisation mot de passe — app mobile

- `sendPasswordResetEmail()` est appelé **sans** `actionCodeSettings` (`src/services/auth.service.ts`, `ForgotPasswordScreen`).

## Valeurs finales recommandées

### Validation e-mail

- **Expéditeur** : ProDay
- **Reply-to** : contact@proday.app
- **Objet** : Confirmez votre adresse e-mail ProDay
- **Message** : `email-verification-firebase.html`
- **CTA** : Valider mon e-mail (bouton cyan `#22d3ee`)
- **URL d'action** : `%LINK%`

### Réinitialisation mot de passe

- **Expéditeur** : ProDay (`noreply@proday-155b0.firebaseapp.com`)
- **Reply-to** : contact@proday.app
- **Objet** : Réinitialisez votre mot de passe ProDay
- **Message** : `password-reset-firebase.html`
- **CTA** : Réinitialiser mon mot de passe (bouton cyan `#22d3ee`)
- **URL d'action** : `%LINK%`
