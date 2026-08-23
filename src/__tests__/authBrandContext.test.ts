import {
  brandForAuthContext,
  colorsForAuthContext,
  isParentAuthPreset,
  isSponsorAuthPreset,
  reconcileProSignupPreset,
} from '../utils/authBrandContext';

describe('authBrandContext', () => {
  it('détecte le preset sponsor', () => {
    expect(isSponsorAuthPreset('sponsor')).toBe(true);
    expect(isSponsorAuthPreset('player')).toBe(false);
    expect(isSponsorAuthPreset(null)).toBe(false);
  });

  it('détecte le preset parent', () => {
    expect(isParentAuthPreset('parent')).toBe(true);
    expect(isParentAuthPreset('player')).toBe(false);
    expect(isParentAuthPreset(null)).toBe(false);
  });

  it('brand sponsor vs pro_staff vs parent', () => {
    expect(brandForAuthContext('pro_staff', 'sponsor').name).toContain('Sponsor');
    expect(brandForAuthContext('pro_staff', 'coach').name).toContain('Coach');
    expect(brandForAuthContext('pro_player', null).name).toContain('Joueur');
    expect(brandForAuthContext('parent', 'parent').name).toContain('Parent');
    expect(brandForAuthContext('amateur', 'parent').name).toContain('Parent');
  });

  it('réaligne le preset quand on change de ligne pro', () => {
    expect(reconcileProSignupPreset('pro_player', 'sponsor')).toBe('player');
    expect(reconcileProSignupPreset('pro_club', 'sponsor')).toBe('club');
    expect(reconcileProSignupPreset('sponsor', null)).toBe('sponsor');
    expect(reconcileProSignupPreset('parent', null)).toBe('parent');
    expect(reconcileProSignupPreset('pro_staff', 'sponsor')).toBe('coach');
    expect(reconcileProSignupPreset('pro_staff', 'parent')).toBe('coach');
    expect(reconcileProSignupPreset('pro_staff', 'player')).toBe('coach');
  });

  it('couleurs violet recruteur pour sponsor', () => {
    const c = colorsForAuthContext('pro_staff', 'sponsor');
    expect(c.accent.toLowerCase()).toBe('#92278f');
  });

  it('couleurs lime pour parent', () => {
    const c = colorsForAuthContext('parent', 'parent');
    expect(c.accent.toLowerCase()).toBe('#8cc63f');
  });
});
