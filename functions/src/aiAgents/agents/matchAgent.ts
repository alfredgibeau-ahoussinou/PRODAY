import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function matchAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const clubId = ctx.club_id ?? ctx.uid;
    const teamId = ctx.team_id;

    let eventsQuery = db.collection('team_events')
      .where('event_type', 'in', ['match', 'competition'])
      .orderBy('starts_at', 'desc')
      .limit(20);

    if (teamId) {
      eventsQuery = db.collection('team_events')
        .where('team_id', '==', teamId)
        .where('event_type', 'in', ['match', 'competition'])
        .orderBy('starts_at', 'desc')
        .limit(20);
    }

    const [eventsSnap, standingsSnap] = await Promise.all([
      eventsQuery.get(),
      db.collection('competition_standings')
        .where('club_id', '==', clubId)
        .limit(5)
        .get(),
    ]);

    const events = eventsSnap.docs.map((d) => d.data());
    const standings = standingsSnap.docs.map((d) => d.data());

    const wins = events.filter((e) => e.result === 'win').length;
    const losses = events.filter((e) => e.result === 'loss').length;
    const draws = events.filter((e) => e.result === 'draw').length;

    const now = new Date();
    const upcoming = events.filter((e) => {
      const ts = e.starts_at?.toDate?.();
      return ts && ts > now;
    }).length;

    const facts = {
      total_matches: events.length,
      wins, losses, draws, upcoming,
      standings: standings.map((s) => ({
        competition: s.competition_name ?? s.competition_id,
        rank: s.rank,
        points: s.points,
      })),
    };

    return {
      agent: 'match',
      summary: `${events.length} matchs récents : ${wins}V ${draws}N ${losses}D. ${upcoming} à venir.`,
      facts,
    };
  } catch (e) {
    return { agent: 'match', summary: 'Données matchs indisponibles.', facts: {}, error: String(e) };
  }
}
