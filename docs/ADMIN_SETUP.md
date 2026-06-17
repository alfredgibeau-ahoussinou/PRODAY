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

1. Connexion avec le compte admin (`proday.admin@gmail.com` + mot de passe défini dans `.env`)
2. L’app ouvre automatiquement l’**espace Admin** (claim `admin: true` requis)
3. Onglets : **Pilotage**, **Utilisateurs**, **Modération**, **Clubs**, **Système**
4. **Prévisualiser l’app utilisateur** : onglet Système → mode prévisualisation (bandeau en haut)

## Mot de passe

Le mot de passe n’est **pas** stocké dans Git. Définissez-le uniquement dans `.env` :

```bash
ADMIN_SETUP_PASSWORD=votre-mot-de-passe-securise
```

Puis `npm run admin:setup` pour créer ou réinitialiser le compte Auth.

## Sécurité

- Les droits réels passent par `request.auth.token.admin == true` (Firestore + Storage + Functions).
- Ne partagez pas le mot de passe admin en production ; changez-le après les tests initiaux.
