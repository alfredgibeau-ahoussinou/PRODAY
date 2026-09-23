/**
 * Effectif Coach — **données réelles du club**, et non plus une équipe de
 * démonstration.
 *
 * La source est le couple (membres du club, adhésions d'équipe) complété par la
 * convocation du prochain match. Rien n'est inventé : un joueur sans numéro de
 * maillot n'en reçoit pas (`num: null`), un profil muet sur son poste donne
 * `pos: null`, et la disponibilité n'est que la **lecture** du RSVP réel de la
 * convocation. Les notes FUT (OVR, moyenne, forme, fatigue, PAC/TIR/…) de
 * l'ancienne équipe de démonstration n'existent nulle part dans le modèle du
 * club : elles disparaissent au lieu d'être simulées.
 *
 * Tout est pur : aucune lecture réseau, aucun jeton de thème, donc directement
 * testable.
 */

import type { Membership } from '../models/Membership';
import type { Team } from '../models/Team';
import { isLateRsvp, userRsvp, type EventLineup, type RsvpStatus, type TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';
import type { PitchSlot } from '../constants/tacticalMatrix';

/** Poste de football — mêmes codes que les crans de terrain (`defaultPos`). */
export type SquadPosition =
  | 'GK'
  | 'LB'
  | 'CB'
  | 'RB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'RW'
  | 'LW'
  | 'ST';

/**
 * Disponibilité dérivée du RSVP de la convocation — trois états seulement, ceux
 * que le staff peut réellement écrire via `updateRsvpAsStaff`.
 */
export type SquadAvailability = 'present' | 'pending' | 'absent';

export type SquadStats = { matches: number; goals: number; assists: number };

export type SquadPlayer = {
  /** `uid` du membre — identifiant stable, utilisé par le brouillon et la publication. */
  id: string;
  name: string;
  /** Numéro de maillot réel (`profile.jersey_number`). `null` = non renseigné. */
  num: number | null;
  /** Poste déduit du profil. `null` = profil muet, jamais deviné. */
  pos: SquadPosition | null;
  availability: SquadAvailability;
  photoUrl?: string | null;
  /** Renseignements d'adhésion — affichés dans la fiche, jamais sur la pelouse. */
  teamName?: string;
  category?: string;
  licenseNumber?: string;
  membershipStatus?: Membership['status'];
  seasonStats?: SquadStats;
};

export const SQUAD_AVAILABILITY_LABELS: Record<SquadAvailability, string> = {
  present: 'Disponible',
  pending: 'En attente',
  absent: 'Absent',
};

export function availabilityLabel(availability: SquadAvailability): string {
  return SQUAD_AVAILABILITY_LABELS[availability];
}

/** Minuscules sans diacritiques — le profil club est saisi librement. */
export function stripSquadDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Libellés de poste du profil (`position?: 'Attaquant' | 'Défenseur' | …`) vers
 * les codes de cran. Une valeur inconnue donne `null` : on préfère « poste non
 * renseigné » à un poste inventé.
 */
const POSITION_ALIASES: Record<string, SquadPosition> = {
  gk: 'GK',
  gb: 'GK',
  goal: 'GK',
  keeper: 'GK',
  gardien: 'GK',
  'gardien de but': 'GK',
  gdb: 'GK',
  lb: 'LB',
  dg: 'LB',
  'lateral gauche': 'LB',
  'arriere gauche': 'LB',
  'defenseur gauche': 'LB',
  rb: 'RB',
  dd: 'RB',
  'lateral droit': 'RB',
  'arriere droit': 'RB',
  'defenseur droit': 'RB',
  cb: 'CB',
  dc: 'CB',
  defenseur: 'CB',
  'defenseur central': 'CB',
  'defenseur axial': 'CB',
  cdm: 'CDM',
  md: 'CDM',
  sentinelle: 'CDM',
  'milieu defensif': 'CDM',
  cm: 'CM',
  mc: 'CM',
  milieu: 'CM',
  'milieu central': 'CM',
  relayeur: 'CM',
  'box to box': 'CM',
  cam: 'CAM',
  mo: 'CAM',
  'milieu offensif': 'CAM',
  meneur: 'CAM',
  lw: 'LW',
  ag: 'LW',
  'ailier gauche': 'LW',
  rw: 'RW',
  ad: 'RW',
  'ailier droit': 'RW',
  st: 'ST',
  ac: 'ST',
  attaquant: 'ST',
  buteur: 'ST',
  'avant centre': 'ST',
  'avant-centre': 'ST',
};

export function normalizeSquadPosition(raw: string | null | undefined): SquadPosition | null {
  if (!raw) return null;
  const key = stripSquadDiacritics(raw);
  if (!key) return null;
  return POSITION_ALIASES[key] ?? null;
}

/** RSVP réel → disponibilité d'effectif. « Peut-être » n'est pas un accord. */
export function availabilityFromRsvp(status: RsvpStatus): SquadAvailability {
  if (status === 'yes' || isLateRsvp(status)) return 'present';
  if (status === 'no' || status === 'maybe') return 'absent';
  return 'pending';
}

/** Disponibilité d'effectif → RSVP écrit côté staff (l'unique chemin d'écriture). */
export function rsvpFromAvailability(availability: SquadAvailability): RsvpStatus {
  if (availability === 'present') return 'yes';
  if (availability === 'absent') return 'no';
  return 'pending';
}

export function isSquadPlayerUnavailable(player: SquadPlayer): boolean {
  return player.availability === 'absent';
}

const AVAILABILITY_RANK: Record<SquadAvailability, number> = {
  present: 0,
  pending: 1,
  absent: 2,
};

/**
 * Disponible d'abord. Aucune note n'existe pour départager : on trie ensuite par
 * nom, pour que l'ordre soit **stable et explicable** au coach.
 */
export function compareSquadReadiness(a: SquadPlayer, b: SquadPlayer): number {
  const availability = AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability];
  if (availability !== 0) return availability;
  return a.name.localeCompare(b.name, 'fr');
}

/** Une adhésion alignable : ni staff, ni parent, ni sortie du club. */
function isPlayerMembership(membership: Membership): boolean {
  if (membership.role === 'coach' || membership.role === 'parent') return false;
  return membership.status !== 'left' && membership.status !== 'rejected';
}

export type CoachSquadInput = {
  /** Tous les membres du club (source des noms, numéros, photos). */
  members: User[];
  /** Adhésions du club — le rattachement joueur ↔ équipe. */
  memberships: Membership[];
  teams: Team[];
  /** Équipe active du coach. Sans elle, tout le club est proposé. */
  teamId?: string;
  /** Prochain match / convocation : source de disponibilité et de publication. */
  event?: TeamEvent | null;
};

/**
 * Effectif sélectionnable du coach — équipe active, élargi aux joueurs convoqués
 * pour le prochain match (un convoqué reste alignable même si son adhésion
 * d'équipe n'est pas encore à jour).
 */
export function buildCoachSquadPlayers(input: CoachSquadInput): SquadPlayer[] {
  const memberByUid = new Map(input.members.map((member) => [member.uid, member]));
  const teamById = new Map(input.teams.map((team) => [team.id, team]));

  const scoped = input.memberships.filter(
    (membership) => isPlayerMembership(membership) && (!input.teamId || membership.team_id === input.teamId),
  );

  const membershipByUid = new Map<string, Membership>();
  scoped.forEach((membership) => {
    const existing = membershipByUid.get(membership.player_uid);
    // Une adhésion active décrit mieux le joueur qu'une demande en attente.
    if (!existing || (existing.status !== 'active' && membership.status === 'active')) {
      membershipByUid.set(membership.player_uid, membership);
    }
  });

  const uids = new Set(membershipByUid.keys());
  (input.event?.invitee_uids ?? []).forEach((uid) => {
    if (memberByUid.get(uid)?.role === 'player') uids.add(uid);
  });

  const players: SquadPlayer[] = [];
  uids.forEach((uid) => {
    const member = memberByUid.get(uid);
    const membership = membershipByUid.get(uid);
    if (!member && !membership) return;

    const jersey = member?.profile?.jersey_number;
    const team = membership ? teamById.get(membership.team_id) : undefined;
    const seasonStats = member?.profile?.season_stats;

    players.push({
      id: uid,
      name: member?.display_name?.trim() || membership?.player_name?.trim() || 'Joueur',
      num: typeof jersey === 'number' && jersey > 0 ? jersey : null,
      pos: normalizeSquadPosition(member?.profile?.position),
      availability: input.event ? availabilityFromRsvp(userRsvp(input.event, uid)) : 'pending',
      photoUrl: member?.avatar_url ?? null,
      teamName: team?.name,
      category: membership?.category ?? member?.profile?.category,
      licenseNumber: membership?.license_number,
      membershipStatus: membership?.status,
      seasonStats,
    });
  });

  return players.sort(compareSquadReadiness);
}

/**
 * Complète le onze sans jamais aligner un indisponible.
 *
 * Les choix **déjà posés sont conservés** : la règle ne fait que remplir les
 * crans libres, en préférant un joueur dont le poste correspond au cran, puis un
 * joueur sans poste renseigné, puis le reste.
 */
export function fillLineupFromSquad(input: {
  squad: SquadPlayer[];
  /** Poste attendu de chaque cran, dans l'ordre des crans du système. */
  positions: (SquadPosition | null)[];
  current: (string | null)[];
}): (string | null)[] {
  const byId = new Map(input.squad.map((player) => [player.id, player]));
  const slotCount = input.positions.length;

  const next: (string | null)[] = [];
  const used = new Set<string>();
  for (let index = 0; index < slotCount; index += 1) {
    const candidate = input.current[index] ?? null;
    const player = candidate ? byId.get(candidate) : undefined;
    if (player && !isSquadPlayerUnavailable(player) && !used.has(player.id)) {
      used.add(player.id);
      next.push(player.id);
      continue;
    }
    next.push(null);
  }

  const pickable = input.squad
    .filter((player) => !isSquadPlayerUnavailable(player) && !used.has(player.id))
    .sort(compareSquadReadiness);

  for (let index = 0; index < slotCount; index += 1) {
    if (next[index]) continue;
    const expected = input.positions[index] ?? null;
    const byFit = [...pickable].sort((a, b) => {
      const fit = (player: SquadPlayer): number => {
        if (!expected) return 1;
        if (player.pos === expected) return 0;
        return player.pos === null ? 1 : 2;
      };
      const diff = fit(a) - fit(b);
      return diff !== 0 ? diff : compareSquadReadiness(a, b);
    });
    const chosen = byFit[0];
    if (!chosen) break;
    next[index] = chosen.id;
    used.add(chosen.id);
    pickable.splice(
      pickable.findIndex((player) => player.id === chosen.id),
      1,
    );
  }

  return next;
}

/**
 * Composition → charge utile de `teamEventsService.saveLineup`.
 *
 * Seuls les crans occupés produisent une entrée : une composition publiée ne
 * contient jamais de poste vide ni de joueur inconnu.
 */
export function buildCoachEventLineup(input: {
  formation: string;
  slots: PitchSlot[];
  starterIds: (string | null)[];
  benchIds: string[];
  byId: Map<string, SquadPlayer>;
}): EventLineup {
  const slots: EventLineup['slots'] = [];

  input.starterIds.forEach((id, index) => {
    if (!id) return;
    const player = input.byId.get(id);
    if (!player) return;
    slots.push({
      uid: player.id,
      display_name: player.name,
      role: 'starter',
      position_label: input.slots[index]?.defaultPos,
    });
  });

  const starterIds = new Set(input.starterIds.filter((id): id is string => !!id));
  input.benchIds.forEach((id) => {
    // Un remplaçant déjà titulaire n'est pas publié deux fois.
    if (starterIds.has(id)) return;
    const player = input.byId.get(id);
    if (!player) return;
    slots.push({
      uid: player.id,
      display_name: player.name,
      role: 'sub',
    });
  });

  return { formation: input.formation, slots };
}

/**
 * Relit une composition **déjà publiée** sur l'événement : c'est la vérité de
 * l'équipe, elle passe devant un brouillon local.
 *
 * La liste des titulaires est rendue telle qu'elle a été publiée — son nombre
 * de rangs est justement ce qui permet de retrouver le format.
 */
export function readPublishedLineup(
  lineup: EventLineup | undefined | null,
): { formation?: string; starterIds: string[]; benchIds: string[] } | null {
  if (!lineup || lineup.slots.length === 0) return null;
  return {
    formation: lineup.formation || undefined,
    starterIds: lineup.slots.filter((slot) => slot.role === 'starter').map((slot) => slot.uid),
    benchIds: lineup.slots.filter((slot) => slot.role === 'sub').map((slot) => slot.uid),
  };
}
