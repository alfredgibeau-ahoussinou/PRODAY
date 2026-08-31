import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function analyticsAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const clubId = ctx.club_id ?? ctx.uid;

    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 3600 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000);

    const [eventsSnap, membershipsSnap] = await Promise.all([
      db.collection('team_events')
        .where('club_id', '==', clubId)
        .where('starts_at', '>=', admin.firestore.Timestamp.fromDate(fourWeeksAgo))
        .limit(100)
        .get(),
      db.collection('memberships')
        .where('club_id', '==', clubId)
        .limit(200)
        .get(),
    ]);

    const events = eventsSnap.docs.map((d) => d.data());
    const memberships = membershipsSnap.docs.map((d) => d.data());

    const recentEvents = events.filter((e) => {
      const ts = e.starts_at?.toDate?.();
      return ts && ts >= twoWeeksAgo;
    }).length;
    const olderEvents = events.length - recentEvents;

    const activeMembers = memberships.filter(
      (m) => m.status === 'approved' || m.status === 'active',
    ).length;

    const eventTrend = olderEvents > 0
      ? ((recentEvents - olderEvents) / olderEvents * 100).toFixed(0)
      : '0';

    const facts = {
      events_last_4_weeks: events.length,
      events_last_2_weeks: recentEvents,
      event_trend_pct: Number(eventTrend),
      active_members: activeMembers,
      total_memberships: memberships.length,
    };

    const trendLabel = Number(eventTrend) > 0 ? 'en hausse' : Number(eventTrend) < 0 ? 'en baisse' : 'stable';

    return {
      agent: 'analytics',
      summary: `Activité ${trendLabel} (${eventTrend}%). ${events.length} événements sur 4 semaines, ${activeMembers} membres actifs.`,
      facts,
    };
  } catch (e) {
    return { agent: 'analytics', summary: 'Analyse indisponible.', facts: {}, error: String(e) };
  }
}
