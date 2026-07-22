import type { User } from '../models/User';
import type { SponsorPricingTierId } from '../content/sponsorPricing';
import { resolveSponsorPricingTier } from './sponsorTier';

export const SPONSOR_DISCOVERY_MESSAGE_LIMIT = 10;
export const SPONSOR_DISCOVERY_ACTIVE_OFFERS = 1;
export const SPONSOR_TERRITORIAL_ACTIVE_OFFERS = 5;
export const SPONSOR_MESSAGE_WARNING_THRESHOLD = 8;

export function sponsorHasUnlimitedMessaging(
  user: Pick<User, 'role' | 'subscription_tier' | 'sponsor_tier'> | null | undefined,
): boolean {
  if (!user || user.role !== 'sponsor') return true;
  if (user.subscription_tier === 'pro') return true;
  if (user.sponsor_tier === 'territorial') return true;
  return false;
}

export function sponsorMessageLimit(
  user: Pick<User, 'role' | 'subscription_tier' | 'sponsor_tier'> | null | undefined,
): number {
  if (sponsorHasUnlimitedMessaging(user)) return Infinity;
  return SPONSOR_DISCOVERY_MESSAGE_LIMIT;
}

export function sponsorActiveOfferLimit(
  user: Pick<User, 'role' | 'subscription_tier' | 'sponsor_tier'> | null | undefined,
): number {
  if (!user || user.role !== 'sponsor') return Infinity;
  if (user.subscription_tier === 'pro') return Infinity;
  if (user.sponsor_tier === 'territorial') return SPONSOR_TERRITORIAL_ACTIVE_OFFERS;
  return SPONSOR_DISCOVERY_ACTIVE_OFFERS;
}

export type SponsorTierStatusTone = 'discovery' | 'territorial' | 'pro' | 'pending';

export function resolveSponsorTierStatus(
  user: Pick<
    User,
    'role' | 'subscription_tier' | 'sponsor_tier' | 'sponsor_approved' | 'verification_status'
  > | null | undefined,
): { label: string; detail: string; tone: SponsorTierStatusTone; tierId: SponsorPricingTierId } {
  if (!user || user.role !== 'sponsor') {
    return {
      label: 'Sponsor',
      detail: '',
      tone: 'discovery',
      tierId: 'starter',
    };
  }

  const tierId = resolveSponsorPricingTier(user);

  if (user.sponsor_approved !== true) {
    return {
      label: 'Inscription en cours',
      detail: 'Votre dossier est en validation par l’équipe partenaires (sous 48 h ouvrées).',
      tone: 'pending',
      tierId,
    };
  }

  if (tierId === 'national') {
    return {
      label: 'National Pro',
      detail: 'Offres et messagerie clubs illimitées.',
      tone: 'pro',
      tierId,
    };
  }

  if (tierId === 'territorial') {
    return {
      label: 'Territorial',
      detail: `Jusqu’à ${SPONSOR_TERRITORIAL_ACTIVE_OFFERS} offres actives · messagerie illimitée.`,
      tone: 'territorial',
      tierId,
    };
  }

  return {
    label: 'Découverte',
    detail: `${SPONSOR_DISCOVERY_ACTIVE_OFFERS} offre active · ${SPONSOR_DISCOVERY_MESSAGE_LIMIT} messages clubs / mois.`,
    tone: 'discovery',
    tierId,
  };
}
