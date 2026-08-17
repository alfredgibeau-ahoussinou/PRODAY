import {
  buildCoachThemeTokens,
  COACH_TEAM_ACCENT_PALETTE,
  resolveCoachEffectiveAccent,
  resolveCoachTeamAccent,
} from '../utils/coachTeamTheme';
import {
  buildCoachColorGrid,
  COACH_COLOR_GRID_SIZE,
  normalizeCoachHexColor,
} from '../utils/coachColorPicker';
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
    expect(solid.isLight).toBe(false);
    expect(clear.isLight).toBe(true);
    expect(clear.bg).toBe('#FFFFFF');
    expect(clear.surface).toBe('#F2F2F7');
    expect(clear.surface).not.toBe('#1C1C1E');
    expect(clear.foreground).toBe('#1C1C1E');
    expect(clear.foreground).not.toBe(COACH_SITE.foreground);
  });

  it('expose le libellé équipe dans les tokens', () => {
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      teamName: 'U15 Filles',
    });
    expect(tokens.teamLabel).toBe('U15 Filles');
  });

  it('manual override remplace le hash équipe', () => {
    const teamId = 'team-u17-a';
    const autoAccent = resolveCoachTeamAccent(teamId);
    const manualColor = COACH_TEAM_ACCENT_PALETTE.find((c) => c !== autoAccent) ?? '#FF6B35';
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      teamId,
      accentMode: 'manual',
      accentOverride: manualColor,
    });
    expect(tokens.accent).toBe(manualColor);
    expect(tokens.accent).not.toBe(autoAccent);
  });

  it('manual override accepte un hex arbitraire hors palette', () => {
    const teamId = 'team-u17-a';
    const custom = '#E91E63';
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      teamId,
      accentMode: 'manual',
      accentOverride: custom,
    });
    expect(tokens.accent).toBe('#E91E63');
    expect(tokens.accent).not.toBe(resolveCoachTeamAccent(teamId));
  });

  it('buildCoachColorGrid expose plus de 1000 couleurs', () => {
    expect(COACH_COLOR_GRID_SIZE).toBeGreaterThan(1000);
    expect(buildCoachColorGrid().length).toBe(COACH_COLOR_GRID_SIZE);
  });

  it('normalizeCoachHexColor accepte #RRGGBB et RRGGBB', () => {
    expect(normalizeCoachHexColor('#e91e63')).toBe('#E91E63');
    expect(normalizeCoachHexColor('E91E63')).toBe('#E91E63');
    expect(normalizeCoachHexColor('#NOTHEX')).toBeNull();
  });

  it('auto utilise le hash équipe même si accentOverride est présent', () => {
    const teamId = 'team-beta';
    const autoAccent = resolveCoachTeamAccent(teamId);
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      teamId,
      accentMode: 'auto',
      accentOverride: '#FF6B35',
    });
    expect(tokens.accent).toBe(autoAccent);
  });

  it('resolveCoachEffectiveAccent — manual invalide retombe sur hash', () => {
    const teamId = 'team-gamma';
    const autoAccent = resolveCoachTeamAccent(teamId);
    expect(
      resolveCoachEffectiveAccent({
        accentMode: 'manual',
        accentOverride: '#NOTPALETTE',
        teamId,
      }),
    ).toBe(autoAccent);
  });
});
