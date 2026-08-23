import {
  PRODAY_MASTER,
  PRODAY_POLE_ACCENTS,
  PRODAY_TAGLINE,
  brandVariantForProductLine,
  poleAccent,
} from '../theme/prodayBrand';

describe('prodayBrand', () => {
  it('expose les accents officiels planche', () => {
    expect(PRODAY_POLE_ACCENTS.player).toBe('#FFFFFF');
    expect(PRODAY_POLE_ACCENTS.coach).toBe('#C5A059');
    expect(PRODAY_POLE_ACCENTS.club).toBe('#00ADEF');
    expect(PRODAY_POLE_ACCENTS.parent).toBe('#8CC63F');
    expect(PRODAY_POLE_ACCENTS.supporter).toBe('#06B6D4');
    expect(PRODAY_POLE_ACCENTS.sponsor).toBe('#92278F');
    expect(PRODAY_POLE_ACCENTS.admin).toBe('#A3A3A3');
    expect(PRODAY_POLE_ACCENTS.master).toBe('#C5A059');
    expect(PRODAY_POLE_ACCENTS.events).toBe('#F7941D');
  });

  it('expose tagline officielle', () => {
    expect(PRODAY_TAGLINE).toBe('CONNECTER. PROGRESSER. RÉVÉLER.');
  });

  it('mappe les lignes produit vers la variante', () => {
    expect(brandVariantForProductLine('pro_staff')).toBe('coach');
    expect(brandVariantForProductLine('pro_club')).toBe('club');
    expect(brandVariantForProductLine('amateur')).toBe('player');
    expect(brandVariantForProductLine('sponsor')).toBe('sponsor');
    expect(brandVariantForProductLine(null)).toBe('master');
  });

  it('poleAccent retombe sur master or', () => {
    expect(poleAccent('master')).toBe(PRODAY_MASTER.gold);
    expect(poleAccent('club')).toBe('#00ADEF');
  });
});
