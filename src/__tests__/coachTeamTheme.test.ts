import {
  buildCoachThemeTokens,
  resolveCoachTeamAccent,
} from '../utils/coachTeamTheme';
import { COACH_SITE } from '../content/coachPageIdentity';

describe('coachTeamTheme', () => {
  it('retourne le même accent pour le même teamId', () => {
    const a = resolveCoachTeamAccent('team-u17-a', 'U17 A');
    const b = resolveCoachTeamAccent('team-u17-a', 'Autre nom');
    expect(a).toBe(b);
  });

  it('retourne des accents différents pour des équipes différentes', () => {
    const accents = new Set(
      ['team-alpha', 'team-beta', 'team-gamma', 'team-delta', 'team-epsilon'].map((id) =>
        resolveCoachTeamAccent(id),
      ),
    );
    expect(accents.size).toBeGreaterThan(1);
  });

  it('utilise le bleu PRODAY sans équipe', () => {
    expect(resolveCoachTeamAccent()).toBe(COACH_SITE.accent);
    expect(resolveCoachTeamAccent('', '   ')).toBe(COACH_SITE.accent);
  });

  it('solid vs clear — fond et surfaces différents', () => {
    const solid = buildCoachThemeTokens({
      variant: 'solid',
      teamId: 'team-1',
      teamName: 'Seniors',
    });
    const clear = buildCoachThemeTokens({
      variant: 'clear',
      teamId: 'team-1',
      teamName: 'Seniors',
    });

    expect(solid.bg).not.toBe(clear.bg);
    expect(solid.surface).not.toBe(clear.surface);
    expect(solid.accent).toBe(clear.accent);
    expect(solid.variant).toBe('solid');
    expect(clear.variant).toBe('clear');
    expect(solid.bg).toBe(COACH_SITE.bg);
    expect(clear.surface).toBe('rgba(255, 255, 255, 0.06)');
  });

  it('expose le libellé équipe dans les tokens', () => {
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      teamName: 'U15 Filles',
    });
    expect(tokens.teamLabel).toBe('U15 Filles');
  });
});
