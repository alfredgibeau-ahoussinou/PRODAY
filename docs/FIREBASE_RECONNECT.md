# Repasser sur Firebase — ProDay

Checklist rapide pour reconnecter l’app au backend **proday-155b0**.

## 1. Vérifier `.env`

Toutes les clés `EXPO_PUBLIC_FIREBASE_*` doivent être renseignées (déjà OK si `npm run firebase:health` affiche ✅).

```bash
npm run firebase:health
```

## 2. Déployer Firestore

```bash
npm run firebase:deploy
```

Déploie : règles, index, compteurs publics (`platform_stats/recruitment`).

## 3. Activer Storage (photos profil)

**Obligatoire une fois dans la console** (CLI seule ne suffit pas) :

1. [Console Storage ProDay](https://console.firebase.google.com/project/proday-155b0/storage)
2. **Commencer** → région `europe-west1`
3. Vérifier le bucket dans `.env` :
   ```env
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=proday-155b0.firebasestorage.app
   ```
4. Déployer les règles :
   ```bash
   npm run firebase:deploy:storage
   ```

## 4. Peupler Firestore (données réelles)

```bash
npm run firebase:seed
npm run stats:refresh
```

Crée annonces Mercato, tournois Arena, détection, sponsors — **sans écraser** l’existant.

## 5. Admin (optionnel)

```bash
ADMIN_SETUP_EMAIL=proday.admin@gmail.com ADMIN_SETUP_PASSWORD='***' npm run admin:setup
```

Puis reconnectez-vous dans l’app pour le claim `admin`.

## 6. Cloud Functions (optionnel — Blaze)

Plan Blaze requis :

```bash
firebase deploy --only functions
```

Sans Blaze : relances manuelles depuis l’app (déjà supportées).

## 7. Relancer l’app

```bash
npx expo start --clear
```

---

## État actuel (automatisé)

| Service | Commande |
|---------|----------|
| Diagnostic | `npm run firebase:health` |
| Deploy Firestore | `npm run firebase:deploy` |
| Règles Storage | `npm run firebase:deploy:storage` |
| Seed données | `npm run firebase:seed` |
| Stats Discover | `npm run stats:refresh` |

Les **aperçus locaux** (photos IA dans `assets/generated/`) restent visibles uniquement quand Firestore est vide — dès que `firebase:seed` a tourné, l’app affiche les **vraies données**.
