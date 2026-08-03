import type { SubscriptionTier } from '../content/subscriptionPlans';
import type { User, UserRole } from '../models/User';

/**
 * Convocations : feature premium Pôle Staff (coach).
 * Le Club freemium n'a plus la gestion des convocations.
 * Le calendrier structure est porté par le Staff.
 */
export function canManageConvocations(input: {
  role: UserRole;
  tier: SubscriptionTier;
}): boolean {
  if (input.role === 'coach' && input.tier === 'pro') return true;
  // Recruteur / agent / club : pas de convocations équipe
  return false;
}

/** Lecture calendrier structure — Staff (coach/recruiter) ; club en lecture seule si pro. */
export function canViewStructureCalendar(input: {
  role: UserRole;
  tier: SubscriptionTier;
}): boolean {
  if (input.role === 'coach' || input.role === 'recruiter') return true;
  if (input.role === 'club' && input.tier === 'pro') return true;
  return false;
}

/** Édition calendrier structure — Pôle Staff uniquement. */
export function canEditStructureCalendar(input: {
  role: UserRole;
  tier: SubscriptionTier;
}): boolean {
  return input.role === 'coach' && input.tier === 'pro';
}

export function clubFreeTierIncludesConvocations(): boolean {
  return false;
}

export function subscriptionTierOf(
  user: Pick<User, 'subscription_tier'> | null | undefined,
): SubscriptionTier {
  return user?.subscription_tier === 'pro' ? 'pro' : 'free';
}

/** Gate UI/service — convocations (création / gestion staff). */
export function userCanManageConvocations(
  user: Pick<User, 'role' | 'subscription_tier'> | null | undefined,
): boolean {
  if (!user) return false;
  return canManageConvocations({ role: user.role, tier: subscriptionTierOf(user) });
}

/** Gate UI — édition calendrier structure (Staff pro). */
export function userCanEditStructureCalendar(
  user: Pick<User, 'role' | 'subscription_tier'> | null | undefined,
): boolean {
  if (!user) return false;
  return canEditStructureCalendar({ role: user.role, tier: subscriptionTierOf(user) });
}
