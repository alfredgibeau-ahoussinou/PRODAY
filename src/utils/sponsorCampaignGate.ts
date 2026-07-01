import type { User } from '../models/User';

export type SponsorCampaignGateResult = {
  allowed: boolean;
  reasonKey?: string;
};

/** Bloque création campagne si compte sponsor non validé admin. */
export function isSponsorCampaignAllowed(
  profile: User | null | undefined,
): SponsorCampaignGateResult {
  if (!profile || profile.role !== 'sponsor') {
    return { allowed: false, reasonKey: 'sponsor.gate.notSponsor' };
  }

  const vs = profile.verification_status;
  if (vs !== 'VERIFIED' && vs !== 'NOT_REQUIRED') {
    return { allowed: false, reasonKey: 'sponsor.gate.verification' };
  }

  if (profile.sponsor_approved !== true) {
    return { allowed: false, reasonKey: 'sponsor.gate.approval' };
  }

  return { allowed: true };
}
