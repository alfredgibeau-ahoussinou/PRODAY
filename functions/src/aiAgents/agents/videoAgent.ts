import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function videoAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const clubId = ctx.club_id ?? ctx.uid;

    const snap = await db.collection('smart_tactics_video_jobs')
      .where('club_id', '==', clubId)
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();

    const jobs = snap.docs.map((d) => d.data());
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const pending = jobs.filter((j) => j.status === 'pending' || j.status === 'processing').length;

    const facts = {
      total_videos: jobs.length,
      completed,
      pending,
      recent_titles: jobs.slice(0, 5).map((j) => j.title ?? j.match_title ?? 'Sans titre'),
    };

    return {
      agent: 'video',
      summary: `${jobs.length} analyses vidéo : ${completed} terminées, ${pending} en cours.`,
      facts,
    };
  } catch (e) {
    return { agent: 'video', summary: 'Données vidéo indisponibles.', facts: {}, error: String(e) };
  }
}
