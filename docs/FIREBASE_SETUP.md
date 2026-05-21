# Firebase — données réelles ProDay

L'application **ne utilise plus de données de démo**. Tous les comptages et listes viennent de **Firestore**.

## Configuration

1. Créer un projet sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer **Firestore** et **Authentication**
3. Copier `.env.example` → `.env` et remplir les clés `EXPO_PUBLIC_FIREBASE_*`
4. Déployer les règles et index :

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Collections attendues

| Collection | Usage |
|------------|--------|
| `users` | Joueurs, coachs, agents — champs `role`, `is_active`, `created_at`, `profile` |
| `clubs` | Comptage clubs sur l'accueil recrutement |
| `recruitment_posts` | Annonces ouvertes (`status: OPEN`) |

## Statistiques affichées

- **Joueurs** : `count(users)` où `role == player` et `is_active == true`
- **Coachs / agents** : idem par rôle
- **Clubs** : `count(clubs)`
- **Annonces** : `count(recruitment_posts)` où `status == OPEN`

Si Firebase n'est pas configuré, l'UI affiche **0** et un message d'aide (pas de faux chiffres).

## Index Firestore requis

Voir `firebase/firestore.indexes.json`. Sans index, les listes utilisent une requête de repli (sans `orderBy`).

## Services code

| Service | Fichier |
|---------|---------|
| Stats réelles | `src/services/stats.service.ts` |
| Profils | `src/services/users.service.ts` |
| Annonces | `src/services/recruitment.service.ts` |
