import { isSubScreenShellEnabled } from '../hooks/useSubScreenShell';
import type { User } from '../models/User';

const baseUser = (overrides: Partial<User> & Pick<User, 'uid' | 'role'>): User => ({
  display_name: 'Test',
  email: 't@test.com',
  is_verified: true,
  verification_status: 'VERIFIED',
  profile: {},
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  ...overrides,
});

describe('Sub-screen shell audience', () => {
  it('active staff pour coach/club/agent', () => {
    expect(isSubScreenShellEnabled(baseUser({ uid: 'c1', role: 'coach' }), 'staff')).toBe(true);
    expect(isSubScreenShellEnabled(baseUser({ uid: 'a1', role: 'agent' }), 'staff')).toBe(true);
    expect(isSubScreenShellEnabled(baseUser({ uid: 'cl1', role: 'club' }), 'staff')).toBe(true);
  });

  it('exclut joueur, physio et sponsor du mode staff', () => {
    expect(isSubScreenShellEnabled(baseUser({ uid: 'p1', role: 'player' }), 'staff')).toBe(false);
    expect(isSubScreenShellEnabled(baseUser({ uid: 'ph1', role: 'physio' }), 'staff')).toBe(false);
    expect(isSubScreenShellEnabled(baseUser({ uid: 'sp1', role: 'sponsor' }), 'staff')).toBe(false);
  });

  it('audience player réservée aux joueurs', () => {
    expect(isSubScreenShellEnabled(baseUser({ uid: 'p1', role: 'player' }), 'player')).toBe(true);
    expect(isSubScreenShellEnabled(baseUser({ uid: 'c1', role: 'coach' }), 'player')).toBe(false);
  });

  it('audience signed active pour tout profil connecté', () => {
    expect(isSubScreenShellEnabled(baseUser({ uid: 'p1', role: 'player' }), 'signed')).toBe(true);
    expect(isSubScreenShellEnabled(baseUser({ uid: 'c1', role: 'coach' }), 'signed')).toBe(true);
  });

  it('retourne false sans profil', () => {
    expect(isSubScreenShellEnabled(null, 'staff')).toBe(false);
    expect(isSubScreenShellEnabled(undefined, 'signed')).toBe(false);
  });
});
