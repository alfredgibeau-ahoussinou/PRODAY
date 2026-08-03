import type { SubscriptionTier } from '../content/subscriptionPlans';
import type { UserRole } from '../models/User';

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
  // Recruteur / agent : pas de convocations équipe
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
