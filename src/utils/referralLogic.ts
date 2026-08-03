/** Parrainage — logique pure (progression, récompense, codes). */

export const REFERRAL_REQUIRED_FOR_REWARD = 2;
export const REFERRAL_REWARD_MONTHS = 1;

/** Pôles éligibles au parrainage (pas supporter). */
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

export type ReferralInviteStatus = 'signed_up' | 'subscribed';

export function isReferralEligibleRole(role: string | null | undefined): boolean {
  return REFERRAL_ELIGIBLE_ROLES.includes(role as ReferralEligibleRole);
}

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Génère un code court (8 caractères), sans caractères ambigus. */
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

/**
 * Après qu’un filleul s’abonne : incrémente la progression.
 * À 2/2 → récompense et reset à 0/2.
 */
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

export function referralProgressLabel(progress: number): string {
  const safe = Math.max(0, Math.min(REFERRAL_REQUIRED_FOR_REWARD, Math.floor(progress)));
  return `${safe}/${REFERRAL_REQUIRED_FOR_REWARD}`;
}

/**
 * Prolonge la fin de période d’1 mois (ou N).
 * Si l’abonnement est déjà actif dans le futur, on part de period_end ;
 * sinon on part de `fromDate` (maintenant).
 */
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

export function buildReferralLink(
  code: string,
  baseUrl = 'https://proday75.fr'
): string {
  const normalized = normalizeReferralCode(code);
  const root = baseUrl.replace(/\/$/, '');
  return `${root}/?ref=${encodeURIComponent(normalized)}`;
}

/** Extrait `ref` depuis une URL web ou deep link `proday://…?ref=`. */
export function extractReferralCodeFromUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
      ? trimmed
      : `https://dummy${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    const parsed = new URL(withProtocol);
    const raw = parsed.searchParams.get('ref') ?? parsed.searchParams.get('referral');
    if (!raw) return null;
    const normalized = normalizeReferralCode(raw);
    return isValidReferralCodeFormat(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function referralDocId(referrerUid: string, inviteeUid: string): string {
  return `${referrerUid}_${inviteeUid}`;
}
