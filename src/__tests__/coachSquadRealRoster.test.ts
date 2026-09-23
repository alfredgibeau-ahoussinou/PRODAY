import fs from 'fs';
import path from 'path';
import {
  availabilityFromRsvp,
  availabilityLabel,
  buildCoachEventLineup,
  buildCoachSquadPlayers,
  compareSquadReadiness,
  fillLineupFromSquad,
  isSquadPlayerUnavailable,
  normalizeSquadPosition,
  readPublishedLineup,
  rsvpFromAvailability,
  stripSquadDiacritics,
  type SquadPlayer,
} from '../utils/coachSquadRoster';
import type { Membership } from '../models/Membership';
import type { Team } from '../models/Team';
import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import { ALL_FORMATION_COORDINATES } from '../constants/tacticalMatrix';

/** Les crans réels du 4-3-3 — la publication s'appuie sur eux, pas sur une fixture. */
const PITCH_SLOTS = ALL_FORMATION_COORDINATES['4-3-3']!;

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const SCREEN = 'screens/coach/CoachSquadScreen.tsx';
const HOOK = 'hooks/useCoachSquadRoster.ts';
const ROSTER_UTIL = 'utils/coachSquadRoster.ts';
const CARD = 'components/coach/CoachFutPlayerCard.tsx';
const GUIDE = 'components/coach/CoachLineupGuide.tsx';

function member(
  uid: string,
  name: string,
  profile: User['profile'] = {},
  role: User['role'] = 'player',
): User {
  return {
    uid,
    display_name: name,
    email: `${uid}@club.fr`,
    role,
    is_verified: true,
    verification_status: 'VERIFIED',
    profile,
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  } as User;
}

function membership(
  partial: Partial<Membership> & Pick<Membership, 'player_uid'>,
): Membership {
  return {
    id: `m-${partial.player_uid}`,
    club_id: 'club-1',
    team_id: 'team-u17',
    player_name: 'Joueur',
    status: 'active',
    requested_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  } as Membership;
}

function team(id: string, name: string): Team {
  return {
    id,
    club_id: 'club-1',
    name,
    gender_scope: 'men',
    coach_uids: ['coach-1'],
    is_default: false,
    created_at: new Date(),
    updated_at: new Date(),
  } as Team;
}

function event(overrides: Partial<TeamEvent> = {}): TeamEvent {
  return {
    id: 'ev-1',
    title: 'U17 · FC ProDay / AS Montferrand',
    event_type: 'competition',
    organizer_uid: 'coach-1',
    organizer_name: 'Coach',
    club_id: 'club-1',
    club_name: 'FC ProDay',
    team_id: 'team-u17',
    city: 'Clermont',
    starts_at: new Date(Date.now() + 86_400_000),
    invitee_uids: [],
    rsvps: {},
    categories: [],
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as TeamEvent;
}

function squad(ids: string[], availability: SquadPlayer['availability'] = 'present'): SquadPlayer[] {
  return ids.map((id, index) => ({
    id,
    name: `Joueur ${id}`,
    num: index + 1,
    pos: null,
    availability,
  }));
}

describe('Effectif réel du coach', () => {
  const members = [
    member('p1', 'Théo Marchand', { jersey_number: 9, position: 'Attaquant', category: 'U17' }),
    member('p2', 'Yanis Cherki', { position: 'Gardien' }),
    member('p3', 'Sans Poste'),
    member('p9', 'Autre Équipe', { jersey_number: 4 }),
    member('coach-1', 'Coach Principal', {}, 'coach'),
  ];
  const memberships = [
    membership({ player_uid: 'p1', license_number: '4512789', category: 'U17' }),
    membership({ player_uid: 'p2', status: 'pending' }),
    membership({ player_uid: 'p3' }),
    membership({ player_uid: 'p9', team_id: 'team-seniors' }),
    membership({ player_uid: 'p4', status: 'left' }),
  ];
  const teams = [team('team-u17', 'U17 R1'), team('team-seniors', 'Seniors R2')];

  it('construit l’effectif depuis les adhésions d’équipe et les membres du club', () => {
    const players = buildCoachSquadPlayers({
      members,
      memberships,
      teams,
      teamId: 'team-u17',
      event: null,
    });

    const theo = players.find((player) => player.id === 'p1')!;
    expect(theo.name).toBe('Théo Marchand');
    expect(theo.num).toBe(9);
    expect(theo.pos).toBe('ST');
    expect(theo.licenseNumber).toBe('4512789');
    expect(theo.category).toBe('U17');
    expect(theo.teamName).toBe('U17 R1');
    expect(theo.membershipStatus).toBe('active');
  });

  it('n’invente ni numéro de maillot ni poste', () => {
    const players = buildCoachSquadPlayers({
      members,
      memberships,
      teams,
      teamId: 'team-u17',
      event: null,
    });

    const yanis = players.find((player) => player.id === 'p2')!;
    expect(yanis.num).toBeNull();
    const sansPoste = players.find((player) => player.id === 'p3')!;
    expect(sansPoste.pos).toBeNull();
    expect(sansPoste.num).toBeNull();
    expect(sansPoste.licenseNumber).toBeUndefined();
  });

  it('ne retient que l’équipe active, plus les joueurs convoqués', () => {
    const players = buildCoachSquadPlayers({
      members,
      memberships,
      teams,
      teamId: 'team-u17',
      event: null,
    });
    expect(players.map((player) => player.id).sort()).toEqual(['p1', 'p2', 'p3']);

    const convoked = buildCoachSquadPlayers({
      members,
      memberships,
      teams,
      teamId: 'team-u17',
      /** Un joueur des séniors appelé pour ce match reste alignable. */
      event: event({ invitee_uids: ['p9', 'coach-1'] }),
    });
    expect(convoked.map((player) => player.id).sort()).toEqual(['p1', 'p2', 'p3', 'p9']);
  });

  it('écarte les adhésions de staff et les joueurs partis', () => {
    const players = buildCoachSquadPlayers({
      members,
      memberships,
      teams,
      teamId: 'team-u17',
      event: event({ invitee_uids: ['p4', 'coach-1'] }),
    });
    expect(players.map((player) => player.id)).not.toContain('coach-1');
    expect(players.map((player) => player.id)).not.toContain('p4');
  });

  it('lit la disponibilité sur la convocation réelle', () => {
    const players = buildCoachSquadPlayers({
      members,
      memberships,
      teams,
      teamId: 'team-u17',
      event: event({
        invitee_uids: ['p1', 'p2', 'p3'],
        rsvps: { p1: 'yes', p2: 'no', p3: 'pending' },
      }),
    });
    expect(players.find((player) => player.id === 'p1')!.availability).toBe('present');
    expect(players.find((player) => player.id === 'p2')!.availability).toBe('absent');
    expect(players.find((player) => player.id === 'p3')!.availability).toBe('pending');
  });

  it('sans match à venir, personne n’est déclaré présent', () => {
    const players = buildCoachSquadPlayers({
      members,
      memberships,
      teams,
      teamId: 'team-u17',
      event: null,
    });
    expect(players.every((player) => player.availability === 'pending')).toBe(true);
  });
});

describe('Poste et disponibilité — aucune valeur inventée', () => {
  it('traduit les libellés de profil en codes de cran', () => {
    expect(normalizeSquadPosition('Gardien')).toBe('GK');
    expect(normalizeSquadPosition('Gardien de but')).toBe('GK');
    expect(normalizeSquadPosition('Défenseur central')).toBe('CB');
    expect(normalizeSquadPosition('milieu défensif')).toBe('CDM');
    expect(normalizeSquadPosition('Ailier gauche')).toBe('LW');
    expect(normalizeSquadPosition('Attaquant')).toBe('ST');
    expect(normalizeSquadPosition('Avant-centre')).toBe('ST');
  });

  it('renvoie « non renseigné » plutôt qu’un poste deviné', () => {
    expect(normalizeSquadPosition('libéro')).toBeNull();
    expect(normalizeSquadPosition('')).toBeNull();
    expect(normalizeSquadPosition(undefined)).toBeNull();
  });

  it('lit les RSVP réels et sait écrire les trois états du staff', () => {
    expect(availabilityFromRsvp('yes')).toBe('present');
    expect(availabilityFromRsvp('late_over_10')).toBe('present');
    expect(availabilityFromRsvp('no')).toBe('absent');
    expect(availabilityFromRsvp('maybe')).toBe('absent');
    expect(availabilityFromRsvp('pending')).toBe('pending');

    expect(rsvpFromAvailability('present')).toBe('yes');
    expect(rsvpFromAvailability('absent')).toBe('no');
    expect(rsvpFromAvailability('pending')).toBe('pending');
  });

  it('nomme les états comme le staff les écrit', () => {
    expect(availabilityLabel('present')).toBe('Disponible');
    expect(availabilityLabel('pending')).toBe('En attente');
    expect(availabilityLabel('absent')).toBe('Absent');
  });

  it('trie les disponibles d’abord, puis par nom', () => {
    const players: SquadPlayer[] = [
      { id: 'a', name: 'Zinédine', num: null, pos: null, availability: 'present' },
      { id: 'b', name: 'Amine', num: null, pos: null, availability: 'absent' },
      { id: 'c', name: 'Amara', num: null, pos: null, availability: 'present' },
    ];
    expect([...players].sort(compareSquadReadiness).map((player) => player.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect(isSquadPlayerUnavailable(players[1]!)).toBe(true);
    expect(stripSquadDiacritics('  Théo  ')).toBe('theo');
  });
});

describe('Complétion du onze', () => {
  const positions = PITCH_SLOTS.map(() => null);

  it('conserve les choix du coach et ne remplit que les crans libres', () => {
    const players = squad(['p1', 'p2', 'p3']);
    const filled = fillLineupFromSquad({
      squad: players,
      positions,
      current: [null, 'p2', null],
    });
    expect(filled[1]).toBe('p2');
    expect(new Set(filled.filter(Boolean)).size).toBe(filled.filter(Boolean).length);
    expect(filled.filter(Boolean)).toHaveLength(3);
  });

  it('n’aligne jamais un indisponible', () => {
    const players: SquadPlayer[] = [
      { id: 'absent', name: 'Absent', num: 1, pos: null, availability: 'absent' },
      { id: 'ok', name: 'Disponible', num: 2, pos: null, availability: 'present' },
    ];
    const filled = fillLineupFromSquad({ squad: players, positions: [null, null], current: [] });
    expect(filled).toEqual(['ok', null]);
  });

  it('libère un cran dont le titulaire est devenu indisponible', () => {
    const players: SquadPlayer[] = [
      { id: 'p1', name: 'Blessé', num: 1, pos: null, availability: 'absent' },
    ];
    expect(
      fillLineupFromSquad({ squad: players, positions: [null], current: ['p1'] }),
    ).toEqual([null]);
  });

  it('préfère le joueur dont le poste correspond au cran', () => {
    const players: SquadPlayer[] = [
      { id: 'def', name: 'Défenseur', num: 1, pos: 'CB', availability: 'present' },
      { id: 'att', name: 'Attaquant', num: 2, pos: 'ST', availability: 'present' },
    ];
    expect(
      fillLineupFromSquad({ squad: players, positions: ['ST'], current: [] }),
    ).toEqual(['att']);
  });
});

describe('Publication sur le prochain match', () => {
  const slots = PITCH_SLOTS;
  const byId = new Map(squad(['p1', 'p2', 'p3']).map((player) => [player.id, player]));

  it('publie les titulaires avec le poste du cran, les remplaçants sans', () => {
    const lineup = buildCoachEventLineup({
      formation: '4-3-3',
      slots,
      starterIds: ['p1', null, 'p2'],
      benchIds: ['p3'],
      byId,
    });

    expect(lineup.formation).toBe('4-3-3');
    expect(lineup.slots.filter((slot) => slot.role === 'starter')).toHaveLength(2);
    expect(lineup.slots[0]).toEqual({
      uid: 'p1',
      display_name: 'Joueur p1',
      role: 'starter',
      position_label: slots[0]!.defaultPos,
    });
    const sub = lineup.slots.find((slot) => slot.role === 'sub')!;
    expect(sub.uid).toBe('p3');
    expect(sub.position_label).toBeUndefined();
  });

  it('ne publie ni cran vide ni identifiant inconnu', () => {
    const lineup = buildCoachEventLineup({
      formation: '4-3-3',
      slots,
      starterIds: [null, 'fantôme', null],
      benchIds: ['fantôme'],
      byId,
    });
    expect(lineup.slots).toEqual([]);
  });

  it('ne publie pas deux fois un titulaire passé au banc', () => {
    const lineup = buildCoachEventLineup({
      formation: '4-3-3',
      slots,
      starterIds: ['p1'],
      benchIds: ['p1', 'p2'],
      byId,
    });
    expect(lineup.slots.filter((slot) => slot.uid === 'p1')).toHaveLength(1);
    expect(lineup.slots.filter((slot) => slot.role === 'sub').map((slot) => slot.uid)).toEqual([
      'p2',
    ]);
  });

  it('relit une composition déjà publiée, titulaires dans l’ordre', () => {
    const published = readPublishedLineup({
      formation: '4-4-2',
      slots: [
        { uid: 'p2', display_name: 'Deux', role: 'starter' },
        { uid: 'p1', display_name: 'Un', role: 'starter' },
        { uid: 'p3', display_name: 'Trois', role: 'sub' },
      ],
    });
    expect(published).toEqual({
      formation: '4-4-2',
      starterIds: ['p2', 'p1'],
      benchIds: ['p3'],
    });
    expect(readPublishedLineup(undefined)).toBeNull();
    expect(readPublishedLineup({ formation: '4-3-3', slots: [] })).toBeNull();
  });
});

describe('La page Équipe tourne sur le club réel', () => {
  it('ne charge plus aucune équipe de démonstration', () => {
    const screen = read(SCREEN);
    expect(screen).not.toContain('COACH_DEMO_SQUAD');
    expect(screen).not.toContain('coachSquadDemo');
    expect(fs.existsSync(path.join(ROOT, 'constants/coachSquadDemo.ts'))).toBe(false);
  });

  it('charge l’effectif et les adhésions du club, dans l’équipe active', () => {
    const hook = read(HOOK);
    expect(hook).toContain('membershipsService.listByClub');
    expect(hook).toContain('usersService.listMembersByClubId');
    expect(hook).toContain('teamsService.listByClubId');
    expect(hook).toContain('teamEventsService.listForClub');
    expect(hook).toContain('buildCoachSquadPlayers');
    /** La cible est le prochain match **de l'équipe active**. */
    expect(hook).toContain("event.team_id === teamId");
    expect(hook).toContain('pickLineupTargetEvent');
  });

  it('écrit les disponibilités côté staff, pas dans un état local', () => {
    const hook = read(HOOK);
    expect(hook).toContain('teamEventsService.updateRsvpAsStaff');
    expect(hook).toContain('rsvpFromAvailability');
    const screen = read(SCREEN);
    expect(screen).toContain('roster.setAvailability(playerId, availability)');
    expect(screen).not.toContain('setSquad(');
  });

  it('affiche le pointage immédiatement, et le rétablit si l’écriture échoue', () => {
    const hook = read(HOOK);
    expect(hook).toContain('withRsvp(event, playerId, status)');
    expect(hook).toContain('withRsvp(event, playerId, previousRsvp)');
    expect(hook).toContain('throw writeError');
    expect(hook).toContain("const previousRsvp: RsvpStatus = nextMatch.rsvps[playerId] ?? 'pending'");
  });

  it('relit l’effectif réel après un import ou une synchronisation', () => {
    const screen = read(SCREEN);
    const refreshes = screen.match(/void roster\.refresh\(\)/g) ?? [];
    expect(refreshes).toHaveLength(2);
  });

  it('publie la composition sur le match via saveLineup', () => {
    const hook = read(HOOK);
    expect(hook).toContain('teamEventsService.saveLineup(nextMatch.id, lineup');
    const screen = read(SCREEN);
    expect(screen).toContain('buildCoachEventLineup');
    expect(screen).toContain('publishOnMatch(payload)');
    /** Un bouton de publication qui ne peut pas aboutir est désactivé. */
    expect(screen).toContain('disabled={!canPublish || publishing}');
  });

  it('ne restaure jamais un indisponible sans revenir sur la convocation', () => {
    const screen = read(SCREEN);
    expect(screen).toContain('roster.setAvailability(player.id, player.availability)');
  });

  it('affiche le match cible avant d’agir', () => {
    const screen = read(SCREEN);
    expect(screen).toContain('Prochain match · ');
    expect(screen).toContain('Aucun match à venir : la composition restera un brouillon local.');
  });
});

describe('Plus aucune note simulée', () => {
  it('le modèle d’effectif ne porte que des champs réels', () => {
    const util = read(ROSTER_UTIL);
    ['ovr', 'fatigueRisk', 'pac:', 'sho:', 'dri:', 'phy:'].forEach((needle) => {
      expect({ needle, found: util.includes(needle) }).toEqual({ needle, found: false });
    });
  });

  it('le jeton de joueur et la composition guidée ne notent plus personne', () => {
    expect(read(CARD)).not.toContain('rating');
    expect(read(GUIDE)).not.toContain('Note moyenne');
    expect(read(GUIDE)).not.toContain('ovr');
    expect(read(SCREEN)).not.toContain(' OVR');
    expect(read(SCREEN)).not.toContain('de moyenne');
  });

  it('ne propose plus l’état « blessé », qui n’existe pas dans le modèle', () => {
    const screen = read(SCREEN);
    expect(screen).not.toContain("'injured'");
    expect(screen).not.toContain('Blessé');
  });
});
