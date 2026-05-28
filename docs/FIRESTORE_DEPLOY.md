# Déploiement Firestore — ProDay

Guide opérationnel pour publier les **règles**, **index** et vérifier le module **Gestion équipe** en production.

---

## Prérequis

1. CLI Firebase installée et connectée :

```bash
npm install -g firebase-tools
firebase login
cd /Users/gibeau--ahoussinou/PRODAY
firebase use proday-155b0   # ou firebase use --add
```

2. Fichier `.env` rempli (`EXPO_PUBLIC_FIREBASE_*`).
3. Service account admin dans `firebase/*adminsdk*.json` (scripts locaux uniquement).

---

## Commandes de déploiement

### Déploiement standard (recommandé)

```bash
npm run firebase:deploy
```

Équivalent à :

```bash
firebase deploy --only firestore:rules,firestore:indexes
npm run stats:refresh
```

### Déploiement ciblé

| Objectif | Commande |
|----------|----------|
| Règles uniquement | `firebase deploy --only firestore:rules` |
| Index uniquement | `firebase deploy --only firestore:indexes` |
| Storage | `npm run firebase:deploy:storage` |
| Functions (plan Blaze) | `firebase deploy --only functions` |

### Diagnostic post-déploiement

```bash
npm run firebase:health
```

---

## Fichiers déployés

| Fichier repo | Ressource Firebase |
|--------------|-------------------|
| `firebase/firestore.rules` | Règles de sécurité Firestore |
| `firebase/firestore.indexes.json` | Index composites |
| `firebase/storage.rules` | Règles Storage (avatars, docs) |

---

## Index composites requis

| Collection | Champs | Usage app |
|------------|--------|-----------|
| `team_payment_requests` | `member_uid ASC`, `due_at DESC` | Mes cotisations joueur |
| `club_announcements` | `club_id ASC`, `created_at DESC` | Fil annonces club |
| `users` | `role`, `is_active`, `created_at` | Listes joueurs / coachs |
| `recruitment_applications` | `player_uid`, `created_at` | Mes candidatures |
| `message_threads` | `participant_ids`, `updated_at` | Messagerie |

> **Note :** les requêtes `orderBy('starts_at')` sur `team_events` utilisent l’index single-field automatique Firestore — ne pas le déclarer dans `firestore.indexes.json` (erreur 400).

---

## Règles critiques — Gestion équipe

### `team_events`

- **Lecture :** utilisateur connecté.
- **Création :** organisateur ou admin.
- **Mise à jour :**
  - Si `match_report_finalized_at != null` → **staff/admin uniquement**.
  - Sinon organisateur ou staff/admin.
  - Joueurs : RSVP limité (`rsvps`, `rsvp_notes`, `invitee_uids`, `updated_at`).
- **Champs protégés** (joueurs) : `attendance_marks`, `lineup`, `live_actions`, `player_match_stats`, `match_report_finalized_at`, etc.

### `team_payment_requests`

- **Lecture :** utilisateur connecté.
- **Écriture :** staff (`coach`, `organizer`, `agent`) ou admin.

---

## Checklist post-déploiement

Cochez après chaque release Firestore :

### 1. CLI & console

- [ ] `firebase deploy --only firestore:rules,firestore:indexes` → **Deploy complete**
- [ ] Console Firebase → Firestore → **Règles** : date de publication récente
- [ ] Console → Firestore → **Index** : index `team_payment_requests` **Enabled** (pas « Building » bloqué)

### 2. Santé projet

- [ ] `npm run firebase:health` → Auth OK, collections lisibles
- [ ] `team_events` et `team_payment_requests` comptés sans erreur

### 3. Parcours coach (app)

- [ ] `npm run firebase:seed` — données gestion équipe présentes (match, entraînement, cotisations)
- [ ] Dashboard → module **Gestion équipe** s’ouvre
- [ ] Onglet **Planning** : événements visibles
- [ ] Onglet **Présences** : RSVP joueur + pointage coach
- [ ] Onglet **Stats** : feuille joueur éditable
- [ ] **Valider le rapport** → édition bloquée pour un joueur
- [ ] Staff peut **déverrouiller** le rapport
- [ ] Export HTML rapport match s’ouvre

### 4. Parcours finance

- [ ] Création cotisation (staff)
- [ ] Marquer **payé** / **retard**
- [ ] Export CSV (console dev)

### 5. Sécurité (tests manuels)

| Scénario | Attendu |
|----------|---------|
| Joueur modifie `attendance_marks` | Refus Firestore |
| Joueur modifie rapport verrouillé | Refus Firestore |
| Joueur met à jour son RSVP + motif | OK |
| Staff finalise rapport | OK |
| Joueur crée `team_payment_requests` | Refus Firestore |

> Tests automatisés émulateur : voir section « Tests règles (plus tard) ».

---

## Dépannage

| Erreur | Action |
|--------|--------|
| `401 invalid authentication` | `firebase login --reauth` |
| Index « not necessary » (single field) | Retirer l’index du JSON, redéployer |
| `Missing index` dans les logs app | Cliquer le lien console ou ajouter l’index composite |
| Permission denied sur cotisation | Vérifier rôle `coach`/`organizer`/`agent` ou claim admin |
| Rapport verrouillé mais modifiable | Vérifier que les règles déployées incluent `isStaffOrAdmin()` |

---

## Tests règles (automatisés)

```bash
npm install
npm run firebase:rules:test
```

Lance l’émulateur Firestore puis exécute `scripts/firestore-rules.test.mjs` (`@firebase/rules-unit-testing`).

Scénarios couverts : RSVP joueur, rapport verrouillé, finance staff-only, annonces club, scores tournoi organisateur.

---

## Références

- Contrats API : `docs/API_CONTRACTS.md`
- Schéma données : `docs/DATABASE_SCHEMA.md`
- Setup initial : `docs/FIREBASE_SETUP.md`
