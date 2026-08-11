import { buildClubAiBriefing } from '../utils/clubAiBriefing';
import { CLUB_PORTAL_CHAPTERS } from '../content/clubPortalChapters';

describe('club AI briefing', () => {
  it('surfaces pending memberships as top priority', () => {
    const b = buildClubAiBriefing({
      clubName: 'FC Test',
      teamsCount: 3,
      playersCount: 40,
      coachesCount: 3,
      pendingMemberships: 2,
      teamsWithoutCoach: 0,
      openInternalNeeds: 0,
      openExternalNeeds: 0,
    });
    expect(b.priorities[0]?.id).toBe('pending-members');
    expect(b.headline).toContain('2 demande');
  });

  it('pushes structure when no teams exist', () => {
    const b = buildClubAiBriefing({
      clubName: 'FC Test',
      teamsCount: 0,
      playersCount: 0,
      coachesCount: 0,
      pendingMemberships: 0,
      teamsWithoutCoach: 0,
      openInternalNeeds: 0,
      openExternalNeeds: 0,
    });
    expect(b.suggestions.some((s) => s.chapter === 'structure')).toBe(true);
  });

  it('recommends vivier before external mercato', () => {
    const b = buildClubAiBriefing({
      clubName: 'FC Test',
      teamsCount: 2,
      playersCount: 30,
      coachesCount: 2,
      pendingMemberships: 0,
      teamsWithoutCoach: 0,
      openInternalNeeds: 3,
      openExternalNeeds: 1,
    });
    expect(b.suggestions[0]?.chapter).toBe('vivier');
  });
});

describe('club portal chapters', () => {
  it('keeps five operational chapters', () => {
    expect(CLUB_PORTAL_CHAPTERS.map((c) => c.id)).toEqual([
      'aujourdhui',
      'structure',
      'vivier',
      'competition',
      'outils',
    ]);
  });
});
