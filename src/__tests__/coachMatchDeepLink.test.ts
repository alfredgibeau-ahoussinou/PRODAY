import {
  COACH_MATCH_FLOW_STEPS,
  resolveCoachMatchHubOverlay,
  shouldKeepCoachMatchHubOverlay,
} from '../features/coach/navigation/coachMatchDeepLink';

describe('coachMatchDeepLink', () => {
  it('résout un overlay hub depuis eventId + hubChapter', () => {
    expect(
      resolveCoachMatchHubOverlay({
        eventId: 'evt-1',
        hubChapter: 'effectif',
      }),
    ).toEqual({ eventId: 'evt-1', hubChapter: 'effectif' });
  });

  it('défaut hubChapter à apercu sans chapitre explicite', () => {
    expect(resolveCoachMatchHubOverlay({ eventId: 'evt-2' })).toEqual({
      eventId: 'evt-2',
      hubChapter: 'apercu',
    });
  });

  it('ignore les liens sans eventId', () => {
    expect(resolveCoachMatchHubOverlay({ homeTab: 'convocations' })).toBeNull();
    expect(resolveCoachMatchHubOverlay(null)).toBeNull();
  });

  it('mappe le parcours guidé Convoc→effectif, Compo→composition, Direct→live, Rapport→stats', () => {
    expect(COACH_MATCH_FLOW_STEPS.map((step) => step.hub)).toEqual([
      'effectif',
      'composition',
      'live',
      'stats',
    ]);
  });

  it('conserve l’overlay hub uniquement sur l’onglet Matchs', () => {
    expect(shouldKeepCoachMatchHubOverlay('matchs')).toBe(true);
    expect(shouldKeepCoachMatchHubOverlay('home')).toBe(false);
    expect(shouldKeepCoachMatchHubOverlay('profil')).toBe(false);
  });
});
