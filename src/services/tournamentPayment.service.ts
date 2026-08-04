import { callFunction } from '../lib/firebaseFunctions';

/** Démarre le Checkout Stripe pour une inscription tournoi payante. */
export async function startTournamentEntryPayment(
  tournamentId: string,
  registrationId: string
): Promise<{ url: string; sessionId: string }> {
  return callFunction<
    { tournamentId: string; registrationId: string },
    { url: string; sessionId: string }
  >('createTournamentCheckoutSession', { tournamentId, registrationId });
}
