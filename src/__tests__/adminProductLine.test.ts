import {
  resolveAdminProductLine,
  ADMIN_PRODUCT_LINES,
} from '../utils/adminProductLine';

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

  it('expose les pôles admin actuels', () => {
    expect(ADMIN_PRODUCT_LINES).toContain('sponsor');
    expect(ADMIN_PRODUCT_LINES).toContain('pro_player');
    expect(ADMIN_PRODUCT_LINES).not.toContain('pro');
  });
});
