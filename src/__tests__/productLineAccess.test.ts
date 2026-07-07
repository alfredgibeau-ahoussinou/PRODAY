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
  it('lit product_line woman (joueur migré pro_player)', () => {
    const user = { ...baseUser, product_line: 'woman' as const };
    expect(getUserProductLine(user)).toBe('pro_player');
  });

  it('déduit woman depuis app_space legacy (non joueur)', () => {
    const user = { ...baseUser, role: 'coach' as const, app_space: 'women' as const };
    expect(getUserProductLine(user)).toBe('woman');
  });

  it('compte pro_player par défaut pour joueur sans ligne', () => {
    expect(getUserProductLine(baseUser as User)).toBe('pro_player');
  });

  it('migre homme joueur vers pro_player', () => {
    const hommePlayer = {
      ...baseUser,
      product_line: 'homme' as const,
    } as User;
    expect(getUserProductLine(hommePlayer)).toBe('pro_player');
    expect(profileMatchesActiveLine(hommePlayer, 'pro_player')).toBe(true);
    expect(profileMatchesActiveLine(hommePlayer, 'homme')).toBe(true);
  });

  it('migre woman joueuse vers pro_player', () => {
    const womanPlayer = {
      ...baseUser,
      product_line: 'woman' as const,
    } as User;
    expect(getUserProductLine(womanPlayer)).toBe('pro_player');
    expect(profileMatchesActiveLine(womanPlayer, 'woman')).toBe(true);
  });

  it('déduit sante depuis rôle physio', () => {
    const physio = { ...baseUser, role: 'physio' as const } as User;
    expect(getUserProductLine(physio)).toBe('sante');
  });

  it('canonicalise pro legacy coach vers pro_staff', () => {
    const coach = { ...baseUser, role: 'coach' as const, product_line: 'pro' as const } as User;
    expect(getUserProductLine(coach)).toBe('pro_staff');
  });

  it('lit pro_player explicite', () => {
    const proPlayer = {
      ...baseUser,
      role: 'player' as const,
      product_line: 'pro_player' as const,
    } as User;
    expect(getUserProductLine(proPlayer)).toBe('pro_player');
    expect(profileMatchesActiveLine(proPlayer, 'pro_player')).toBe(true);
  });

  it('lit amateur player depuis product_line explicite', () => {
    const amateurPlayer = {
      ...baseUser,
      role: 'player' as const,
      product_line: 'amateur' as const,
    } as User;
    expect(getUserProductLine(amateurPlayer)).toBe('amateur');
    expect(profileMatchesActiveLine(amateurPlayer, 'amateur')).toBe(true);
    expect(profileMatchesActiveLine(amateurPlayer, 'homme')).toBe(false);
  });

  it('lit amateur coach depuis product_line explicite', () => {
    const amateurCoach = {
      ...baseUser,
      role: 'coach' as const,
      product_line: 'amateur' as const,
    } as User;
    expect(getUserProductLine(amateurCoach)).toBe('amateur');
    expect(profileMatchesActiveLine(amateurCoach, 'amateur')).toBe(true);
    expect(profileMatchesActiveLine(amateurCoach, 'pro_staff')).toBe(false);
  });

  it('lit supporter depuis product_line explicite', () => {
    const supporterUser = {
      ...baseUser,
      role: 'supporter' as const,
      product_line: 'supporter' as const,
    } as User;
    expect(getUserProductLine(supporterUser)).toBe('supporter');
    expect(profileMatchesActiveLine(supporterUser, 'supporter')).toBe(true);
    expect(profileMatchesActiveLine(supporterUser, 'homme')).toBe(false);
    expect(profileMatchesActiveLine(supporterUser, 'pro_staff')).toBe(false);
  });

  it('déduit pro_club depuis rôle club legacy sans product_line', () => {
    const club = { ...baseUser, role: 'club' as const } as User;
    expect(getUserProductLine(club)).toBe('pro_club');
  });

  it('refuse connexion cross-version', () => {
    const womanPlayer = {
      ...baseUser,
      product_line: 'woman' as const,
      profile: { gender: 'women' as const },
    } as User;
    expect(profileMatchesActiveLine(womanPlayer, 'homme')).toBe(false);
    expect(profileMatchesActiveLine(womanPlayer, 'pro_player')).toBe(true);
    expect(profileMatchesActiveLine(womanPlayer, 'woman')).toBe(true);
    expect(getProductLineMismatchMessage('amateur', 'pro_player')).toMatch(/Pro Day Amateur/);
  });

  it('refuse le compte joueur standard hors de son pôle', () => {
    const player = {
      ...baseUser,
      email: 'alfredgibeauahoussinou@gmail.com',
      product_line: 'homme' as const,
    } as User;
    expect(profileMatchesActiveLine(player, 'homme')).toBe(true);
    expect(profileMatchesActiveLine(player, 'woman')).toBe(false);
    expect(profileMatchesActiveLine(player, 'pro_player')).toBe(true);
    expect(profileMatchesActiveLine(player, 'sante')).toBe(false);
    expect(getEffectiveRoleForProductLine(player, 'pro_player')).toBe('player');
    expect(getSessionProfile(player, 'pro_player').role).toBe('player');
  });

  it('autorise le compte démo partenaire sur toute la famille pro', () => {
    const partner = {
      ...baseUser,
      email: 'part@gmail.com',
      role: 'sponsor' as const,
      product_line: 'pro_staff' as const,
    } as User;
    expect(profileMatchesActiveLine(partner, 'pro_staff')).toBe(true);
    expect(profileMatchesActiveLine(partner, 'pro_player')).toBe(true);
    expect(profileMatchesActiveLine(partner, 'homme')).toBe(false);
    expect(getEffectiveRoleForProductLine(partner, 'pro_staff')).toBe('sponsor');
    const session = getSessionProfile(partner, 'pro_staff');
    expect(session.role).toBe('sponsor');
    expect(session.product_line).toBe('pro_staff');
  });
});
