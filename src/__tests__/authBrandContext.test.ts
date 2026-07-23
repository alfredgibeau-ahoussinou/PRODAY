import {
  brandForAuthContext,
  colorsForAuthContext,
  isSponsorAuthPreset,
  reconcileProSignupPreset,
} from '../utils/authBrandContext';

describe('authBrandContext', () => {
  it('détecte le preset sponsor', () => {
    expect(isSponsorAuthPreset('sponsor')).toBe(true);
    expect(isSponsorAuthPreset('player')).toBe(false);
    expect(isSponsorAuthPreset(null)).toBe(false);
  });

  it('brand sponsor vs pro_staff', () => {
    expect(brandForAuthContext('pro_staff', 'sponsor').name).toContain('Sponsor');
    expect(brandForAuthContext('pro_staff', 'coach').name).toContain('Staff');
    expect(brandForAuthContext('pro_player', null).name).toContain('Joueur');
  });

  it('réaligne le preset quand on change de ligne pro', () => {
    expect(reconcileProSignupPreset('pro_player', 'sponsor')).toBe('player');
    expect(reconcileProSignupPreset('pro_club', 'sponsor')).toBe('club');
    expect(reconcileProSignupPreset('pro_staff', 'sponsor')).toBe('sponsor');
    expect(reconcileProSignupPreset('pro_staff', 'player')).toBe('coach');
  });

  it('couleurs or pour sponsor', () => {
    const c = colorsForAuthContext('pro_staff', 'sponsor');
    expect(c.accent.toLowerCase()).toBe('#d4af37');
  });
});
