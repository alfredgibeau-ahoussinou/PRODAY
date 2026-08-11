import type { SubscriptionTier } from '../content/subscriptionPlans';
import type { ClubOfferFeatureId, ClubOfferId } from '../content/clubOffers';
import {
  CLUB_OFFERS,
  clubOfferFromStorePlanId,
  clubOfferHasFeature,
} from '../content/clubOffers';
import type { User, UserRole } from '../models/User';

/**
 * Gates Club / Coach — alignés sur le modèle Amateur / Essentiel / Tout inclus.
 * Tout inclus : coachs inclus. Essentiel / Amateur : coach individuel pour Smart Tactics.
 */

export function resolveClubOfferId(
  user: Pick<User, 'role' | 'subscription_tier' | 'subscription_plan_id'> | null | undefined,
): ClubOfferId | null {
  if (!user || user.role !== 'club') return null;
  if (user.subscription_tier !== 'pro') return null;
  return clubOfferFromStorePlanId(user.subscription_plan_id ?? 'club_pro') ?? 'club_essentiel';
}

/** Feature catalogue incluse dans la formule club active. */
export function userHasClubFeature(
  user: Pick<User, 'role' | 'subscription_tier' | 'subscription_plan_id'> | null | undefined,
  feature: ClubOfferFeatureId,
): boolean {
  const offerId = resolveClubOfferId(user);
  if (!offerId) return false;
  return clubOfferHasFeature(offerId, feature);
}

/** Assistant IA avancé (suggestions enrichies) — Tout inclus / Pro + Veo. */
export function userHasClubAiAssistant(
  user: Pick<User, 'role' | 'subscription_tier' | 'subscription_plan_id'> | null | undefined,
): boolean {
  return userHasClubFeature(user, 'ai_assistant');
}

export function canManageConvocations(input: {
  role: UserRole;
  tier: SubscriptionTier;
  clubOfferId?: ClubOfferId | null;
  /** Club Premium couvre les coachs — convocs autorisées côté coach même sans plan perso. */
  clubCoversCoach?: boolean;
}): boolean {
  if (input.role === 'coach') {
    if (input.tier === 'pro' || input.clubCoversCoach) return true;
    return false;
  }
  if (input.role === 'club' && input.tier === 'pro') {
    const offer = input.clubOfferId ?? 'club_essentiel';
    return clubOfferHasFeature(offer, 'convocations');
  }
  return false;
}

/** Lecture calendrier structure. */
export function canViewStructureCalendar(input: {
  role: UserRole;
  tier: SubscriptionTier;
}): boolean {
  if (input.role === 'coach' || input.role === 'recruiter' || input.role === 'organizer') {
    return true;
  }
  if (input.role === 'club' && input.tier === 'pro') return true;
  return false;
}

/** Édition calendrier — coach pro (ou couvert Premium) + club avec offre calendrier. */
export function canEditStructureCalendar(input: {
  role: UserRole;
  tier: SubscriptionTier;
  clubOfferId?: ClubOfferId | null;
  clubCoversCoach?: boolean;
}): boolean {
  if (input.role === 'coach' && (input.tier === 'pro' || input.clubCoversCoach)) {
    return true;
  }
  if (input.role === 'club' && input.tier === 'pro') {
    const offer = input.clubOfferId ?? 'club_essentiel';
    return clubOfferHasFeature(offer, 'calendar');
  }
  return false;
}

/** Smart Tactics : coach pro, ou club Premium (coachs inclus). */
export function canAccessSmartTactics(input: {
  role: UserRole;
  tier: SubscriptionTier;
  clubCoversCoach?: boolean;
}): boolean {
  if (input.role === 'coach' && (input.tier === 'pro' || input.clubCoversCoach)) {
    return true;
  }
  return false;
}

export function clubFreeTierIncludesConvocations(): boolean {
  return false;
}

export function subscriptionTierOf(
  user: Pick<User, 'subscription_tier'> | null | undefined,
): SubscriptionTier {
  return user?.subscription_tier === 'pro' ? 'pro' : 'free';
}

/** Gate UI/service — convocations (création / gestion). */
export function userCanManageConvocations(
  user: Pick<User, 'role' | 'subscription_tier' | 'subscription_plan_id'> | null | undefined,
  opts?: { clubCoversCoach?: boolean },
): boolean {
  if (!user) return false;
  return canManageConvocations({
    role: user.role,
    tier: subscriptionTierOf(user),
    clubOfferId: resolveClubOfferId(user),
    clubCoversCoach: opts?.clubCoversCoach,
  });
}

/** Gate UI — édition calendrier structure. */
export function userCanEditStructureCalendar(
  user: Pick<User, 'role' | 'subscription_tier' | 'subscription_plan_id'> | null | undefined,
  opts?: { clubCoversCoach?: boolean },
): boolean {
  if (!user) return false;
  return canEditStructureCalendar({
    role: user.role,
    tier: subscriptionTierOf(user),
    clubOfferId: resolveClubOfferId(user),
    clubCoversCoach: opts?.clubCoversCoach,
  });
}

export function userCanAccessSmartTactics(
  user: Pick<User, 'role' | 'subscription_tier'> | null | undefined,
  opts?: { clubCoversCoach?: boolean },
): boolean {
  if (!user) return false;
  return canAccessSmartTactics({
    role: user.role,
    tier: subscriptionTierOf(user),
    clubCoversCoach: opts?.clubCoversCoach,
  });
}

/**
 * Résout si le compte Club (role club dans les membres) a une offre qui inclut les coachs.
 * À appeler avec `usersService.listMembersByClubId` côté UI.
 */
export function resolveClubCoversCoachFromMembers(members: User[]): boolean {
  const clubAccount = members.find((m) => m.role === 'club');
  if (!clubAccount || clubAccount.subscription_tier !== 'pro') return false;
  const offerId =
    clubOfferFromStorePlanId(clubAccount.subscription_plan_id ?? 'club_pro') ?? 'club_essentiel';
  return CLUB_OFFERS[offerId]?.coachesIncluded === true;
}
