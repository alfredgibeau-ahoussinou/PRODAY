import type { User } from '../models/User';
import { isSponsorCampaignAllowed } from '../utils/sponsorCampaignGate';

function sponsor(overrides: Partial<User> = {}): User {
  return {
    uid: 's1',
    display_name: 'Sponsor Co',
    email: 's@test.com',
    role: 'sponsor',
    is_verified: true,
    verification_status: 'VERIFIED',
    profile: {},
    sponsor_approved: true,
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    ...overrides,
  };
}

describe('sponsorCampaignGate', () => {
  it('autorise un sponsor vérifié et approuvé', () => {
    expect(isSponsorCampaignAllowed(sponsor()).allowed).toBe(true);
  });

  it('bloque si non approuvé admin', () => {
    const gate = isSponsorCampaignAllowed(
      sponsor({ sponsor_approved: false }),
    );
    expect(gate.allowed).toBe(false);
    expect(gate.reasonKey).toBe('sponsor.gate.approval');
  });

  it('bloque si vérification en attente', () => {
    const gate = isSponsorCampaignAllowed(
      sponsor({ verification_status: 'PENDING', sponsor_approved: true }),
    );
    expect(gate.allowed).toBe(false);
    expect(gate.reasonKey).toBe('sponsor.gate.verification');
  });
});
