import {
  REFERRAL_REQUIRED_FOR_REWARD,
  REFERRAL_REWARD_MONTHS,
  buildReferralLink,
  extendSubscriptionPeriodEnd,
  extractReferralCodeFromUrl,
  generateReferralCode,
  isReferralEligibleRole,
  isValidReferralCodeFormat,
  nextReferralProgress,
  normalizeReferralCode,
  referralProgressLabel,
} from '../utils/referralLogic';

describe('referralLogic', () => {
  it('normalise et valide un code', () => {
    expect(normalizeReferralCode(' ab-12cd ')).toBe('AB12CD');
    expect(isValidReferralCodeFormat('ABCDEF')).toBe(true);
    expect(isValidReferralCodeFormat('abc')).toBe(false);
  });

  it('génère un code de 8 caractères', () => {
    let i = 0;
    const code = generateReferralCode(() => {
      i += 0.01;
      return i % 1;
    });
    expect(code).toHaveLength(8);
    expect(isValidReferralCodeFormat(code)).toBe(true);
  });

  it('incrémente 0/2 → 1/2 sans récompense', () => {
    expect(nextReferralProgress(0)).toEqual({ progress: 1, rewardEarned: false });
    expect(referralProgressLabel(1)).toBe('1/2');
  });

  it('à 1/2 → 2e filleul déclenche récompense et reset 0/2', () => {
    expect(nextReferralProgress(1)).toEqual({ progress: 0, rewardEarned: true });
    expect(REFERRAL_REQUIRED_FOR_REWARD).toBe(2);
    expect(REFERRAL_REWARD_MONTHS).toBe(1);
  });

  it('prolonge period_end depuis la date future existante', () => {
    const from = new Date('2026-08-01T12:00:00Z');
    const current = '2026-09-15T00:00:00.000Z';
    const next = extendSubscriptionPeriodEnd(current, from, 1);
    expect(next.toISOString()).toBe('2026-10-15T00:00:00.000Z');
  });

  it('prolonge depuis now si period_end passé ou absent', () => {
    const from = new Date('2026-08-03T10:00:00Z');
    const expired = '2026-07-01T00:00:00.000Z';
    const next = extendSubscriptionPeriodEnd(expired, from, 1);
    expect(next.getUTCFullYear()).toBe(2026);
    expect(next.getUTCMonth()).toBe(8); // septembre
  });

  it('extrait ref depuis URL web', () => {
    expect(extractReferralCodeFromUrl('https://proday75.fr/?ref=ABCD2345')).toBe('ABCD2345');
    expect(extractReferralCodeFromUrl('proday://signup?ref=ABCD2345')).toBe('ABCD2345');
    expect(extractReferralCodeFromUrl('https://proday75.fr/')).toBeNull();
  });

  it('construit le lien de partage', () => {
    expect(buildReferralLink('abcd2345')).toBe('https://proday75.fr/?ref=ABCD2345');
  });

  it('reconnaît les rôles éligibles (tous les pôles sauf supporter)', () => {
    expect(isReferralEligibleRole('player')).toBe(true);
    expect(isReferralEligibleRole('physio')).toBe(true);
    expect(isReferralEligibleRole('organizer')).toBe(true);
    expect(isReferralEligibleRole('supporter')).toBe(false);
  });
});
