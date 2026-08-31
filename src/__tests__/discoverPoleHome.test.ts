import { UI_FR } from '../i18n/messages/ui.fr';
import { getLocalizedDiscoverCopy, getLocalizedUniverseLabel } from '../i18n/localizedContent';
import {
  discoverHomeChrome,
  discoverQuickIdsForLine,
  discoverShowsMercatoPreview,
  DISCOVER_HOME_PORTRAIT,
  isDiscoverPortraitHome,
} from '../components/discover/discoverPoleHome';
import { gradientsForLine } from '../theme/universeGradients';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';
import { amateurGradients } from '../theme/prodayAmateurTheme';
import { getDiscoverHomeCopy } from '../content/brandExperience';

const t = (key: string) => UI_FR[key] ?? key;

describe('discover pole home', () => {
  it('traduit Parent (plus de clés brutes)', () => {
    expect(getLocalizedUniverseLabel('parent', t)).toBe('Parent');
    const copy = getLocalizedDiscoverCopy('parent', t);
    expect(copy.heroTitle).toMatch(/Accompagner/i);
    expect(copy.heroTitle).not.toBe('discover.hero.parent');
    expect(copy.heroSub).not.toBe('discover.mission.parent');
    expect(copy.ctaText).toMatch(/Parent/i);
  });

  it('raccourcit le switcher univers', () => {
    expect(getLocalizedUniverseLabel('amateur', t)).toBe('Joueur');
    expect(getLocalizedUniverseLabel('pro_club', t)).toBe('Club');
    expect(getLocalizedUniverseLabel('pro_staff', t)).toBe('Coach');
    expect(getLocalizedUniverseLabel('sponsor', t)).toBe('Sponsor');
  });

  it('limite l’accès rapide à 3 tuiles max, filtrées par pôle', () => {
    expect(discoverQuickIdsForLine('amateur').length).toBeLessThanOrEqual(3);
    expect(discoverQuickIdsForLine('amateur')).toEqual(['mercato', 'matchs', 'reels']);
    expect(discoverQuickIdsForLine('supporter')).toEqual(['matchs', 'reels']);
    expect(discoverQuickIdsForLine('parent')).toEqual(['matchs']);
    expect(discoverQuickIdsForLine('pro_club')).toEqual(['mercato', 'matchs']);
    expect(discoverQuickIdsForLine('sponsor')).toEqual([]);
  });

  it('masque l’aperçu Mercato générique hors pôles concernés', () => {
    expect(discoverShowsMercatoPreview('amateur')).toBe(true);
    expect(discoverShowsMercatoPreview('pro_club')).toBe(true);
    expect(discoverShowsMercatoPreview('parent')).toBe(false);
    expect(discoverShowsMercatoPreview('supporter')).toBe(false);
    expect(discoverShowsMercatoPreview('sponsor')).toBe(false);
  });

  it('aligne les CTA gradient sur un seul accent pôle', () => {
    expect(amateurGradients.cta).not.toContain('#1529CC');
    expect(amateurGradients.cta[1]).toBe(PRODAY_POLE_ACCENTS.player);
    expect(gradientsForLine('pro_club').cta[1]).toBe(PRODAY_POLE_ACCENTS.club);
    expect(gradientsForLine('pro_staff').cta[1]).toBe(PRODAY_POLE_ACCENTS.coach);
    expect(gradientsForLine('amateur').cta[1]).toBe(PRODAY_POLE_ACCENTS.player);
    expect(gradientsForLine('parent').cta[1]).toBe(PRODAY_POLE_ACCENTS.parent);
    expect(gradientsForLine('sponsor').cta[1]).toBe(PRODAY_POLE_ACCENTS.sponsor);
  });

  it('Club Discover / ambient = noir pur (pas de wash vert)', () => {
    const g = gradientsForLine('pro_club');
    expect(g.ambient.every((c) => c === '#000000')).toBe(true);
    expect(g.hero.every((c) => c === '#000000')).toBe(true);
  });

  it('expose le copy Parent dans brandExperience', () => {
    expect(getDiscoverHomeCopy('parent').heroTitle).toMatch(/Accompagner/i);
    expect(getDiscoverHomeCopy('parent').playersStatLabel).toBe('Familles');
  });

  it('resserres le chrome discover en portrait vs wide', () => {
    const phone = discoverHomeChrome(390, 844);
    const landscape = discoverHomeChrome(844, 390);
    const tablet = discoverHomeChrome(1024, 768);

    expect(isDiscoverPortraitHome(390, 844)).toBe(true);
    expect(isDiscoverPortraitHome(844, 390)).toBe(false);
    expect(isDiscoverPortraitHome(768, 1024)).toBe(false);

    expect(phone).toEqual(DISCOVER_HOME_PORTRAIT);
    expect(phone.logoSize).toBe(64);
    expect(phone.shellGap).toBe(8);
    expect(phone.topExtra).toBe(4);
    expect(phone.heroMarginBottom).toBe(10);
    expect(phone.scrollBottom).toBe(16);

    expect(landscape.logoSize).toBe(80);
    expect(tablet.logoSize).toBe(80);
    expect(phone.shellGap).toBeLessThan(landscape.shellGap);
    expect(phone.logoSize).toBeLessThan(landscape.logoSize);
  });
});
