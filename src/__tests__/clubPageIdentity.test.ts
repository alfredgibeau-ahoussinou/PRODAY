import {
  CLUB_PAGE_IDENTITIES,
  CLUB_SITE,
  getClubPageIdentity,
} from '../content/clubPageIdentity';
import type { ClubNavItemId } from '../features/club/navigation/clubNavConfig';

describe('clubPageIdentity', () => {
  it('utilise l’accent site /pro-club sur toutes les pages', () => {
    const ids = Object.keys(CLUB_PAGE_IDENTITIES) as ClubNavItemId[];
    for (const id of ids) {
      expect(CLUB_PAGE_IDENTITIES[id].accent).toBe(CLUB_SITE.accent);
    }
    expect(CLUB_SITE.accent).toBe('#006CFC');
    expect(CLUB_SITE.deep).toBe('#002478');
  });

  it('différencie les pages par layout, pas par couleur', () => {
    const layouts = new Set(
      (Object.keys(CLUB_PAGE_IDENTITIES) as ClubNavItemId[]).map(
        (id) => CLUB_PAGE_IDENTITIES[id].layout,
      ),
    );
    expect(layouts.size).toBeGreaterThanOrEqual(6);
    expect(getClubPageIdentity('today').layout).toBe('briefing');
    expect(getClubPageIdentity('video').layout).toBe('studio');
    expect(getClubPageIdentity('pitch').wash[0]).toBe(CLUB_SITE.pitchDeep);
  });
});
