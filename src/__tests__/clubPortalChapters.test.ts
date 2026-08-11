import { CLUB_PORTAL_CHAPTERS } from '../content/clubPortalChapters';
import { CLUB_POLE_MODULES, CLUB_PITCH_ZONES } from '../content/clubPoleExperience';

describe('club portal A→Z', () => {
  it('exposes five operational chapters', () => {
    expect(CLUB_PORTAL_CHAPTERS.map((c) => c.id)).toEqual([
      'aujourdhui',
      'structure',
      'vivier',
      'competition',
      'outils',
    ]);
  });

  it('keeps site content catalogs available for tools chapter', () => {
    expect(CLUB_POLE_MODULES).toHaveLength(8);
    expect(CLUB_PITCH_ZONES).toHaveLength(6);
  });
});
