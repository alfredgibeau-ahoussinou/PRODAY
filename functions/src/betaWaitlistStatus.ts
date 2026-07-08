export type BetaWaitlistStatus = 'pending' | 'approved' | 'rejected';

/** Statut effectif — rétrocompatibilité `welcome_email_sent` sans champ `status`. */
export function resolveBetaWaitlistStatus(data: Record<string, unknown>): BetaWaitlistStatus {
  const status = data.status;
  if (status === 'approved' || status === 'pending' || status === 'rejected') {
    return status;
  }
  if (data.welcome_email_sent === true) return 'approved';
  return 'pending';
}

export function isBetaEntryApproved(data: Record<string, unknown>): boolean {
  return resolveBetaWaitlistStatus(data) === 'approved';
}
