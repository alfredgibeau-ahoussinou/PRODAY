import { isV3SubScreenEnabled } from '../hooks/useV3SubScreen';
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

describe('Phase 14 — clôture shell V3 sous-écrans', () => {
  const prevV3 = process.env.EXPO_PUBLIC_V3_SHELL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_V3_SHELL = '1';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_V3_SHELL = prevV3;
  });

  it('désactive le shell sans flag V3', () => {
    process.env.EXPO_PUBLIC_V3_SHELL = '';
    const coach = baseUser({ uid: 'c1', role: 'coach' });
    expect(isV3SubScreenEnabled(coach, 'staff')).toBe(false);
  });

  it('active staff pour coach/club/agent', () => {
    expect(isV3SubScreenEnabled(baseUser({ uid: 'c1', role: 'coach' }), 'staff')).toBe(true);
    expect(isV3SubScreenEnabled(baseUser({ uid: 'a1', role: 'agent' }), 'staff')).toBe(true);
    expect(isV3SubScreenEnabled(baseUser({ uid: 'cl1', role: 'club' }), 'staff')).toBe(true);
  });

  it('exclut joueur, physio et sponsor du mode staff', () => {
    expect(isV3SubScreenEnabled(baseUser({ uid: 'p1', role: 'player' }), 'staff')).toBe(false);
    expect(isV3SubScreenEnabled(baseUser({ uid: 'ph1', role: 'physio' }), 'staff')).toBe(false);
    expect(isV3SubScreenEnabled(baseUser({ uid: 'sp1', role: 'sponsor' }), 'staff')).toBe(false);
  });

  it('audience player réservée aux joueurs', () => {
    expect(isV3SubScreenEnabled(baseUser({ uid: 'p1', role: 'player' }), 'player')).toBe(true);
    expect(isV3SubScreenEnabled(baseUser({ uid: 'c1', role: 'coach' }), 'player')).toBe(false);
  });

  it('audience signed active pour tout profil connecté', () => {
    expect(isV3SubScreenEnabled(baseUser({ uid: 'p1', role: 'player' }), 'signed')).toBe(true);
    expect(isV3SubScreenEnabled(baseUser({ uid: 'c1', role: 'coach' }), 'signed')).toBe(true);
  });

  it('retourne false sans profil', () => {
    expect(isV3SubScreenEnabled(null, 'staff')).toBe(false);
    expect(isV3SubScreenEnabled(undefined, 'signed')).toBe(false);
  });
});
