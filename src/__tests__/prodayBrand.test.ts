import {
  PRODAY_POLE_ACCENTS,
  brandVariantForProductLine,
  poleAccent,
} from '../theme/prodayBrand';

describe('prodayBrand', () => {
  it('expose les accents officiels planche', () => {
    expect(PRODAY_POLE_ACCENTS.player).toBe('#1E3AFF');
    expect(PRODAY_POLE_ACCENTS.coach).toBe('#22C55E');
    expect(PRODAY_POLE_ACCENTS.club).toBe('#7C3AED');
    expect(PRODAY_POLE_ACCENTS.parent).toBe('#F97316');
    expect(PRODAY_POLE_ACCENTS.supporter).toBe('#06B6D4');
    expect(PRODAY_POLE_ACCENTS.sponsor).toBe('#EF4444');
    expect(PRODAY_POLE_ACCENTS.admin).toBe('#A3A3A3');
    expect(PRODAY_POLE_ACCENTS.master).toBe('#0054F0');
  });

  it('mappe les lignes produit vers la variante', () => {
    expect(brandVariantForProductLine('pro_staff')).toBe('coach');
    expect(brandVariantForProductLine('pro_club')).toBe('club');
    expect(brandVariantForProductLine('amateur')).toBe('player');
    expect(brandVariantForProductLine('sponsor')).toBe('sponsor');
    expect(brandVariantForProductLine(null)).toBe('master');
  });

  it('poleAccent retombe sur master', () => {
    expect(poleAccent('master')).toBe('#0054F0');
    expect(poleAccent('club')).toBe('#7C3AED');
  });
});
