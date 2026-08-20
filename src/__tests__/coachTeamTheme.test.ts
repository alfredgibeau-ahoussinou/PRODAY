import {
  buildCoachThemeTokens,
  COACH_TEAM_ACCENT_PALETTE,
  filterMembersForTeam,
  filterPendingForTeam,
  filterTrainingsForTeam,
  eventBelongsToTeam,
  teamPlayerUids,
  listCoachTeams,
  pickCoachTeam,
  resolveCoachEffectiveAccent,
  resolveCoachOnAccent,
  resolveCoachTeamAccent,
} from '../utils/coachTeamTheme';
import {
  buildCoachColorGrid,
  COACH_COLOR_GRID_SIZE,
  normalizeCoachHexColor,
} from '../utils/coachColorPicker';
import { COACH_SITE } from '../content/coachPageIdentity';
import type { TeamEvent } from '../models/TeamEvent';

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

  it('clubAccent remplace le hash équipe en mode auto', () => {
    const teamId = 'team-u17-a';
    const autoAccent = resolveCoachTeamAccent(teamId);
    const club = '#E53935';
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      teamId,
      accentMode: 'auto',
      clubAccent: club,
    });
    expect(tokens.accent).toBe(club);
    expect(tokens.accent).not.toBe(autoAccent);
  });

  it('manual override reste prioritaire sur clubAccent', () => {
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      teamId: 'team-1',
      accentMode: 'manual',
      accentOverride: '#FF6B35',
      clubAccent: '#E53935',
    });
    expect(tokens.accent).toBe('#FF6B35');
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

  it('onAccent — blanc sur accent sombre, sombre sur accent clair', () => {
    expect(resolveCoachOnAccent('#006CFC')).toBe('#FFFFFF');
    expect(resolveCoachOnAccent('#FFD60A')).toBe('#1C1C1E');
    const tokens = buildCoachThemeTokens({
      variant: 'solid',
      accentMode: 'manual',
      accentOverride: '#FFD60A',
    });
    expect(tokens.onAccent).toBe('#1C1C1E');
    const darkTokens = buildCoachThemeTokens({
      variant: 'solid',
      accentMode: 'manual',
      accentOverride: '#006CFC',
    });
    expect(darkTokens.onAccent).toBe('#FFFFFF');
  });

  it('listCoachTeams — retourne toutes les équipes du coach', () => {
    const teams = [
      { id: 'a', coach_uids: ['coach-1'], is_default: false },
      { id: 'b', coach_uids: ['coach-1', 'coach-2'], is_default: false },
      { id: 'c', coach_uids: ['coach-2'], is_default: true },
    ];
    expect(listCoachTeams(teams, 'coach-1').map((t) => t.id)).toEqual(['a', 'b']);
    expect(listCoachTeams(teams, 'coach-3')).toEqual([]);
  });

  it('pickCoachTeam — première équipe assignée ou fallback', () => {
    const teams = [
      { id: 'default', coach_uids: [], is_default: true },
      { id: 'mine', coach_uids: ['coach-1'], is_default: false },
    ];
    expect(pickCoachTeam(teams, 'coach-1')?.id).toBe('mine');
    expect(pickCoachTeam(teams, 'coach-9')?.id).toBe('default');
  });

  it('filterMembersForTeam — joueurs actifs de l’équipe sélectionnée', () => {
    const members = [
      { uid: 'p1', display_name: 'Alice' },
      { uid: 'p2', display_name: 'Bob' },
      { uid: 'p3', display_name: 'Chloé' },
    ];
    const memberships = [
      { status: 'active', team_id: 'team-a', player_uid: 'p1' },
      { status: 'active', team_id: 'team-b', player_uid: 'p2' },
      { status: 'pending', team_id: 'team-a', player_uid: 'p3' },
    ];
    expect(filterMembersForTeam(members, memberships, 'team-a').map((m) => m.uid)).toEqual(['p1']);
    expect(filterMembersForTeam(members, memberships, undefined).map((m) => m.uid)).toEqual([
      'p1',
      'p2',
      'p3',
    ]);
  });

  it('filterPendingForTeam — demandes en attente par équipe', () => {
    const pending = [
      { status: 'pending', team_id: 'team-a' },
      { status: 'pending', team_id: 'team-b' },
      { status: 'active', team_id: 'team-a' },
    ];
    expect(filterPendingForTeam(pending, 'team-a')).toHaveLength(1);
    expect(filterPendingForTeam(pending, undefined)).toHaveLength(2);
  });

  it('teamPlayerUids — joueurs actifs par équipe', () => {
    const memberships = [
      { status: 'active', team_id: 'team-a', player_uid: 'p1' },
      { status: 'active', team_id: 'team-b', player_uid: 'p2' },
      { status: 'pending', team_id: 'team-a', player_uid: 'p3' },
    ] as import('../models/Membership').Membership[];
    expect(teamPlayerUids(memberships, 'team-a')).toEqual(['p1']);
    expect(teamPlayerUids(memberships, undefined)).toEqual([]);
  });

  function trainingEvent(partial: Partial<TeamEvent> & Pick<TeamEvent, 'id' | 'invitee_uids'>): TeamEvent {
    return {
      title: 'Séance',
      event_type: 'training',
      organizer_uid: 'coach',
      organizer_name: 'Coach',
      starts_at: new Date(),
      city: 'Paris',
      rsvps: {},
      created_at: new Date(),
      updated_at: new Date(),
      ...partial,
    };
  }

  it('eventBelongsToTeam — team_id explicite ou chevauchement legacy', () => {
    const teamUids = ['p1', 'p2', 'p3'];
    const tagged = trainingEvent({ id: 'e1', team_id: 'team-a', invitee_uids: ['p9'] });
    const legacyMajority = trainingEvent({ id: 'e2', invitee_uids: ['p1', 'p2', 'x'] });
    const legacyMinority = trainingEvent({ id: 'e3', invitee_uids: ['p1', 'x', 'y'] });
    const otherTeam = trainingEvent({ id: 'e4', team_id: 'team-b', invitee_uids: ['p1'] });

    expect(eventBelongsToTeam(tagged, 'team-a', teamUids)).toBe(true);
    expect(eventBelongsToTeam(tagged, 'team-b', teamUids)).toBe(false);
    expect(eventBelongsToTeam(legacyMajority, 'team-a', teamUids)).toBe(true);
    expect(eventBelongsToTeam(legacyMinority, 'team-a', teamUids)).toBe(false);
    expect(eventBelongsToTeam(otherTeam, 'team-a', teamUids)).toBe(false);
  });

  it('filterTrainingsForTeam — filtre par équipe active', () => {
    const teamUids = ['p1', 'p2'];
    const events = [
      trainingEvent({ id: 't1', team_id: 'team-a', invitee_uids: ['p1'] }),
      trainingEvent({ id: 't2', invitee_uids: ['p1', 'p2'] }),
      trainingEvent({ id: 't3', invitee_uids: ['p9'] }),
      trainingEvent({ id: 'm1', event_type: 'friendly', invitee_uids: ['p1'] }),
    ];
    const filtered = filterTrainingsForTeam(events, 'team-a', teamUids);
    expect(filtered.map((e) => e.id)).toEqual(['t1', 't2']);
  });
});
