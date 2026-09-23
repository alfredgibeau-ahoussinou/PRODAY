/**
 * Mappers purs « données réelles » pour les hubs Club reconnectés (DATA-01).
 * Aucune donnée de démonstration : ces fonctions dérivent les modèles d'affichage
 * exclusivement des documents Firestore déjà chargés (événements, équipes,
 * annonces, offres de covoiturage). Champs absents => valeurs neutres affichées
 * telles quelles (« — », 0), jamais inventées.
 */
import type { TeamEvent } from '../models/TeamEvent';
import type { Team } from '../models/Team';
import type { User } from '../models/User';
import type { ClubAnnouncement } from '../models/ClubAnnouncement';
import type { StandaloneCarpoolOffer } from '../models/StandaloneCarpoolOffer';
import type { CarpoolVehicleType } from '../models/CarpoolVehicle';
import type { SessionCheckInItem } from '../features/club/ui/ClubTrainingsOversight';
import type { LeaderboardPlayer } from '../features/club/ui/ClubMatchesCenter';
import type { ClubChannelItem } from '../features/club/ui/ClubChannelsHub';
import type { CarpoolVehicle } from '../features/club/ui/ClubCarpoolBoard';
import type { PitchFacility, PitchSlot } from '../features/club/ui/ClubPitchSchedule';

function dateOf(value: Date | string | undefined): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    if (Number.isFinite(d.getTime())) return d;
  }
  return new Date(NaN);
}

function timeRangeOf(start: Date, durationMin: number | undefined): string {
  if (!Number.isFinite(start.getTime())) return '—';
  const fmt = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (durationMin && durationMin > 0) {
    const end = new Date(start.getTime() + durationMin * 60_000);
    return `${fmt(start)} - ${fmt(end)}`;
  }
  return fmt(start);
}

/* ------------------------------------------------------------------ */
/* Suivi des entraînements — séances réelles issues des TeamEvent      */
/* ------------------------------------------------------------------ */

function statusOfEvent(start: Date, end: Date | undefined, now: number): SessionCheckInItem['status'] {
  const startTime = start.getTime();
  if (!Number.isFinite(startTime)) return 'upcoming';
  const endTime = end?.getTime() ?? startTime + 90 * 60_000;
  if (now < startTime) return 'upcoming';
  if (now <= endTime) return 'in_progress';
  return 'completed';
}

/**
 * Dérive les séances de suivi DT depuis les événements réels de type
 * `training` (ou toute convocation avec effectif convoqué). Les compteurs
 * de présence utilisent exclusivement les RSVP/pointages persistés :
 * un champ absent vaut 0, jamais une valeur estimée.
 */
export function buildSessionCheckIns(
  events: TeamEvent[],
  teamNames: Map<string, string>,
  memberNames: Map<string, string>,
  now: number = Date.now(),
): SessionCheckInItem[] {
  return events
    .filter((e) => e.event_type === 'training')
    .map((e) => {
      const start = dateOf(e.starts_at ?? dateOf(e.date));
      const invites = e.invitee_uids ?? [];
      const rsvps = e.rsvps ?? {};
      const presents = invites.filter((uid) => rsvps[uid] === 'yes').length;
      const absents = invites.filter((uid) => rsvps[uid] === 'no').length;
      const injured = invites.filter(
        (uid) => rsvps[uid] === 'no' && (e.rsvp_notes?.[uid] ?? '').toLowerCase().includes('bless'),
      ).length;
      const attended = e.attendance_marks ?? {};
      const markedPresent = invites.filter(
        (uid) => attended[uid] === 'present' || attended[uid] === 'late',
      ).length;
      return {
        sessionId: e.id,
        teamName: (e.team_id ? teamNames.get(e.team_id) : undefined) ?? e.club_name ?? 'Équipe',
        category: e.categories?.[0] ?? '—',
        coachName: memberNames.get(e.organizer_uid) ?? (e.organizer_name || '—'),
        timeRange: timeRangeOf(start, e.duration_minutes),
        pitchName: e.location_label ?? e.location ?? '—',
        status: statusOfEvent(start, e.ends_at, now),
        totalInvited: invites.length,
        presentsCount: markedPresent > 0 ? markedPresent : presents,
        absentsCount: absents,
        injuredCount: injured,
        validationStatus: 'pending' as const,
      };
    })
    .sort((a, b) => {
      const rank = (s: SessionCheckInItem['status']) =>
        s === 'in_progress' ? 0 : s === 'upcoming' ? 1 : 2;
      return rank(a.status) - rank(b.status);
    });
}

/* ------------------------------------------------------------------ */
/* Buteurs — stats réelles persistées sur les matchs                   */
/* ------------------------------------------------------------------ */

/**
 * Agrège les buts et matchs joués depuis `player_match_stats` des événements
 * compétition/amical terminés. Aucun but n'est inventé : sans stats
 * persistées, la liste est vide et l'écran affiche son état honnête.
 */
export function buildTopScorers(
  events: TeamEvent[],
  memberNames: Map<string, string>,
  teamNamesById: Map<string, string> = new Map(),
): LeaderboardPlayer[] {
  const goalsByUid = new Map<string, number>();
  const matchesByUid = new Map<string, number>();
  const teamNameByUid = new Map<string, string>();

  for (const e of events) {
    if (e.event_type !== 'competition' && e.event_type !== 'friendly') continue;
    const stats = e.player_match_stats ?? {};
    const statEntries = Object.entries(stats);
    if (statEntries.length === 0) continue;
    const teamName =
      (e.team_id ? teamNamesById.get(e.team_id) : undefined) ?? e.club_name ?? 'Équipe';
    for (const [uid, stat] of statEntries) {
      if (stat?.status === 'draft') continue;
      matchesByUid.set(uid, (matchesByUid.get(uid) ?? 0) + 1);
      const goals = stat?.goals ?? 0;
      if (goals > 0) goalsByUid.set(uid, (goalsByUid.get(uid) ?? 0) + goals);
      if (!teamNameByUid.has(uid)) teamNameByUid.set(uid, teamName);
    }
  }

  return Array.from(goalsByUid.entries())
    .map(([uid, goals]) => ({
      name: memberNames.get(uid) ?? uid.slice(0, 8),
      team: teamNameByUid.get(uid) ?? '—',
      goals,
      matches: matchesByUid.get(uid) ?? 0,
    }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10)
    .map((row, i) => ({ rank: i + 1, ...row }));
}

/* ------------------------------------------------------------------ */
/* Canaux — équipes réelles + annonces officielles                     */
/* ------------------------------------------------------------------ */

const ANNOUNCEMENT_PLACEHOLDER = 'Aucune annonce publiée pour l’instant.';

/**
 * Canaux dérivés de données réelles : une entrée « Annonces officielles »
 * alimentée par les annonces persistées du club, et un canal par équipe
 * existante. Le dernier message n'est pas inventé : sans annonce récente,
 * un libellé neutre est affiché et le compteur reste à 0.
 */
export function buildClubChannels(
  teams: Team[],
  announcements: ClubAnnouncement[],
): ClubChannelItem[] {
  const channels: ClubChannelItem[] = [];

  const latest = [...announcements]
    .filter((a) => Number.isFinite(dateOf(a.created_at).getTime()))
    .sort((a, b) => dateOf(b.created_at).getTime() - dateOf(a.created_at).getTime())[0];

  channels.push({
    id: 'announcements',
    name: 'Annonces Officielles',
    category: 'official',
    categoryLabel: 'Officiel Bureau',
    description: 'Communications officielles du club (lecture seule pour les membres)',
    readOnlyForMembers: true,
    unreadCount: 0,
    lastMessage: latest
      ? {
          author: latest.author_name || 'Direction',
          text: latest.title || latest.body,
          time: dateOf(latest.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          }),
        }
      : {
          author: '—',
          text: ANNOUNCEMENT_PLACEHOLDER,
          time: '—',
        },
  });

  for (const team of teams) {
    channels.push({
      id: `team-${team.id}`,
      name: team.name,
      category: 'team',
      categoryLabel: team.category ?? 'Équipe',
      description: `Équipe ${team.name}${team.category ? ` · ${team.category}` : ''}`,
      readOnlyForMembers: false,
      unreadCount: 0,
      lastMessage: {
        author: '—',
        text: 'Aucun message dans ce canal.',
        time: '—',
      },
    });
  }

  return channels;
}

/* ------------------------------------------------------------------ */
/* Covoiturage — offres standalone persistées                          */
/* ------------------------------------------------------------------ */

function passengersOf(offer: StandaloneCarpoolOffer): string[] {
  return (offer.passengers ?? []).map((p) => p.name);
}

function vehicleTypeLabel(t: CarpoolVehicleType | undefined): string {
  if (!t) return 'Véhicule';
  const labels: Record<CarpoolVehicleType, string> = {
    citadine: 'Citadine',
    berline: 'Berline',
    break: 'Break',
    suv: 'SUV',
    monospace: 'Monospace',
    utilitaire: 'Utilitaire',
    pickup: 'Pick-up',
    minibus: 'Minibus',
    car: 'Véhicule',
  };
  return labels[t] ?? 'Véhicule';
}

/**
 * Cartes véhicules dérivées des offres Firestore réelles (statut `open`).
 * Champs absents (destination, téléphone) => valeur neutre affichée,
 * jamais un faux numéro ni un faux stade.
 */
export function buildCarpoolVehicles(
  offers: StandaloneCarpoolOffer[],
): CarpoolVehicle[] {
  return offers
    .filter((o) => o.status === 'open')
    .map((o) => {
      const seats = Math.max(0, o.seats - (o.passengers?.length ?? 0));
      const departs = dateOf(o.departs_at);
      return {
        id: o.id,
        driverName: o.driver_name || 'Conducteur',
        driverRole: o.club_only ? 'Membre du club' : 'Conducteur',
        vehicleModel: vehicleTypeLabel(o.vehicle_type),
        totalSeats: o.seats,
        availableSeats: seats,
        meetupPoint: o.meeting_place ?? o.city ?? '—',
        departureTime: Number.isFinite(departs.getTime())
          ? departs.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '—',
        destinationStadium: o.destination_label ?? '—',
        passengers: passengersOf(o),
        contactPhone: '',
      };
    });
}

/* ------------------------------------------------------------------ */
/* Terrains — plages dérivées des entraînements réels                  */
/* ------------------------------------------------------------------ */

const REALIZED_PITCHES: PitchFacility['id'][] = ['grass', 'synthetic_a', 'synthetic_b', 'stabilized'];

function pitchIdFor(locationLabel: string | undefined, index: number): PitchFacility['id'] {
  const label = (locationLabel ?? '').toLowerCase();
  if (label.includes('honneur') || label.includes('naturelle') || label.includes('pelouse')) {
    return 'grass';
  }
  if (label.includes('b')) return 'synthetic_b';
  if (label.includes('a') || label.includes('synth')) return 'synthetic_a';
  return REALIZED_PITCHES[index % REALIZED_PITCHES.length];
}

function pitchDisplayName(id: PitchFacility['id']): string {
  const names: Record<PitchFacility['id'], string> = {
    grass: "Terrain d'Honneur",
    synthetic_a: 'Synthétique A',
    synthetic_b: 'Synthétique B',
    stabilized: 'Terrain Stabilisé / Futsal',
  };
  return names[id];
}

/**
 * Regroupe les créneaux d'entraînement réels par terrain déduit du libellé
 * du lieu. Les créneaux absents de la base ne sont pas fabriqués : un
 * terrain sans créneau enregistré n'apparaît pas.
 */
export function buildPitchFacilities(
  events: TeamEvent[],
  teamNames: Map<string, string> = new Map(),
): PitchFacility[] {
  const byId = new Map<PitchFacility['id'], PitchSlot[]>();

  events
    .filter((e) => e.event_type === 'training')
    .forEach((e) => {
      const start = dateOf(e.starts_at ?? dateOf(e.date));
      if (!Number.isFinite(start.getTime())) return;
      const pitchId = pitchIdFor(e.location_label ?? e.location, byId.size);
      const slots = byId.get(pitchId) ?? [];
      const end = e.ends_at ?? (e.duration_minutes
        ? new Date(start.getTime() + e.duration_minutes * 60_000)
        : undefined);
      const fmt = (d: Date) =>
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      slots.push({
        id: `slot-${e.id}`,
        timeRange: end ? `${fmt(start)} - ${fmt(end)}` : fmt(start),
        pitchId,
        teamName: (e.team_id ? teamNames.get(e.team_id) : undefined) ?? e.club_name ?? 'Équipe',
        category: e.categories?.[0] ?? '—',
        coachName: e.organizer_name || '—',
        changingRoom: '—',
        lightsRequired: start.getHours() >= 18,
      });
      byId.set(pitchId, slots);
    });

  return Array.from(byId.entries()).map(([id, slots]) => ({
    id,
    name: pitchDisplayName(id),
    surface: '—',
    status: 'open' as const,
    lighting: true,
    slots,
  }));
}
