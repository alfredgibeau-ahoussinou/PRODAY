import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extendSubscriptionPeriodEnd,
  isReferralEligibleRole,
  nextReferralProgress,
  normalizeReferralCode,
} from '../lib/referralLogic.js';

test('nextReferralProgress resets after reward', () => {
  assert.deepEqual(nextReferralProgress(0), { progress: 1, rewardEarned: false });
  assert.deepEqual(nextReferralProgress(1), { progress: 0, rewardEarned: true });
});

test('extendSubscriptionPeriodEnd extends from future end', () => {
  const from = new Date('2026-08-01T12:00:00Z');
  const next = extendSubscriptionPeriodEnd('2026-09-15T00:00:00.000Z', from, 1);
  assert.equal(next.toISOString(), '2026-10-15T00:00:00.000Z');
});

test('normalize and role eligibility', () => {
  assert.equal(normalizeReferralCode(' ab-12 '), 'AB12');
  assert.equal(isReferralEligibleRole('player'), true);
  assert.equal(isReferralEligibleRole('supporter'), false);
});
