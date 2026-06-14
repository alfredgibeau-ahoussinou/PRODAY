jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  getEffectiveRoleForProductLine,
  getProductLineMismatchMessage,
  getSessionProfile,
  getUserProductLine,
  profileMatchesActiveLine,
} from '../utils/productLineAccess';
import type { User } from '../models/User';

const baseUser = {
  uid: 'u1',
  display_name: 'Test',
  email: 't@test.com',
  role: 'player' as const,
  is_verified: false,
  verification_status: 'NOT_REQUIRED' as const,
  profile: {},
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
};

describe('productLineAccess', () => {
  it('lit product_line explicite', () => {
    const user = { ...baseUser, product_line: 'woman' as const };
    expect(getUserProductLine(user)).toBe('woman');
  });

  it('déduit woman depuis app_space legacy', () => {
    const user = { ...baseUser, app_space: 'women' as const };
    expect(getUserProductLine(user)).toBe('woman');
  });

  it('compte homme par défaut', () => {
    expect(getUserProductLine(baseUser as User)).toBe('homme');
  });

  it('déduit sante depuis rôle physio', () => {
    const physio = { ...baseUser, role: 'physio' as const } as User;
    expect(getUserProductLine(physio)).toBe('sante');
  });

  it('déduit pro depuis rôle coach', () => {
    const coach = { ...baseUser, role: 'coach' as const } as User;
    expect(getUserProductLine(coach)).toBe('pro');
  });

  it('déduit pro depuis rôle club ou organisateur', () => {
    const club = { ...baseUser, role: 'club' as const } as User;
    expect(getUserProductLine(club)).toBe('pro');
  });

  it('refuse connexion cross-version', () => {
    const womanUser = { ...baseUser, product_line: 'woman' as const } as User;
    expect(profileMatchesActiveLine(womanUser, 'homme')).toBe(false);
    expect(getProductLineMismatchMessage('woman', 'homme')).toMatch(/ProDay Woman/);
    expect(getProductLineMismatchMessage('homme', 'woman')).toMatch(/Pro Day Man/);
  });

  it('autorise le compte test sur tous les pôles', () => {
    const testUser = {
      ...baseUser,
      email: 'alfredgibeauahoussinou@gmail.com',
      product_line: 'homme' as const,
    } as User;
    expect(profileMatchesActiveLine(testUser, 'homme')).toBe(true);
    expect(profileMatchesActiveLine(testUser, 'woman')).toBe(true);
    expect(profileMatchesActiveLine(testUser, 'pro')).toBe(true);
    expect(profileMatchesActiveLine(testUser, 'sante')).toBe(true);
    expect(getEffectiveRoleForProductLine(testUser, 'homme')).toBe('player');
    expect(getEffectiveRoleForProductLine(testUser, 'woman')).toBe('player');
    expect(getEffectiveRoleForProductLine(testUser, 'pro')).toBe('coach');
    expect(getEffectiveRoleForProductLine(testUser, 'sante')).toBe('physio');
    const proSession = getSessionProfile(testUser, 'pro');
    expect(proSession.role).toBe('coach');
    expect(proSession.product_line).toBe('pro');
    const santeSession = getSessionProfile(testUser, 'sante');
    expect(santeSession.role).toBe('physio');
    expect(santeSession.product_line).toBe('sante');
  });

  it('autorise le compte démo partenaire uniquement sur Pro', () => {
    const partner = {
      ...baseUser,
      email: 'part@gmail.com',
      role: 'sponsor' as const,
      product_line: 'pro' as const,
    } as User;
    expect(profileMatchesActiveLine(partner, 'pro')).toBe(true);
    expect(profileMatchesActiveLine(partner, 'homme')).toBe(false);
    expect(profileMatchesActiveLine(partner, 'woman')).toBe(false);
    expect(getEffectiveRoleForProductLine(partner, 'pro')).toBe('sponsor');
    const session = getSessionProfile(partner, 'pro');
    expect(session.role).toBe('sponsor');
    expect(session.product_line).toBe('pro');
  });
});
