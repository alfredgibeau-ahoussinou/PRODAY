import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBackfillPatch,
} from '../lib/membershipBackfill.js';

const membership = (over = {}) => ({
  player_uid: 'u1',
  club_id: 'club-1',
  role: 'player',
  ...over,
});

test('backfill — joueur approuvé sans club → patch club + role player', () => {
  const patch = computeBackfillPatch(membership(), { role: 'player', profile: {} });
  assert.ok(patch);
  assert.equal(patch.profile.club_id, 'club-1');
  assert.equal(patch.role, 'player');
});

test('backfill — coach approuvé → role user rehaussé à coach', () => {
  const patch = computeBackfillPatch(membership({ role: 'coach' }), { role: 'player', profile: {} });
  assert.ok(patch);
  assert.equal(patch.role, 'coach');
});

test('backfill — parent approuvé reste parent', () => {
  const patch = computeBackfillPatch(membership({ role: 'parent' }), { role: 'parent', profile: {} });
  assert.ok(patch);
  assert.equal(patch.role, 'parent');
});

test('backfill — parent avec adhésion joueur licenciée → devient player', () => {
  const patch = computeBackfillPatch(membership({ role: 'player' }), { role: 'parent', profile: {} });
  assert.ok(patch);
  assert.equal(patch.role, 'player');
});

test('backfill — idempotent : sentinelle déjà posée → null', () => {
  const patch = computeBackfillPatch(membership(), {
    role: 'player',
    profile: { club_id: 'club-1', membership_backfilled_at: { seconds: 1 } },
  });
  assert.equal(patch, null);
});

test('backfill — club existant différent → jamais écrasé', () => {
  const patch = computeBackfillPatch(membership(), {
    role: 'player',
    profile: { club_id: 'club-autre' },
  });
  assert.equal(patch, null);
});

test('backfill — club identique déjà présent → patch idempotent (sentinelle seule ajoutée)', () => {
  const patch = computeBackfillPatch(membership(), {
    role: 'player',
    profile: { club_id: 'club-1' },
  });
  assert.ok(patch);
  assert.equal(patch.profile.club_id, 'club-1');
});

test('backfill — clubs démo exclus', () => {
  assert.equal(
    computeBackfillPatch(membership({ club_id: 'demo-club' }), { role: 'player', profile: {} }),
    null,
  );
  assert.equal(
    computeBackfillPatch(membership({ club_id: 'club-demo' }), { role: 'player', profile: {} }),
    null,
  );
});

test('backfill — données manquantes → null sans crash', () => {
  assert.equal(computeBackfillPatch(null, null), null);
  assert.equal(computeBackfillPatch(membership({ player_uid: undefined }), { role: 'player' }), null);
  assert.equal(computeBackfillPatch(membership({ club_id: undefined }), { role: 'player' }), null);
  assert.equal(computeBackfillPatch(membership(), null), null);
});

test('backfill — catégorie reportée quand présente', () => {
  const patch = computeBackfillPatch(membership({ category: 'U15' }), { role: 'player', profile: {} });
  assert.ok(patch);
  assert.equal(patch.profile.club_id, 'club-1');
});
