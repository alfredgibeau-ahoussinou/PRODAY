# Console Admin ProDay

## Compte administrateur

- Email plateforme : `proday.admin@gmail.com`
- Le mot de passe **ne doit pas** être stocké dans le dépôt Git.

## 1. Clé service account (une fois)

1. [Firebase Console](https://console.firebase.google.com) → Paramètres projet → **Comptes de service**
2. **Générer une nouvelle clé privée**
3. Enregistrer le fichier sous `firebase/service-account.json` (déjà dans `.gitignore`)

## 2. Créer / mettre à jour l’admin

Dans `.env` (local uniquement) :

```bash
ADMIN_SETUP_EMAIL=proday.admin@gmail.com
ADMIN_SETUP_PASSWORD=votre-mot-de-passe-securise
```

Puis :

```bash
npm run admin:setup
```

Le script :
- crée ou met à jour le compte **Authentication**
- applique le custom claim `{ admin: true }`
- crée le profil Firestore `users/{uid}`

**Important :** déconnectez-vous puis reconnectez-vous dans l’app pour recharger le token admin.

## 3. Déployer règles + Functions

```bash
firebase deploy --only firestore:rules,storage,functions
```

Sans **Blaze**, les Functions ne se déploient pas : la console admin peut quand même **lister / modifier / supprimer** dans Firestore, mais **créer** ou **supprimer** un compte Auth complet nécessite les callables `adminCreateUser` et `adminDeleteUser`.

## 4. Accès dans l’app

1. Connexion avec le compte admin
2. Onglet **Profil** → **Console Admin ProDay**
3. Onglets : Vue d’ensemble, Utilisateurs, Événements, Mercato, Matchs

## Sécurité

- Les droits réels passent par `request.auth.token.admin == true` (Firestore + Storage + Functions).
- Ne partagez pas le mot de passe admin en production ; changez-le après les tests initiaux.
