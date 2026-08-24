import { SPONSOR_THEME } from '../content/sponsorExperience';
import { SPONSOR_SPACE_LINES } from '../content/discoverSponsorContent';
import { sponsorChrome } from '../theme/sponsorShellTheme';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';
import { discoverQuickIdsForLine } from '../components/discover/discoverPoleHome';
import { poleSymbolAsset, PRODAY_BRAND_ASSETS, SPONSOR_BRANDING_LOGOS } from '../content/brandingAssets';

describe('sponsor space brand', () => {
  it('ancre l’accent violet planche #92278F', () => {
    expect(SPONSOR_THEME.primary).toBe(PRODAY_POLE_ACCENTS.sponsor);
    expect(SPONSOR_THEME.primary).toBe('#92278F');
    expect(sponsorChrome.accent).toBe('#92278F');
    expect(sponsorChrome.gold).toBe('#92278F');
  });

  it('garde un fond noir premium', () => {
    expect(SPONSOR_THEME.background).toBe('#000000');
    expect(sponsorChrome.background).toBe('#000000');
    expect(sponsorChrome.shell).toBe('#000000');
  });

  it('expose 3 lignes éditoriales guest sans clutter landing', () => {
    expect(SPONSOR_SPACE_LINES).toHaveLength(3);
    expect(SPONSOR_SPACE_LINES.map((l) => l.id)).toEqual(['campaigns', 'network', 'roi']);
    expect(discoverQuickIdsForLine('sponsor')).toEqual([]);
  });

  it('chrome menu/tab utilise le symbole HD teinté sponsor, pas le lockup opaque', () => {
    expect(poleSymbolAsset('sponsor')).toBe(PRODAY_BRAND_ASSETS.poleSponsor);
    expect(SPONSOR_BRANDING_LOGOS.picto).toBe(PRODAY_BRAND_ASSETS.poleSponsor);
    expect(SPONSOR_BRANDING_LOGOS.mark).toBe(PRODAY_BRAND_ASSETS.symbolMark);
  });
});
