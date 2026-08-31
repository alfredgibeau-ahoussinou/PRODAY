import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d = new Date()): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function countActivitiesSince(
  activities: admin.firestore.DocumentData[],
  since: Date,
): number {
  return activities.filter((a) => {
    const created = a.created_at?.toDate?.() as Date | undefined;
    const date = a.date?.toDate?.() as Date | undefined;
    const ref = created ?? date;
    return ref ? ref >= since : false;
  }).length;
}

/**
 * Agent joueur — contexte profil, activités, wellness, calendrier.
 * Ne invente jamais de stats : facts = données Firestore ou null.
 */
export async function playerAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const uid = ctx.uid;
    const [userSnap, activitiesSnap, wellnessSnap, careerPrefsSnap] = await Promise.all([
      db.doc(`users/${uid}`).get(),
      db
        .collection('player_activities')
        .where('player_uid', '==', uid)
        .orderBy('created_at', 'desc')
        .limit(20)
        .get()
        .catch(() => ({ docs: [] as admin.firestore.QueryDocumentSnapshot[] })),
      db
        .collection('wellness_checkins')
        .where('uid', '==', uid)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get()
        .catch(() => ({ docs: [] as admin.firestore.QueryDocumentSnapshot[] })),
      db.doc(`users/${uid}/v3_prefs/career`).get().catch(() => null),
    ]);

    const user = userSnap.data() ?? {};
    const profile = (user.profile as Record<string, unknown>) ?? {};
    const activities = activitiesSnap.docs.map((d) => d.data());
    const wellnessDoc = wellnessSnap.docs[0]?.data();
    const careerPrefs = careerPrefsSnap?.data?.() ?? {};

    const weekStart = startOfWeek();
    const weeklySessionCount = countActivitiesSince(activities, weekStart);
    const weeklyTarget =
      typeof careerPrefs.weekly_sessions_target === 'number' && careerPrefs.weekly_sessions_target > 0
        ? careerPrefs.weekly_sessions_target
        : 3;
    const weeklyGoalPercent = Math.min(
      100,
      Math.round((weeklySessionCount / weeklyTarget) * 100),
    );

    let nextEvent: Record<string, unknown> | null = null;
    try {
      const now = admin.firestore.Timestamp.now();
      const eventsSnap = await db
        .collection('team_events')
        .where('starts_at', '>=', now)
        .orderBy('starts_at', 'asc')
        .limit(20)
        .get();
      const clubId = profile.club_id ? String(profile.club_id) : null;
      for (const doc of eventsSnap.docs) {
        const data = doc.data();
        const playerUids = Array.isArray(data.player_uids) ? data.player_uids : [];
        const memberUids = Array.isArray(data.member_uids) ? data.member_uids : [];
        const eventClub = data.club_id ? String(data.club_id) : null;
        if (
          playerUids.includes(uid) ||
          memberUids.includes(uid) ||
          (clubId && eventClub === clubId)
        ) {
          const rsvps = (data.rsvps as Record<string, string> | undefined) ?? {};
          nextEvent = {
            id: doc.id,
            title: data.title ?? null,
            event_type: data.event_type ?? null,
            starts_at: data.starts_at?.toDate?.()?.toISOString?.() ?? null,
            rsvp_status: rsvps[uid] ?? null,
          };
          break;
        }
      }
    } catch {
      nextEvent = null;
    }

    const facts = {
      player_name: user.display_name ?? 'Joueur',
      position: profile.position ?? null,
      age: profile.age ?? null,
      gender: profile.gender ?? null,
      club_id: profile.club_id ?? null,
      birth_date: profile.birth_date ?? null,
      recent_activities_count: activities.length,
      activity_types: [...new Set(activities.map((a) => a.activity_type ?? 'unknown'))],
      wellness_score: wellnessDoc?.wellness_score ?? null,
      wellness_date: wellnessDoc?.date_key ?? null,
      wellness_fatigue: wellnessDoc?.fatigue ?? null,
      wellness_recovery: wellnessDoc?.recovery ?? null,
      weekly_session_count: weeklySessionCount,
      weekly_session_target: weeklyTarget,
      weekly_goal_percent: weeklyGoalPercent,
      weekly_focus: typeof careerPrefs.weekly_focus === 'string' ? careerPrefs.weekly_focus : null,
      next_event: nextEvent,
      today: todayKey(),
    };

    const wellnessLine =
      facts.wellness_score != null
        ? `Forme wellness: ${facts.wellness_score}% (${facts.wellness_date})`
        : 'Forme wellness: donnée absente';

    const eventLine = nextEvent
      ? `Prochain événement: ${nextEvent.title} (${nextEvent.event_type})`
      : 'Prochain événement: aucun chargé';

    const weeklyLine = `Semaine: ${weeklySessionCount}/${weeklyTarget} séances (${weeklyGoalPercent}%)`;

    return {
      agent: 'player',
      summary: `Joueur « ${facts.player_name} » · ${activities.length} activités · ${wellnessLine} · ${weeklyLine} · ${eventLine}`,
      facts,
    };
  } catch (e) {
    return {
      agent: 'player',
      summary: 'Données joueur indisponibles.',
      facts: {},
      error: String(e),
    };
  }
}

/** Bloc texte pour prompts Coach IA joueur. */
export function formatPlayerAgentFacts(result: AgentResult): string {
  if (result.error || !result.facts) {
    return 'Contexte joueur partiel ou indisponible.';
  }
  return `Résumé agent: ${result.summary}\nDonnées JSON: ${JSON.stringify(result.facts)}`;
}
