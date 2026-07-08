import {
  resolveBetaWaitlistStatus,
  BETA_WAITLIST_STATUS_LABELS,
  buildBetaProgrammeUrl,
} from '../utils/betaWaitlistStatus';

describe('betaWaitlistStatus', () => {
  it('retourne pending par défaut', () => {
    expect(resolveBetaWaitlistStatus({})).toBe('pending');
  });

  it('retourne approved si welcome_email_sent (migration)', () => {
    expect(resolveBetaWaitlistStatus({ welcome_email_sent: true })).toBe('approved');
  });

  it('respecte le champ status explicite', () => {
    expect(resolveBetaWaitlistStatus({ status: 'rejected', welcome_email_sent: true })).toBe(
      'rejected',
    );
    expect(resolveBetaWaitlistStatus({ status: 'pending' })).toBe('pending');
    expect(resolveBetaWaitlistStatus({ status: 'approved' })).toBe('approved');
  });

  it('expose les libellés FR', () => {
    expect(BETA_WAITLIST_STATUS_LABELS.pending).toBe('En attente');
    expect(BETA_WAITLIST_STATUS_LABELS.approved).toBe('Approuvé');
  });

  it('construit l’URL programme bêta', () => {
    expect(buildBetaProgrammeUrl('https://proday75.fr/', 'abc123')).toBe(
      'https://proday75.fr/beta/programme?token=abc123',
    );
  });
});
