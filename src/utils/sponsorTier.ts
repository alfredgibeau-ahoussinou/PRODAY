import type { User } from '../models/User';
import type { SponsorPricingTierId } from '../content/sponsorPricing';

/** Formule Territorial active (validation admin). */
export function isTerritorialSponsorActive(
  user: Pick<User, 'sponsor_tier' | 'role'> | null | undefined
): boolean {
  return user?.role === 'sponsor' && user.sponsor_tier === 'territorial';
}

/** Résout la formule sponsor affichée (starter / territorial / national). */
export function resolveSponsorPricingTier(
  user: Pick<User, 'sponsor_tier' | 'subscription_tier' | 'role'> | null | undefined
): SponsorPricingTierId {
  if (user?.subscription_tier === 'pro') return 'national';
  if (isTerritorialSponsorActive(user)) return 'territorial';
  return 'starter';
}
