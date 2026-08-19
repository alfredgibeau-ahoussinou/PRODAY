import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function clubAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const clubId = ctx.club_id ?? ctx.uid;
    const [clubSnap, teamsSnap, membershipsSnap] = await Promise.all([
      db.doc(`clubs/${clubId}`).get(),
      db.collection('teams').where('club_id', '==', clubId).limit(40).get(),
      db.collection('memberships').where('club_id', '==', clubId).limit(200).get(),
    ]);

    const club = clubSnap.data() ?? {};
    const teams = teamsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: typeof data.name === 'string' ? data.name : undefined,
        category: typeof data.category === 'string' ? data.category : undefined,
        coach_uids: Array.isArray(data.coach_uids) ? (data.coach_uids as string[]) : undefined,
      };
    });
    const memberships = membershipsSnap.docs.map((d) => d.data());

    const active = memberships.filter((m) => m.status === 'approved' || m.status === 'active').length;
    const pending = memberships.filter((m) => m.status === 'pending').length;

    const facts = {
      club_name: club.name ?? 'Inconnu',
      teams_count: teams.length,
      team_names: teams.slice(0, 12).map((t) => t.name ?? t.category ?? 'Équipe'),
      active_members: active,
      pending_members: pending,
      teams_without_coach: teams.filter(
        (t) => !Array.isArray(t.coach_uids) || t.coach_uids.length === 0,
      ).length,
    };

    return {
      agent: 'club',
      summary: `Club « ${facts.club_name} » : ${facts.teams_count} équipes, ${active} membres actifs, ${pending} en attente.`,
      facts,
    };
  } catch (e) {
    return { agent: 'club', summary: 'Données club indisponibles.', facts: {}, error: String(e) };
  }
}
