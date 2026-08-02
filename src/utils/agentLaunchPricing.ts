/**
 * Offre de lancement agents :
 * 19,99 €/mois pour les 20 premiers abonnés, puis 29,99 €/mois.
 */

export const AGENT_LAUNCH_OFFER = {
  launchMonthlyEur: 19.99,
  standardMonthlyEur: 29.99,
  launchSeatLimit: 20,
  planId: 'agent_elite' as const,
} as const;

export type AgentPricingTier = 'launch' | 'standard';

export function resolveAgentMonthlyPrice(activeLaunchSubscribers: number): {
  monthlyEur: number;
  tier: AgentPricingTier;
  seatsRemaining: number;
} {
  const seats = Math.max(0, AGENT_LAUNCH_OFFER.launchSeatLimit - activeLaunchSubscribers);
  if (activeLaunchSubscribers < AGENT_LAUNCH_OFFER.launchSeatLimit) {
    return {
      monthlyEur: AGENT_LAUNCH_OFFER.launchMonthlyEur,
      tier: 'launch',
      seatsRemaining: seats,
    };
  }
  return {
    monthlyEur: AGENT_LAUNCH_OFFER.standardMonthlyEur,
    tier: 'standard',
    seatsRemaining: 0,
  };
}

/** Un agent déjà en offre lancement conserve le tarif jusqu'à résiliation. */
export function agentPriceForSubscriber(input: {
  activeLaunchSubscribers: number;
  /** Ce compte bénéficie déjà du tarif lancement (grandfather). */
  hasLaunchGrandfather?: boolean;
}): { monthlyEur: number; tier: AgentPricingTier } {
  if (input.hasLaunchGrandfather) {
    return {
      monthlyEur: AGENT_LAUNCH_OFFER.launchMonthlyEur,
      tier: 'launch',
    };
  }
  const resolved = resolveAgentMonthlyPrice(input.activeLaunchSubscribers);
  return { monthlyEur: resolved.monthlyEur, tier: resolved.tier };
}

export function isAgentLaunchOfferAvailable(activeLaunchSubscribers: number): boolean {
  return activeLaunchSubscribers < AGENT_LAUNCH_OFFER.launchSeatLimit;
}
