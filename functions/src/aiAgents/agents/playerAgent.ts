import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function playerAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const uid = ctx.uid;
    const [userSnap, activitiesSnap] = await Promise.all([
      db.doc(`users/${uid}`).get(),
      db.collection('player_activities')
        .where('player_uid', '==', uid)
        .orderBy('created_at', 'desc')
        .limit(20)
        .get(),
    ]);

    const user = userSnap.data() ?? {};
    const profile = (user.profile as Record<string, unknown>) ?? {};
    const activities = activitiesSnap.docs.map((d) => d.data());

    const facts = {
      player_name: user.display_name ?? 'Joueur',
      position: profile.position ?? null,
      age: profile.age ?? null,
      recent_activities: activities.length,
      activity_types: [...new Set(activities.map((a) => a.activity_type ?? 'unknown'))],
    };

    return {
      agent: 'player',
      summary: `Joueur « ${facts.player_name} » : ${activities.length} activités récentes.`,
      facts,
    };
  } catch (e) {
    return { agent: 'player', summary: 'Données joueur indisponibles.', facts: {}, error: String(e) };
  }
}
