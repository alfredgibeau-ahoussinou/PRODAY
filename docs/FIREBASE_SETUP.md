# Guide Firebase ProDay — pas à pas

## Étape 1 — Créer le projet

1. Va sur [https://console.firebase.google.com](https://console.firebase.google.com)
2. **Ajouter un projet** → nom : `ProDay` (ou autre)
3. Désactive Google Analytics si tu veux aller plus vite (optionnel)
4. **Créer le projet**

---

## Étape 2 — Activer Firestore (base de données)

1. Menu gauche → **Firestore Database**
2. **Créer une base de données**
3. Choisis **Mode test** pour commencer (30 jours ouverts en écriture)  
   → plus tard tu passeras en **mode production** avec les règles du repo
4. Région : `europe-west1` (Paris / Belgique) recommandé pour la France

---

## Étape 3 — Activer l’authentification

1. Menu gauche → **Authentication**
2. **Commencer**
3. Onglet **Sign-in method** → active **E-mail/Mot de passe**, **Google** et **Apple** (iOS)

4. **Google (connexion sociale)** — deux identifiants minimum :

   - **Web client ID** : Firebase → Authentication → Google → activer → copier le *Web client ID* (ou Google Cloud → Credentials → client Web).
   - **iOS client ID** : [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Créer un identifiant** → **ID client OAuth iOS** → bundle `com.proday.app` (ou `host.exp.Exponent` pour Expo Go).

   Dans `.env` :

   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-yyyy.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-zzzz.apps.googleusercontent.com
   ```

   > Sur iOS, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` est **obligatoire**. Sans lui, le bouton Google affiche un message de configuration au lieu de planter l’app.

5. Pour Apple : configure le Service ID / clé dans Apple Developer, puis Firebase → Apple.

---

## Étape 4 — Récupérer les clés pour l’app

1. Icône **engrenage** → **Paramètres du projet**
2. Descends jusqu’à **Vos applications**
3. Clique **</>** (Web) pour ajouter une app web
4. Nom : `ProDay Mobile` → **Enregistrer l’application**
5. Tu vois un bloc `firebaseConfig` — copie les valeurs

Dans le dossier PRODAY sur ton Mac :

```bash
cd /Users/gibeau--ahoussinou/PRODAY
cp .env.example .env
```

Ouvre `.env` et remplis (exemple) :

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=proday-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=proday-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=proday-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> Ne commite **jamais** le fichier `.env` (il est déjà dans `.gitignore`).

---

## Plan Spark vs Blaze

| Plan | Firestore / Auth | Cloud Functions (relances auto, FCM serveur) |
|------|------------------|-----------------------------------------------|
| **Spark** (gratuit) | Oui | Non |
| **Blaze** (pay-as-you-go) | Oui | Oui |

Sans Blaze, l’app fonctionne quand même : convocations, RSVP, composition, Live Stats, relance **manuelle** depuis l’accueil ou l’événement.

Pour activer Blaze : [Paramètres facturation](https://console.firebase.google.com/project/proday-155b0/usage/details) → passer en Blaze → puis :

```bash
firebase deploy --only functions,firestore:rules
```

---

## Étape 5 — Activer Storage (obligatoire pour photos / avatar)

Sans cette étape, **la photo de profil et la galerie ne fonctionnent pas** (Erreur Storage ou upload silencieux).

1. Console Firebase → **Storage** (Build)
2. Cliquer **Commencer** / **Get started**
3. Même région que Firestore (`europe-west1` recommandé)
4. Mode **production** ou test (les règles du repo s’appliquent après deploy)
5. Copier le **bucket** (ex. `proday-155b0.firebasestorage.app`) dans `.env` :

```env
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=proday-155b0.firebasestorage.app
```

6. Redémarrer Expo : `npx expo start --clear`

---

## Étape 6 — Déployer les règles et index (CLI)

Une seule fois sur ton Mac :

```bash
npm install -g firebase-tools
firebase login
cd /Users/gibeau--ahoussinou/PRODAY
firebase use --add
```

Choisis ton projet ProDay dans la liste.

Puis :

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Checklist post-déploiement : voir **`docs/FIRESTORE_DEPLOY.md`**.

Ça envoie :
- `firebase/firestore.rules` (sécurité : validation profils, messages)
- `firebase/firestore.indexes.json` (requêtes rapides par rôle)
- `firebase/storage.rules` (avatar, galerie photos, documents de vérification)

**Storage (photos de profil)** : menu **Storage** → **Commencer** → mode test ou production, même région que Firestore. Vérifie que `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` est renseigné dans `.env`.

---

## Étape 7 — Structure des données dans Firestore

Dans la console → **Firestore** → **Démarrer une collection** :

### Collection `users` (document ID = uid Firebase Auth)

Exemple document `users/abc123` pour un **joueur** :

```json
{
  "display_name": "Lucas Martin",
  "email": "lucas@email.com",
  "role": "player",
  "is_verified": true,
  "verification_status": "NOT_REQUIRED",
  "is_active": true,
  "city": "Marseille",
  "created_at": "2026-05-21T10:00:00Z",
  "updated_at": "2026-05-21T10:00:00Z",
  "profile": {
    "position": "Attaquant",
    "category": "U19",
    "level": "R1",
    "height_cm": 176,
    "weight_kg": 70,
    "strong_foot": "right",
    "availability": "available",
    "season_stats": { "matches": 28, "goals": 8, "assists": 6 }
  }
}
```

Exemple pour un **coach** (vérification obligatoire) :

```json
{
  "display_name": "Marc Lefebvre",
  "email": "marc@email.com",
  "role": "coach",
  "is_verified": true,
  "verification_status": "VERIFIED",
  "is_active": true,
  "city": "Lyon",
  "created_at": "2026-05-21T10:00:00Z",
  "updated_at": "2026-05-21T10:00:00Z",
  "profile": {
    "job_title": "Préparateur physique",
    "years_experience": 8,
    "rating": 4.8,
    "bio": "Préparation physique U17 à Seniors.",
    "specialties": ["Préparation physique", "Renforcement"]
  }
}
```

Rôles possibles : `player`, `coach`, `agent`, `organizer`, `sponsor`

### Collection `clubs` (optionnel — compteur accueil)

```json
{
  "name": "US Marseille",
  "city": "Marseille",
  "verified": true,
  "is_active": true
}
```

### Collection `team_events` (calendrier / convocations)

```json
{
  "title": "Entraînement mercredi",
  "event_type": "training",
  "organizer_uid": "uid_coach",
  "organizer_name": "Marc Lefebvre",
  "club_id": "club_1",
  "starts_at": "2026-05-28T18:00:00Z",
  "city": "Lyon",
  "invitee_uids": ["uid_j1", "uid_j2"],
  "rsvps": { "uid_j1": "yes", "uid_j2": "pending" },
  "reminder_hours_before": 24
}
```

Types : `training`, `detection`, `meeting`, `friendly`, `other`  
Réponses RSVP : `pending`, `yes`, `no`, `maybe`

### Collection `recruitment_posts` (annonces Mercato)

```json
{
  "club_id": "club_1",
  "club_name": "US Marseille",
  "title": "Recherche Attaquant U19",
  "position": "Attaquant",
  "category": "U19",
  "level": "R1",
  "city": "Marseille",
  "description": "Cherche attaquant pour la saison prochaine.",
  "status": "OPEN",
  "created_at": "2026-05-20T14:00:00Z"
}
```

---

## Étape 8 — Admin (valider les diplômes)

Pour approuver un coach/agent depuis Cloud Functions, le compte admin doit avoir la claim `admin: true` (à configurer plus tard via une Cloud Function ou la console).

En attendant, tu peux modifier à la main dans Firestore :
- `is_verified` → `true`
- `verification_status` → `VERIFIED`

---

## Étape 9 — Remplir la base (données réelles)

**Option A — Inscription dans l’app**  
Onglet **Profil** → Inscription → crée un compte Firebase Auth + document `users/{uid}`.

**Nettoyer d'anciennes données fictives (optionnel)**

```bash
npm run cleanup:demo
```

Supprime uniquement les comptes démo et les documents `seed_*`. Les comptes créés via **Inscription** sont conservés.

---

## Étape 10 — Vérifier que l’app lit les vraies stats

1. Redémarre l’app / le bundler après avoir créé `.env`
2. Onglet **Recrutement** : les cartes doivent afficher le **vrai nombre** de `users` (pas 1248)
3. Si tout est à 0 : normal tant qu’il n’y a pas de documents dans Firestore

---

## Récap visuel

```
Console Firebase
    ├── Authentication (email/password)
    ├── Firestore
    │     ├── users          ← profils + stats
    │     ├── clubs          ← compteur clubs
    │     ├── recruitment_posts ← annonces
    │     ├── team_events       ← convocations & stats match
    │     └── team_payment_requests ← cotisations club
    └── Paramètres → clés Web → .env sur ton Mac

Terminal
    └── firebase deploy --only firestore:rules,firestore:indexes
```

## Aide

| Problème | Solution |
|----------|----------|
| Photo / galerie ne s’upload pas | **Storage non activé** → Console → Storage → Commencer, puis `firebase deploy --only storage` |
| Profil ne s’enregistre pas | Redémarrer l’app après mise à jour ; vérifier connexion Firebase |
| Stats toujours à 0 | Vérifier `.env` + documents dans `users` avec `is_active: true` |
| Erreur index Firestore | Lien dans les logs console → créer l’index, ou `firebase deploy --only firestore:indexes` |
| « Firebase non configuré » | `EXPO_PUBLIC_FIREBASE_API_KEY` vide dans `.env` |
