/**
 * Parrainage — logique pure côté Cloud Functions
 * (miroir de src/utils/referralLogic.ts — garder synchronisé).
 */

export const REFERRAL_REQUIRED_FOR_REWARD = 2;
export const REFERRAL_REWARD_MONTHS = 1;

export const REFERRAL_ELIGIBLE_ROLES = [
  'player',
  'coach',
  'club',
  'recruiter',
  'agent',
  'physio',
  'sponsor',
  'organizer',
] as const;

export type ReferralEligibleRole = (typeof REFERRAL_ELIGIBLE_ROLES)[number];

export function isReferralEligibleRole(role: string | null | undefined): boolean {
  return (REFERRAL_ELIGIBLE_ROLES as readonly string[]).includes(role ?? '');
}

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferralCode(random: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]!;
  }
  return out;
}

export function isValidReferralCodeFormat(code: string): boolean {
  const normalized = normalizeReferralCode(code);
  return normalized.length >= 6 && normalized.length <= 12;
}

export function nextReferralProgress(currentProgress: number): {
  progress: number;
  rewardEarned: boolean;
} {
  const safe = Math.max(0, Math.min(REFERRAL_REQUIRED_FOR_REWARD - 1, Math.floor(currentProgress)));
  const next = safe + 1;
  if (next >= REFERRAL_REQUIRED_FOR_REWARD) {
    return { progress: 0, rewardEarned: true };
  }
  return { progress: next, rewardEarned: false };
}

export function extendSubscriptionPeriodEnd(
  currentEnd: Date | string | null | undefined,
  fromDate: Date,
  months: number = REFERRAL_REWARD_MONTHS
): Date {
  let base = fromDate;
  if (currentEnd) {
    const end = currentEnd instanceof Date ? currentEnd : new Date(currentEnd);
    if (!Number.isNaN(end.getTime()) && end.getTime() > fromDate.getTime()) {
      base = end;
    }
  }
  const result = new Date(base.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

export function referralDocId(referrerUid: string, inviteeUid: string): string {
  return `${referrerUid}_${inviteeUid}`;
}
