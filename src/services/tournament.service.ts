import type { Tournament, TournamentAwards } from '../models/Tournament';
import type { GeoPoint } from '../models/User';

export interface CreateTournamentInput {
  name: string;
  organizer_id: string;
  city: string;
  location: GeoPoint;
  date_start: Date;
  date_end: Date;
  categories: string[];
}

export const tournamentService = {
  async create(input: CreateTournamentInput): Promise<Tournament> {
    const tournament: Tournament = {
      id: `tour_${Date.now()}`,
      name: input.name,
      organizer_id: input.organizer_id,
      location: input.location,
      city: input.city,
      date_start: input.date_start,
      date_end: input.date_end,
      categories: input.categories,
      status: 'OPEN',
      subscriber_uids: [],
    };
    // [FIREBASE] await db.collection('tournaments').doc(tournament.id).set(tournament);
    // [CLOUD FUNCTION] onTournamentCreated → géofencing agents 50km
    return tournament;
  },

  async submitAwards(
    tournamentId: string,
    awards: TournamentAwards
  ): Promise<void> {
    // [FIREBASE] await db.collection('tournaments').doc(tournamentId).update({ awards });
    // [CLOUD FUNCTION] onMatchFinished → push aux abonnés
    console.log(`[Tournament] Awards submitted for ${tournamentId}`, awards);
  },

  async incrementScore(
    matchId: string,
    team: 'a' | 'b'
  ): Promise<void> {
    const field = team === 'a' ? 'score_a' : 'score_b';
    // [FIREBASE] await db.collection('matches').doc(matchId).update({ [field]: increment(1) });
    console.log(`[LiveScore] ${matchId} +1 team ${team} (${field})`);
  },
};
