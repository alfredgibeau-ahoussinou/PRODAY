/**
 * Synchronisation FFF 3 h — verrou, conservation du dernier snapshot valide,
 * provenance des corrections manuelles, rate limit du refresh manuel.
 *
 * Firestore est simulé en mémoire (aucun accès réseau, aucun émulateur).
 * Exécution : `cd functions && npm run build && node --test test/fffStandingsSync.test.mjs`
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FFF_SYNC_META_DOC,
  MANUAL_REFRESH_MIN_INTERVAL_MS,
  acquireSyncLock,
  releaseSyncLock,
  reserveManualRefresh,
  runLockedFffSync,
} from '../lib/fffStandingsSync.js';

const LOCK_DOC = 'sync_locks/fff_standings';
const LEAGUE_COL = 'fff_league_standings';

function isDeleteSentinel(value) {
  return Boolean(value) && typeof value === 'object' && value.constructor?.name === 'DeleteTransform';
}

function applyMerge(existing, patch) {
  const next = { ...(existing ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (isDeleteSentinel(value)) {
      delete next[key];
      continue;
    }
    next[key] = value && typeof value === 'object' && value.constructor?.name === 'ServerTimestampTransform'
      ? new Date().toISOString()
      : value;
  }
  return next;
}

/** Firestore minimal : doc().get()/set(merge)/delete, transaction, collection().add(). */
function createFakeDb(initialDocs = {}) {
  const store = new Map(Object.entries(initialDocs));
  const runs = [];

  const makeRef = (path) => ({
    path,
    id: path.split('/').pop(),
    async get() {
      const data = store.get(path);
      return { exists: data !== undefined, id: path.split('/').pop(), data: () => data };
    },
    async set(patch, options) {
      store.set(path, options?.merge ? applyMerge(store.get(path), patch) : { ...patch });
    },
    async update(patch) {
      store.set(path, applyMerge(store.get(path), patch));
    },
    async delete() {
      store.delete(path);
    },
  });

  const db = {
    store,
    runs,
    doc: (path) => makeRef(path),
    collection(name) {
      return {
        doc: (id) => makeRef(`${name}/${id}`),
        async add(data) {
          runs.push({ collection: name, ...data });
          return makeRef(`${name}/auto-${runs.length}`);
        },
      };
    },
    async runTransaction(fn) {
      return fn({
        get: (ref) => ref.get(),
        set: (ref, patch, options) => ref.set(patch, options),
        update: (ref, patch) => ref.update(patch),
        delete: (ref) => ref.delete(),
      });
    },
  };
  return db;
}

const LEAGUE_DOC = {
  id: 'ligue1',
  name: "Ligue 1 McDonald's",
  season: '2026-2027',
  standings: [
    {
      rank: 1,
      team_id: 'psg',
      name: 'Paris Saint-Germain',
      played: 5,
      won: 4,
      drawn: 1,
      lost: 0,
      goals_for: 12,
      goals_against: 3,
      goal_diff: 9,
      points: 13,
      form: ['V', 'V', 'N'],
      _manual_override: {
        fields: ['points'],
        reason: 'Retrait de points confirmé par la commission',
        by: 'admin-test',
        at: '2026-09-10T08:00:00.000Z',
      },
    },
  ],
  lastSyncAt: '2026-09-15T06:00:00.000Z',
  sync_health: 'ok',
  manual_overrides: {
    psg: {
      fields: ['points'],
      reason: 'Retrait de points confirmé par la commission',
      by: 'admin-test',
      at: '2026-09-10T08:00:00.000Z',
    },
  },
};

/* ------------------------------------------------------------------ */
/* Verrou                                                              */
/* ------------------------------------------------------------------ */

test('acquireSyncLock — refuse la 2e exécution tant que le verrou est détenu', async () => {
  const owner = 'run-1';
  const lockDb = createFakeDb({
    [LOCK_DOC]: { owner: 'cron', acquired_at: Date.now(), expires_at: Date.now() + 60_000 },
  });
  const lock = await acquireSyncLock(lockDb, owner);
  assert.equal(lock.acquired, false);
  assert.equal(lock.blockedBy, 'cron');
  // Le verrou du détenteur n'est pas modifié par la tentative refusée.
  assert.equal(lockDb.store.get(LOCK_DOC).owner, 'cron');
});

test('acquireSyncLock — reprend un verrou orphelin expiré', async () => {
  const orphanDb = createFakeDb({
    [LOCK_DOC]: { owner: 'crash', acquired_at: Date.now() - 3_600_000, expires_at: Date.now() - 600_000 },
  });
  const lock = await acquireSyncLock(orphanDb, 'run-2');
  assert.equal(lock.acquired, true);
  assert.equal(orphanDb.store.get(LOCK_DOC).owner, 'run-2');
});

test('releaseSyncLock — ne libère pas le verrou d’un autre propriétaire', async () => {
  const db = createFakeDb({
    [LOCK_DOC]: { owner: 'cron', acquired_at: Date.now(), expires_at: Date.now() + 60_000 },
  });
  await releaseSyncLock(db, 'intrus');
  assert.equal(db.store.get(LOCK_DOC).owner, 'cron');
  await releaseSyncLock(db, 'cron');
  assert.equal(db.store.has(LOCK_DOC), false);
});

test('runLockedFffSync — exécution concurrente refusée et tracée, sans toucher aux données', async () => {
  const db = createFakeDb({
    [LOCK_DOC]: { owner: 'cron', acquired_at: Date.now(), expires_at: Date.now() + 60_000 },
    [`${LEAGUE_COL}/ligue1`]: LEAGUE_DOC,
  });
  const result = await runLockedFffSync(db, 'manual-admin', 'manual');
  assert.equal(result.lockSkipped, true);
  assert.equal(result.reason, 'locked');
  assert.equal(result.updated, 0);
  assert.equal(db.store.get(FFF_SYNC_META_DOC).last_skip_reason, 'overlap');
  // Aucune écriture sur le classement : le dernier état valide reste affiché.
  assert.deepEqual(db.store.get(`${LEAGUE_COL}/ligue1`).standings, LEAGUE_DOC.standings);
});

/* ------------------------------------------------------------------ */
/* Échec de source : dernier snapshot valide conservé                  */
/* ------------------------------------------------------------------ */

test('runLockedFffSync — source indisponible : snapshot conservé, pas de fausse fraîcheur', async () => {
  const previousKey = process.env.EXTERNAL_SCORES_API_KEY;
  delete process.env.EXTERNAL_SCORES_API_KEY;
  try {
    const db = createFakeDb({ [`${LEAGUE_COL}/ligue1`]: LEAGUE_DOC });
    const result = await runLockedFffSync(db, 'cron-1', 'scheduled');

    assert.equal(result.failed > 0, true);
    assert.equal(result.updated, 0);

    const league = db.store.get(`${LEAGUE_COL}/ligue1`);
    // Le classement ET son horodatage de dernière réussite restent intacts.
    assert.deepEqual(league.standings, LEAGUE_DOC.standings);
    assert.equal(league.lastSyncAt, LEAGUE_DOC.lastSyncAt);
    assert.equal(league.sync_health, 'stale');
    assert.match(String(league.last_error), /EXTERNAL_SCORES_API_KEY/);
    assert.ok(league.last_attempt_at);

    const meta = db.store.get(FFF_SYNC_META_DOC);
    assert.equal(meta.sync_health, 'error');
    // Aucune date de succès inventée après un échec complet.
    assert.equal(meta.last_success_at, undefined);
    assert.equal(meta.schedule, 'every 3 hours');
    assert.equal(meta.last_trigger, 'scheduled');

    // Le verrou est libéré en fin d'exécution.
    assert.equal(db.store.has(LOCK_DOC), false);
    // Une exécution est journalisée.
    assert.equal(db.runs.filter((r) => r.collection === 'sync_runs').length, 1);
  } finally {
    if (previousKey === undefined) delete process.env.EXTERNAL_SCORES_API_KEY;
    else process.env.EXTERNAL_SCORES_API_KEY = previousKey;
  }
});

/* ------------------------------------------------------------------ */
/* Succès : provenance des corrections manuelles préservée             */
/* ------------------------------------------------------------------ */

function apiFootballPayload() {
  return {
    response: [
      {
        league: {
          standings: [
            [
              {
                rank: 1,
                team: { id: 85, name: 'Paris Saint-Germain' },
                points: 10,
                goalsDiff: 6,
                all: { played: 5, win: 3, draw: 1, lose: 1, goals: { for: 9, against: 3 } },
                form: 'VVN',
              },
            ],
          ],
        },
      },
    ],
  };
}

test('runLockedFffSync — succès : correction manuelle et sa provenance préservées', async () => {
  const previousKey = process.env.EXTERNAL_SCORES_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.EXTERNAL_SCORES_API_KEY = 'test-key';
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => apiFootballPayload(),
  });
  try {
    const db = createFakeDb({ [`${LEAGUE_COL}/ligue1`]: LEAGUE_DOC });
    const result = await runLockedFffSync(db, 'cron-2', 'scheduled');

    assert.equal(result.updated > 0, true);
    assert.equal(result.failed, 0);
    assert.equal(result.manualOverridesPreserved >= 1, true);

    const league = db.store.get(`${LEAGUE_COL}/ligue1`);
    const row = league.standings.find((r) => r.team_id === 'psg');
    // La valeur corrigée par l'admin n'est pas écrasée par la source (API dit 10).
    assert.equal(row.points, 13);
    assert.equal(row._manual_override.reason, 'Retrait de points confirmé par la commission');
    assert.equal(league.manual_overrides.psg.by, 'admin-test');
    assert.equal(league.sync_health, 'ok');
    assert.ok(league.lastSyncAt);

    const meta = db.store.get(FFF_SYNC_META_DOC);
    assert.ok(meta.last_success_at);
    assert.equal(meta.sync_health, 'ok');
    assert.equal(db.store.has(LOCK_DOC), false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.EXTERNAL_SCORES_API_KEY;
    else process.env.EXTERNAL_SCORES_API_KEY = previousKey;
  }
});

/* ------------------------------------------------------------------ */
/* Rate limit du rafraîchissement manuel                                */
/* ------------------------------------------------------------------ */

test('reserveManualRefresh — un seul rafraîchissement manuel par fenêtre', async () => {
  const db = createFakeDb({});
  const first = await reserveManualRefresh(db, 'admin-1');
  assert.equal(first.allowed, true);
  assert.equal(first.retryAfterSeconds, 0);

  const second = await reserveManualRefresh(db, 'admin-2');
  assert.equal(second.allowed, false);
  assert.equal(second.retryAfterSeconds > 0, true);
  assert.equal(second.retryAfterSeconds <= MANUAL_REFRESH_MIN_INTERVAL_MS / 1000, true);

  // Le premier appel a bien horodaté la réservation (traçabilité).
  const meta = db.store.get(FFF_SYNC_META_DOC);
  assert.equal(meta.last_manual_refresh_by, 'admin-1');
  assert.equal(typeof meta.last_manual_refresh_at, 'number');
});
