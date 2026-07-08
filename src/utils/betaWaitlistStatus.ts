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

export const BETA_WAITLIST_STATUS_LABELS: Record<BetaWaitlistStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
};

export function buildBetaProgrammeUrl(siteUrl: string, accessToken?: string): string {
  const site = siteUrl.replace(/\/$/, '');
  if (accessToken?.trim()) {
    return `${site}/beta/programme?token=${encodeURIComponent(accessToken.trim())}`;
  }
  return `${site}/beta/programme`;
}
