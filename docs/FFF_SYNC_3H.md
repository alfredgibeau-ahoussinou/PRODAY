# Synchronisation FFF — toutes les 3 heures (v2)

Exigence : rafraîchir les classements FFF **toutes les 3 heures**, indépendamment de
l'ouverture de l'application, sans jamais présenter une donnée ancienne comme fraîche.

Ce document consigne **ce qui a été vérifié sur les sources**, comment la planification
est implémentée, et ce qui reste limité par la source elle-même.

---

## 1. Sources : ce qui a été vérifié (15/09/2026)

| Source | Couverture | Conditions d'accès | Verdict |
|---|---|---|---|
| **API-Football** (`v3.football.api-sports.io`, clé `EXTERNAL_SCORES_API_KEY`) | Ligue 1, Ligue 2, National 1, D1F (4 championnats) | API **payante**, documentée, quotas par plan (ex. plan gratuit ≈ 10 req/min). Clé stockée en variable d'environnement Functions. | ✅ utilisable (dépend d'une clé payante) |
| **DOFA FFF** (`api-dofa.prd-aws.fff.fr`) | Régionaux / districts (IDs à mapper) | **API non officielle, non documentée, sans conditions d'utilisation publiées.** Hors ligne plusieurs fois en 2024, changement d'URL et de format constatés. | ⚠️ tolérée comme meilleur effort, **jamais supposée acquise** |
| Classements internes ProDay / matchs amicaux | tables maison | internes | ❌ **ne sont pas** des classements officiels — collections distinctes |

### Limites à ne pas masquer

1. **Il n'existe pas d'API FFF officielle ouverte et documentée.** DOFA est un endpoint
   non officiel : il peut disparaître, filtrer par IP ou changer de contrat de données
   sans préavis. ProDay le traite donc comme une source **optionnelle** :
   aucun identifiant de compétition n'est deviné, tout passe par `DOFA_COMPET_IDS`.
2. Sans `EXTERNAL_SCORES_API_KEY`, les 4 championnats nationaux **ne sont pas**
   synchronisés : les documents gardent leur dernier état valide et passent en
   `sync_health = "stale"` avec `last_error` explicite (jamais une date fraîche inventée).
3. Sans `DOFA_COMPET_IDS` (`{"r1_idf_a":"12345",…}`), les compétitions régionales et
   districts restent en `sync_health = "unavailable"` — c'est affiché comme tel.
4. Le plan API-Football impose un quota de requêtes : une exécution toutes les 3 h pour
   4 ligues (~4 à 8 requêtes) reste très en dessous des quotas courants, mais **un quota
   épuisé fera échouer la passe** : l'erreur est conservée, l'ancien classement reste en
   place avec son horodatage.

> Conclusion honnête : la cadence 3 h est **opérationnelle pour les compétitions dont la
> source est autorisée et configurée** ; pour le reste, l'application affiche l'absence de
> données au lieu de prétendre à une fraîcheur inexistante.

---

## 2. Architecture serveur

| Élément | Détail |
|---|---|
| Job planifié | `scheduledFffStandingsSync` — `every 3 hours`, TZ `Europe/Paris`, `maxInstances: 1`, timeout 540 s |
| Moteur | `functions/src/fffStandingsSync.ts` → `runLockedFffSync(db, owner, trigger)` |
| Verrou | `sync_locks/fff_standings`, TTL 20 min : jamais deux exécutions en parallèle (cron ↔ refresh manuel) |
| Retries | `withRetry` — 2 essais par source, attente 1,5 s puis 3 s |
| Journal | collection `sync_runs` (un enregistrement par exécution : updated / failed / errors) |
| Méta globale | `fff_league_standings/_sync_meta` : `last_success_at`, `last_attempt_at`, `last_error`, `sync_health`, `last_trigger` |
| Snapshot par compétition | `fff_league_standings/{leagueId}` : `standings`, `lastSyncAt`, `sync_health`, `last_error`, `last_attempt_at` |
| Rafraîchissement manuel | callable `syncFffStandingsNow` (admin seulement) — rate limit 15 min (`reserveManualRefresh`) + même verrou |
| Calendriers | `processFffStandingsFixturesDailySync` (même passe), écrit `fixtures` sans jamais écraser un calendrier officiel par une liste vide |

### Règles de sûreté

- **Aucune écriture vide** : une réponse vide ou une erreur laisse `standings` et
  `lastSyncAt` intacts (`markStale` n'écrit que `sync_health`, `last_error`,
  `last_attempt_at`).
- **`last_success_at` n'est mis à jour qu'après un rapatriement réel** (`updated > 0` et
  `failed === 0`). Un échec n'écrit jamais d'horodatage de fraîcheur.
- **Pas de fusion de collections** : les classements officiels vivent dans
  `fff_league_standings` ; tables internes et matchs amicaux restent dans leurs
  collections respectives.
- **Provenance des corrections manuelles** : une ligne corrigée par un admin
  (`manual_overrides`, provenance `reason` / `by` / `at`) **n'est jamais écrasée** par la
  source. `mergeWithOverrides` conserve la ligne corrigée, la réordonne et réexpose sa
  provenance dans le document. La correction reste jusqu'à suppression explicite.
- **Worker squelette** : `processFffEnterpriseDailyStandingsWorker` (03 h 00) ne
  synchronise plus rien — il crée uniquement les documents **manquants** avec un état
  honnête (`syncStatus: "fallback"`, `sync_health: "unavailable"`) et ne touche jamais un
  document existant. C'est ce comportement qui avait produit des `lastSyncAt` frais sur
  des lignes anciennes ; il a été supprimé.

---

## 3. Affichage client (Espace Club › Classements)

- `frenchFootballStandingsService.getCloudLeagueStandings` lit désormais `sync_health`,
  `last_error`, `last_attempt_at` et les expose dans `FrenchLeagueData`.
- `describeStandingsFreshness()` calcule l'état affiché :
  `ok` · `degraded` · `stale` (dernière réussite > 2 cadences + 30 min) · `error` ·
  `unavailable`. L'ancienneté réelle est toujours affichée (« il y a 4 h »).
- La barre de statut de `ClubStandingsScreen` affiche l'horodatage réel, prévient quand la
  donnée peut être obsolète, et expose un bouton **Actualiser** qui appelle le callable
  (le refus de rate limit remonte le message serveur, jamais un faux succès).

---

## 3 bis. État déployé en production (15/09/2026)

| Élément | Valeur observée |
|---|---|
| Projet | `proday-155b0` |
| Fonctions déployées | `scheduledFffStandingsSync` (us-central1, gen1 Node 20, timeout 540 s, `maxInstances: 1`), `syncFffStandingsNow` (callable admin), `processFffEnterpriseDailyStandingsWorker` (europe-west1, création de squelettes) |
| Job planifié | `firebase-schedule-scheduledFffStandingsSync-us-central1` — `state: ENABLED`, cadence `every 3 hours`, TZ `Europe/Paris` |
| Ancienne cadence | `every day 04:15` (exécutions constatées du 09 au 13/09 à 02:15 UTC, `{ updated: 0, skipped: 14 }`) |
| Prochaine exécution planifiée | `2026-09-15T21:30:00Z` (23:30 Paris) |
| Journal des passages | `sync_runs` : `trigger: scheduled`, `ran_at`, `maj/échecs/ignorés`, **motif des échecs** |
| Méta | `fff_league_standings/_sync_meta` : `schedule = every 3 hours`, `last_attempt_at`, `last_trigger = scheduled`, `sync_health`, `last_error`, **aucun `last_success_at` tant qu'aucune source ne réussit** |
| Verrou | `sync_locks/fff_standings` libéré après chaque passage (aucun orphelin) |

**Contrôle à tout moment :**

```bash
npm run fff:status   # lecture seule : cadence, derniers passages, état par compétition
```

### Résultat réel du premier passage déployé

```
[les 4 ligues nationales]  failed  — « Clé API-Football absente (EXTERNAL_SCORES_API_KEY) »
[les 10 compétitions DOFA]  skipped — « Aucun ID DOFA mappé (DOFA_COMPET_IDS) »
sync_runs  : trigger=scheduled, updated=0, failed=4, skipped=10, errors=[4 motifs]
_sync_meta : schedule=every 3 hours, last_trigger=scheduled, sync_health=error, last_success_at=absent
```

**Lecture honnête :** la **planification** fonctionne (3 h, hors application, journalisée). La
**synchronisation des données** ne fonctionne pas encore, faute de source configurée — et le produit le
dit à l'écran (badge obsolète / « aucune donnée officielle disponible ») au lieu d'afficher un classement
inventé.

### Mise en service de la source (à faire)

```bash
# Nationaux (API-Football, payant)
firebase functions:config:set external_scores.api_key="…"
firebase deploy --only functions:scheduledFffStandingsSync,functions:syncFffStandingsNow

# Régional / districts (DOFA, non officielle) : IDs relevés à la main, jamais devinés
firebase functions:config:set dofa.compet_ids='{"r1_idf_a":"12345","r1_idf_b":"12346"}'
```

> Le code lit `EXTERNAL_SCORES_API_KEY` (variable d'environnement) **ou** `external_scores.api_key`
> (config Functions, gen1). Sur une fonction gen2, seule la variable d'environnement est lue.

## 4. Vérifications exécutées

| Quoi | Comment | Résultat |
|---|---|---|
| Types Functions | `cd functions && npx tsc --noEmit` | 0 erreur |
| Types app | `npx tsc --noEmit` | 0 erreur |
| Types site (page d'invitation) | `cd website && npx tsc --noEmit` | 0 erreur |
| Verrou, staleness, overrides | `functions/test/fffStandingsSync.test.mjs` (`node --test`) | voir sortie ci-dessous |
| Suites Club (carpool / entraînements / tournois / classements) | `npx jest src/__tests__/…` | voir §5 |

```bash
cd functions && node --test test/fffStandingsSync.test.mjs
```

Les cas couverts par ce test : acquisition du verrou (deuxième exécution refusée),
reprise d'un verrou orphelin expiré, conservation intégrale du snapshot en échec,
préservation de la provenance des corrections manuelles, et non-écrasement de
`last_success_at` après un échec.

---

## 5. Ce qui reste à faire côté exploitation

1. ✅ **Déployé** le 15/09/2026 (voir §3 bis) — la cadence est passée de quotidienne à 3 h.
2. ⏳ **Configurer la source** — c'est le seul point bloquant restant : sans
   `EXTERNAL_SCORES_API_KEY` les 4 nationaux restent `unavailable`, sans `DOFA_COMPET_IDS`
   les 10 compétitions régionales/districts restent non synchronisées. Voir §3 bis.
3. ⏳ **Lire la prochaine occurrence planifiée** (`2026-09-15T21:30:00Z`) avec
   `npm run fff:status` : elle doit apparaître dans `sync_runs` avec
   `trigger = scheduled`, sans intervention. Les passages déjà observés proviennent d'un
   déclenchement manuel du **même** job (`gcloud scheduler jobs run`) : le chemin
   Pub/Sub → fonction est réel, l'instant ne l'est pas.
4. **Surveiller** `fff_league_standings/_sync_meta` et `sync_runs` : un `sync_health`
   durablement à `error` signifie une source indisponible, pas un bug d'affichage.
5. **Recette** : la cadence ne peut pas être attendue plus d'une fois dans une session —
   confirmer sur deux occurrences consécutives.
