import * as admin from 'firebase-admin';
import type { AgentContext, AgentResult } from '../types';

const db = admin.firestore();

export async function revenueAgent(ctx: AgentContext): Promise<AgentResult> {
  try {
    const clubId = ctx.club_id ?? ctx.uid;

    const [paymentsSnap, subsSnap] = await Promise.all([
      db.collection('team_payment_requests')
        .where('club_id', '==', clubId)
        .orderBy('created_at', 'desc')
        .limit(50)
        .get(),
      db.collection('users')
        .where('role', '==', 'club')
        .limit(1)
        .get(),
    ]);

    const payments = paymentsSnap.docs.map((d) => d.data());
    const paid = payments.filter((p) => p.status === 'paid');
    const pending = payments.filter((p) => p.status === 'pending');
    const totalPaid = paid.reduce((s, p) => s + (Number(p.amount_eur) || 0), 0);
    const totalPending = pending.reduce((s, p) => s + (Number(p.amount_eur) || 0), 0);

    const subData = subsSnap.docs[0]?.data();
    const tier = subData?.subscription_tier ?? 'free';

    const facts = {
      total_payments: payments.length,
      paid_count: paid.length,
      pending_count: pending.length,
      total_paid_eur: totalPaid,
      total_pending_eur: totalPending,
      subscription_tier: tier,
    };

    return {
      agent: 'revenue',
      summary: `${paid.length} paiements encaissés (${totalPaid}€), ${pending.length} en attente (${totalPending}€). Abonnement : ${tier}.`,
      facts,
    };
  } catch (e) {
    return { agent: 'revenue', summary: 'Données financières indisponibles.', facts: {}, error: String(e) };
  }
}
