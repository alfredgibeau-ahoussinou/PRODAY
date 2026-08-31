import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function trainingAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const teamId = ctx.team_id;
    const clubId = ctx.club_id ?? ctx.uid;

    const query = teamId
      ? db.collection('training_sessions').where('team_id', '==', teamId).orderBy('created_at', 'desc').limit(15)
      : db.collection('training_sessions').where('club_id', '==', clubId).orderBy('created_at', 'desc').limit(15);

    const snap = await query.get();
    const sessions = snap.docs.map((d) => d.data());

    const thisWeek = sessions.filter((s) => {
      const ts = s.created_at?.toDate?.();
      if (!ts) return false;
      const diff = Date.now() - ts.getTime();
      return diff < 7 * 24 * 3600 * 1000;
    }).length;

    const facts = {
      recent_sessions: sessions.length,
      this_week: thisWeek,
      types: [...new Set(sessions.map((s) => s.session_type ?? 'general'))],
    };

    return {
      agent: 'training',
      summary: `${sessions.length} séances récentes, ${thisWeek} cette semaine.`,
      facts,
    };
  } catch (e) {
    return { agent: 'training', summary: 'Données entraînement indisponibles.', facts: {}, error: String(e) };
  }
}
