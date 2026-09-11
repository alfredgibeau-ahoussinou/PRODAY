import {
  CLUB_PAGE_IDENTITIES,
  CLUB_SITE,
  getClubPageIdentity,
} from '../content/clubPageIdentity';
import type { ClubNavItemId } from '../features/club/navigation/clubNavConfig';

describe('clubPageIdentity', () => {
  it('utilise l’accent Club sur les pages définies', () => {
    const ids = Object.keys(CLUB_PAGE_IDENTITIES) as ClubNavItemId[];
    for (const id of ids) {
      expect(CLUB_PAGE_IDENTITIES[id]!.accent).toBe(CLUB_SITE.accent);
    }
    expect(CLUB_SITE.accent).toBe('#10B981');
    expect(CLUB_SITE.deep).toBe('#047857');
    expect(CLUB_SITE.bg.toLowerCase()).toBe('#000000');
    expect(CLUB_SITE.band.toLowerCase()).toBe('#000000');
  });

  it('différencie les pages par layout', () => {
    const layouts = new Set(
      (Object.keys(CLUB_PAGE_IDENTITIES) as ClubNavItemId[]).map(
        (id) => CLUB_PAGE_IDENTITIES[id]!.layout,
      ),
    );
    expect(layouts.size).toBeGreaterThanOrEqual(5);
    expect(getClubPageIdentity('today').layout).toBe('briefing');
    expect(getClubPageIdentity('matches').layout).toBe('arena');
    expect(getClubPageIdentity('pack').support).toContain('SUR DEVIS');
  });
});
