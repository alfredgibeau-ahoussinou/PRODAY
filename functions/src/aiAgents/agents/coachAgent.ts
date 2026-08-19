import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function coachAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const uid = ctx.uid;
    const [userSnap, sessionsSnap, evaluationsSnap] = await Promise.all([
      db.doc(`users/${uid}`).get(),
      db.collection('training_sessions')
        .where('coach_uid', '==', uid)
        .orderBy('created_at', 'desc')
        .limit(10)
        .get(),
      db.collection('player_evaluations')
        .where('evaluator_uid', '==', uid)
        .orderBy('created_at', 'desc')
        .limit(20)
        .get(),
    ]);

    const user = userSnap.data() ?? {};
    const sessions = sessionsSnap.docs.map((d) => d.data());
    const evaluations = evaluationsSnap.docs.map((d) => d.data());

    const facts = {
      coach_name: user.display_name ?? 'Coach',
      recent_sessions: sessions.length,
      recent_evaluations: evaluations.length,
      avg_rating: evaluations.length > 0
        ? +(evaluations.reduce((s, e) => s + (Number(e.rating) || 0), 0) / evaluations.length).toFixed(1)
        : null,
    };

    return {
      agent: 'coach',
      summary: `Coach « ${facts.coach_name} » : ${facts.recent_sessions} séances récentes, ${facts.recent_evaluations} évaluations.`,
      facts,
    };
  } catch (e) {
    return { agent: 'coach', summary: 'Données coach indisponibles.', facts: {}, error: String(e) };
  }
}
