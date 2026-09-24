#!/usr/bin/env node
/**
 * État de la synchronisation FFF (lecture seule).
 *
 * Affiche, sans jamais écrire :
 *  - la méta de planification `fff_league_standings/_sync_meta` (dernière réussite,
 *    dernière tentative, santé, erreurs, trigger) ;
 *  - les derniers passages du journal `sync_runs` (avec leur origine scheduled/manual) ;
 *  - l'état par compétition : horodatage du dernier snapshot valide, `sync_health`,
 *    message d'erreur, présence de corrections manuelles ;
 *  - l'âge du dernier succès par rapport à la cadence de 3 h (obsolète au-delà de 2 cadences).
 *
 * Usage : `npm run fff:status` (credentials : variables d'environnement Google
 * standard, ou `gcloud auth application-default login`).
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'proday-155b0';
const META_DOC = 'fff_league_standings/_sync_meta';
const SYNC_INTERVAL_MS = 3 * 60 * 60 * 1000;
const STALE_AFTER_MS = SYNC_INTERVAL_MS * 2 + 30 * 60 * 1000;

function age(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

function toIso(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  return null;
}

async function main() {
  const app = initializeApp({ projectId: PROJECT_ID, credential: applicationDefault() });
  const db = getFirestore(app);

  const metaSnap = await db.doc(META_DOC).get();
  const meta = metaSnap.data() ?? {};
  const lastSuccess = toIso(meta.last_success_at);
  const successAgeMs = lastSuccess ? Date.now() - new Date(lastSuccess).getTime() : null;
  const stale = successAgeMs === null || successAgeMs > STALE_AFTER_MS;

  console.log(`Projet            : ${PROJECT_ID}`);
  console.log(`Cadence attendue  : toutes les 3 h (${META_DOC}.schedule = ${meta.schedule ?? 'inconnu'})`);
  console.log(`Dernière réussite : ${lastSuccess ?? 'jamais'} ${age(lastSuccess) ? `(${age(lastSuccess)})` : ''}`);
  console.log(`Dernière tentative: ${toIso(meta.last_attempt_at) ?? 'inconnue'} (origine : ${meta.last_trigger ?? 'inconnue'})`);
  console.log(`Santé méta        : ${meta.sync_health ?? 'inconnue'}${stale ? '  ⚠ OBSOLÈTE (> 2 cadences)' : ''}`);
  if (meta.last_skipped_at) {
    console.log(`Dernier refus     : ${toIso(meta.last_skipped_at)} — verrou tenu par ${meta.last_skip_owner ?? '?'}`);
  }
  if (meta.last_error) console.log(`Dernière erreur   : ${meta.last_error}`);

  const runsSnap = await db
    .collection('sync_runs')
    .orderBy('ran_at', 'desc')
    .limit(5)
    .get();
  console.log('\nDerniers passages (sync_runs) :');
  if (runsSnap.empty) {
    console.log('  (aucun) — la planification n’a encore rien exécuté');
  } else {
    runsSnap.docs.forEach((docSnap) => {
      const run = docSnap.data();
      console.log(
        `  ${run.ran_at ?? toIso(run.server_time) ?? docSnap.id} · ${run.trigger ?? '?'} · maj=${run.updated ?? 0} échecs=${run.failed ?? 0} ignorés=${run.skipped ?? 0} corrections préservées=${run.manualOverridesPreserved ?? 0}`,
      );
      (run.errors ?? []).slice(0, 3).forEach((error) => console.log(`      erreur: ${error}`));
    });
  }

  const leaguesSnap = await db.collection('fff_league_standings').limit(60).get();
  const leagues = [];
  leaguesSnap.forEach((docSnap) => {
    if (docSnap.id.startsWith('_')) return;
    const data = docSnap.data();
    leagues.push({
      id: docSnap.id,
      name: data.name ?? docSnap.id,
      lastSyncAt: toIso(data.lastSyncAt),
      health: data.sync_health ?? (data.syncStatus === 'live' ? 'ok' : 'inconnue'),
      rows: Array.isArray(data.standings) ? data.standings.length : 0,
      overrides: data.manual_overrides ? Object.keys(data.manual_overrides).length : 0,
      error: data.last_error ?? null,
    });
  });
  leagues.sort((a, b) => a.id.localeCompare(b.id));

  console.log('\nCompétitions (snapshot conservé si la source échoue) :');
  leagues.forEach((league) => {
    const staleLeague =
      !league.lastSyncAt || Date.now() - new Date(league.lastSyncAt).getTime() > STALE_AFTER_MS;
    console.log(
      `  ${league.id.padEnd(14)} ${String(league.rows).padStart(3)} lignes · ${league.health.padEnd(11)} · dernier succès : ${league.lastSyncAt ?? 'jamais'} ${age(league.lastSyncAt) ?? ''}${staleLeague ? ' ⚠' : ''}${league.overrides ? ` · ${league.overrides} correction(s) manuelle(s)` : ''}`,
    );
    if (league.error) console.log(`      ↳ ${league.error}`);
  });
}

main().catch((error) => {
  console.error('Lecture impossible :', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
