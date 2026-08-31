import {
  PRODAY_MASTER,
  PRODAY_POLE_ACCENTS,
  PRODAY_SYMBOL_ASPECT,
  PRODAY_TAGLINE,
  brandVariantForProductLine,
  poleAccent,
  poleOnAccent,
} from '../theme/prodayBrand';
import { poleSymbolAsset, PRODAY_BRAND_ASSETS } from '../content/brandingAssets';

describe('prodayBrand', () => {
  it('expose le ratio symbole HD', () => {
    expect(PRODAY_SYMBOL_ASPECT).toBeCloseTo(566 / 518, 4);
  });
  it('expose les accents officiels planche', () => {
    expect(PRODAY_POLE_ACCENTS.player).toBe('#FFFFFF');
    expect(PRODAY_POLE_ACCENTS.coach).toBe('#C5A059');
    expect(PRODAY_POLE_ACCENTS.club).toBe('#10B981');
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

  it('poleOnAccent pose une encre lisible sur l’accent pôle', () => {
    expect(poleOnAccent('player')).toBe(PRODAY_MASTER.black);
    expect(poleOnAccent('coach')).toBe(PRODAY_MASTER.black);
    expect(poleOnAccent('parent')).toBe(PRODAY_MASTER.black);
    expect(poleOnAccent('club')).toBe(PRODAY_MASTER.white);
    expect(poleOnAccent('sponsor')).toBe(PRODAY_MASTER.white);
    expect(poleOnAccent('supporter')).toBe(PRODAY_MASTER.white);
  });

  it('poleAccent retombe sur master or', () => {
    expect(poleAccent('master')).toBe(PRODAY_MASTER.gold);
    expect(poleAccent('club')).toBe('#10B981');
  });

  it('poleSymbolAsset retourne le symbole teinté par pôle', () => {
    expect(poleSymbolAsset('player')).toBe(PRODAY_BRAND_ASSETS.polePlayer);
    expect(poleSymbolAsset('coach')).toBe(PRODAY_BRAND_ASSETS.poleCoach);
    expect(poleSymbolAsset('club')).toBe(PRODAY_BRAND_ASSETS.poleClub);
    expect(poleSymbolAsset('sponsor')).toBe(PRODAY_BRAND_ASSETS.poleSponsor);
    expect(poleSymbolAsset('master', 'white')).toBe(PRODAY_BRAND_ASSETS.symbolWhite);
    expect(poleSymbolAsset('master', 'black')).toBe(PRODAY_BRAND_ASSETS.symbolBlack);
  });
});
