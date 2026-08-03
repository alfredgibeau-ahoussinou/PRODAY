import {
  resolveAdminProductLine,
  ADMIN_PRODUCT_LINES,
  adminRolesForProductLine,
  adminProductLineLabel,
  adminUserMatchesProductLineFilter,
} from '../utils/adminProductLine';
import { adminGenderLabel, adminPlayerLevelLabel } from '../utils/adminUserDisplay';

describe('adminProductLine', () => {
  it('force sponsor / sante / supporter selon le rôle', () => {
    expect(resolveAdminProductLine('sponsor', 'pro_staff')).toBe('sponsor');
    expect(resolveAdminProductLine('physio', 'amateur')).toBe('sante');
    expect(resolveAdminProductLine('supporter', 'pro_player')).toBe('supporter');
  });

  it('conserve amateur pour joueur ou coach', () => {
    expect(resolveAdminProductLine('player', 'amateur')).toBe('amateur');
    expect(resolveAdminProductLine('coach', 'amateur')).toBe('amateur');
  });

  it('oriente les rôles pro vers le bon split', () => {
    expect(resolveAdminProductLine('player', 'pro_staff')).toBe('pro_player');
    expect(resolveAdminProductLine('club', 'amateur')).toBe('pro_club');
    expect(resolveAdminProductLine('agent', 'pro_player')).toBe('pro_staff');
  });

  it('expose les rôles métier par univers', () => {
    expect(adminRolesForProductLine('pro_staff')).toEqual([
      'coach',
      'agent',
      'recruiter',
      'organizer',
    ]);
    expect(adminRolesForProductLine('amateur')).toEqual(['player', 'coach']);
    expect(adminRolesForProductLine('sponsor')).toEqual(['sponsor']);
  });

  it('expose les pôles admin actuels (Joueur unifié, sans doublon pro_player)', () => {
    expect(ADMIN_PRODUCT_LINES).toContain('sponsor');
    expect(ADMIN_PRODUCT_LINES).toContain('amateur');
    expect(ADMIN_PRODUCT_LINES).not.toContain('pro_player');
    expect(ADMIN_PRODUCT_LINES).not.toContain('pro');
  });

  it('libellé admin Joueur pour le pôle unifié', () => {
    expect(adminProductLineLabel('amateur')).toBe('Joueur');
    expect(adminProductLineLabel('pro_player')).toBe('Joueur');
    expect(adminProductLineLabel('woman')).toBe('Joueur');
    expect(adminProductLineLabel('sante')).toBe('Santé');
  });

  it('filtre Joueur couvre amateur et pro_player', () => {
    expect(adminUserMatchesProductLineFilter('pro_player', 'amateur')).toBe(true);
    expect(adminUserMatchesProductLineFilter('amateur', 'amateur')).toBe(true);
    expect(adminUserMatchesProductLineFilter('sante', 'amateur')).toBe(false);
    expect(adminUserMatchesProductLineFilter('sante', 'sante')).toBe(true);
  });
});

describe('adminUserDisplay', () => {
  it('mappe le genre support', () => {
    expect(adminGenderLabel('men')).toBe('Homme');
    expect(adminGenderLabel('women')).toBe('Femme');
    expect(adminGenderLabel('minor')).toBe('Mineur');
    expect(adminGenderLabel(undefined)).toBe('—');
  });

  it('libellé badge niveau', () => {
    expect(adminPlayerLevelLabel('amateur')).toBe('Amateur');
    expect(adminPlayerLevelLabel('academy', { short: true })).toBe('Centre / Aspirant');
    expect(adminPlayerLevelLabel('professional')).toBe('Professionnel');
    expect(adminPlayerLevelLabel(undefined)).toBeNull();
  });
});
