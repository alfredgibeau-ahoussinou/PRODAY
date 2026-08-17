import {
  COACH_MATCH_HUB_CHAPTERS,
  coachMatchHubLabel,
} from '../content/coachMatchHubChapters';
import {
  COACH_MATCH_FLOW_STEPS,
  resolveCoachEventHubOverlay,
  resolveCoachMatchHubOverlay,
  shouldKeepCoachEventHubOverlay,
  shouldKeepCoachMatchHubOverlay,
} from '../features/coach/navigation/coachMatchDeepLink';
import * as fs from 'fs';
import * as path from 'path';

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

  it('conserve l’overlay hub sur Matchs et depuis le planning coach', () => {
    expect(shouldKeepCoachEventHubOverlay('matchs')).toBe(true);
    expect(shouldKeepCoachEventHubOverlay('home', 'entrainements')).toBe(true);
    expect(shouldKeepCoachEventHubOverlay('home', 'planning')).toBe(true);
    expect(shouldKeepCoachEventHubOverlay('home', 'today')).toBe(true);
    expect(shouldKeepCoachEventHubOverlay('home', 'equipe')).toBe(false);
    expect(shouldKeepCoachEventHubOverlay('profil')).toBe(false);
    expect(shouldKeepCoachMatchHubOverlay('matchs')).toBe(true);
    expect(shouldKeepCoachMatchHubOverlay('home')).toBe(false);
  });

  it('resolveCoachEventHubOverlay sans chapitre explicite', () => {
    expect(resolveCoachEventHubOverlay({ eventId: 'evt-2' })).toEqual({
      eventId: 'evt-2',
      hubChapter: undefined,
    });
    expect(resolveCoachMatchHubOverlay({ eventId: 'evt-2' })).toEqual({
      eventId: 'evt-2',
      hubChapter: 'apercu',
    });
  });
});

describe('coachMatchHubChapters', () => {
  it('expose 5 segments coach dans l’ordre Résumé→Effectif→Compo→Direct→Stats', () => {
    expect(COACH_MATCH_HUB_CHAPTERS.map((c) => c.label)).toEqual([
      'Résumé',
      'Effectif',
      'Compo',
      'Direct',
      'Stats',
    ]);
    expect(COACH_MATCH_HUB_CHAPTERS.map((c) => c.id)).toEqual([
      'apercu',
      'effectif',
      'composition',
      'live',
      'stats',
    ]);
  });

  it('résout les libellés coach par chapitre', () => {
    expect(coachMatchHubLabel('effectif')).toBe('Effectif');
    expect(coachMatchHubLabel('live')).toBe('Direct');
  });
});

describe('coach match attendance', () => {
  it('markAttendance exige le staff via assertManage (service teamEvents)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../services/teamEvents.service.ts'),
      'utf8',
    );
    expect(src).toContain('async markAttendance');
    expect(src).toContain('assertManage(event, actor)');
  });
});
