# Templates e-mail Firebase Auth — ProDay

Projet : **proday-155b0** ([Console](https://console.firebase.google.com/project/proday-155b0/authentication/emails)).

## Pourquoi du texte brut uniquement

Firebase Authentication traite le champ **Message** comme un corps simple. Les documents HTML complets, les fragments table-based ou le CSS inline produisent souvent un rendu cassé (balises visibles, styles ignorés). Le déploiement automatique via l'API Identity Platform est bloqué sur ce projet (`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`).

**Approche fiable** : texte brut avec les variables officielles `%LINK%`, `%EMAIL%`, `%APP_NAME%`. Coller le contenu des fichiers `.txt` dans **Message** ; configurer objet, expéditeur et reply-to dans leurs champs dédiés.

> `%LINK%` doit être **sur sa propre ligne** — Firebase le transforme en lien cliquable.

## Configuration Console

| Template Console | Objet | Message (fichier) | Expéditeur | Reply-to | URL d'action |
| --- | --- | --- | --- | --- | --- |
| **Validation de l'adresse e-mail** | `Confirmez votre adresse e-mail ProDay` | `verification.txt` | `ProDay` | `contact@proday.app` | `%LINK%` (défaut) |
| **Réinitialisation du mot de passe** | `Réinitialisez votre mot de passe ProDay` | `password-reset.txt` | `ProDay` | `contact@proday.app` | `%LINK%` (défaut) |

## Étapes (copier-coller)

1. [Firebase Console](https://console.firebase.google.com) → **proday-155b0** → **Authentication** → **Templates**
2. Ouvrir le template (crayon ✏️)
3. Remplir **Nom de l'expéditeur**, **Reply-to** et **Objet** selon le tableau
4. Dans **Message**, coller **intégralement** le contenu de `verification.txt` ou `password-reset.txt`
5. Laisser **URL d'action** sur `%LINK%`
6. **Enregistrer**

## Variables disponibles

| Variable | Description |
| --- | --- |
| `%LINK%` | Lien d'action (obligatoire, ligne seule) |
| `%EMAIL%` | Adresse e-mail du compte |
| `%APP_NAME%` | Nom du projet Firebase |
| `%DISPLAY_NAME%` | Nom affiché de l'utilisateur |

## Dépannage

| Problème | Action |
| --- | --- |
| Lien non cliquable | Vérifier que `%LINK%` est seul sur une ligne |
| Lien mort / erreur | **Authentication → Settings → Authorized domains** |
| HTML visible dans l'e-mail | Supprimer tout HTML du champ Message ; utiliser les `.txt` |

## Style personnalisé

La Console Firebase ne garantit pas un rendu HTML fiable sur tous les plans. Pour un design avancé (logo, couleurs ProDay), envoyer les e-mails via **Cloud Functions** + un service tiers (SendGrid, Mailgun, etc.) au lieu des templates Auth intégrés.
