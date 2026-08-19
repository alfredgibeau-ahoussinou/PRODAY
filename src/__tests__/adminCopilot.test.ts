import {
  answerAdminCopilot,
  buildAdminCopilotFacts,
  computeWeeklyDeltaPct,
  detectAdminCopilotIntent,
  ADMIN_COPILOT_MISSING,
  ADMIN_COPILOT_INSUFFICIENT_HISTORY,
  type AdminCopilotSnapshot,
} from '../utils/adminCopilot';
import { evaluateAdminAutomations } from '../utils/adminIntel';
import { isAdminCopilotShortQuery } from '../utils/adminWorkNavigation';
import type { AdminWorkItem } from '../utils/adminInsights';
import type { PlatformDailySnapshot } from '../services/admin.service';

function emptySnapshot(over: Partial<AdminCopilotSnapshot> = {}): AdminCopilotSnapshot {
  return {
    users: [],
    clubs: [],
    events: [],
    payments: [],
    workQueue: [],
    reelReports: [],
    cameras: [],
    dailySnapshots: [],
    ...over,
  };
}

describe('adminCopilot', () => {
  it('détecte les intents FR sans halluciner', () => {
    expect(detectAdminCopilotIntent('Combien de clubs ?')).toBe('counts');
    expect(detectAdminCopilotIntent('clubs inactifs')).toBe('inactive_clubs');
    expect(detectAdminCopilotIntent('paiements échoués')).toBe('payments');
    expect(detectAdminCopilotIntent('prépare un rapport')).toBe('report');
    expect(detectAdminCopilotIntent('quels utilisateurs contacter')).toBe('contact_users');
    expect(detectAdminCopilotIntent('abracadabra xyz')).toBe('unknown');
  });

  it('compte uniquement les faits fournis', () => {
    const facts = buildAdminCopilotFacts(
      emptySnapshot({
        users: [
          { uid: '1', display_name: 'A', email: 'a@x.fr', role: 'player', subscription_tier: 'pro' },
          { uid: '2', display_name: 'B', email: 'b@x.fr', role: 'coach', subscription_tier: 'free' },
          { uid: '3', display_name: 'C', email: 'c@x.fr', role: 'player' },
        ],
        clubs: [
          { id: 'c1', name: 'AS Test', verified: true },
          { id: 'c2', name: 'FC Deux', verified: false },
        ],
      }),
    );
    expect(facts.usersCount).toBe(3);
    expect(facts.clubsCount).toBe(2);
    expect(facts.coachesCount).toBe(1);
    expect(facts.playersCount).toBe(2);
    expect(facts.proCount).toBe(1);
    expect(facts.freeCount).toBe(2);
  });

  it('n’invente pas de paiements échoués', () => {
    const reply = answerAdminCopilot(
      'paiements échoués',
      emptySnapshot({
        payments: [
          { id: 'p1', status: 'pending', amount_eur: 20, member_name: 'Léa' },
          { id: 'p2', status: 'late', amount_eur: 10, member_name: 'Max' },
        ],
      }),
    );
    expect(reply.facts.failedPaymentsAvailable).toBe(false);
    expect(reply.facts.pendingPaymentsCount).toBe(1);
    expect(reply.facts.latePaymentsCount).toBe(1);
    expect(reply.text).toMatch(/Échoués : statut inexistant/);
    expect(reply.text).not.toMatch(/échoués : [1-9]/i);
  });

  it('refuse d’inventer un % sans snapshots', () => {
    expect(computeWeeklyDeltaPct([], 'users')).toBeNull();
    expect(computeWeeklyDeltaPct([{ day_key: '2026-08-19', users: 10 } as PlatformDailySnapshot], 'users')).toBeNull();
    const reply = answerAdminCopilot('prépare un rapport', emptySnapshot());
    expect(reply.text).toContain(ADMIN_COPILOT_INSUFFICIENT_HISTORY);
  });

  it('calcule un % seulement avec ~7 j d’écart', () => {
    const snapshots = [
      { day_key: '2026-08-12', users: 100 },
      { day_key: '2026-08-19', users: 110 },
    ] as PlatformDailySnapshot[];
    expect(computeWeeklyDeltaPct(snapshots, 'users')).toBe(10);
  });

  it('clubs inactifs : pas de faux positif si aucune date', () => {
    const reply = answerAdminCopilot(
      'clubs inactifs',
      emptySnapshot({
        clubs: [{ id: 'c1', name: 'Fantôme' }],
        events: [],
      }),
    );
    expect(reply.facts.inactiveClubNames).toEqual([]);
    expect(reply.facts.unknownActivityClubCount).toBe(1);
    expect(reply.text).toMatch(/sans événement ni last_active/);
  });

  it('clubs inactifs datés sur événements > 14 j', () => {
    const old = new Date('2026-01-01T00:00:00Z');
    const reply = answerAdminCopilot(
      'clubs inactifs',
      emptySnapshot({
        clubs: [{ id: 'c1', name: 'Endormi' }],
        events: [{ club_id: 'c1', starts_at: old }],
      }),
    );
    expect(reply.facts.inactiveClubNames).toEqual(['Endormi']);
  });

  it('unknown n’invente rien', () => {
    const reply = answerAdminCopilot('xyz-inconnu', emptySnapshot());
    expect(reply.intent).toBe('unknown');
    expect(reply.text).toContain(ADMIN_COPILOT_MISSING);
  });

  it('liste réelle pour « qui contacter »', () => {
    const queue: AdminWorkItem[] = [];
    const reply = answerAdminCopilot(
      'quels utilisateurs contacter',
      emptySnapshot({
        users: [
          {
            uid: 'u1',
            display_name: 'Nina',
            email: 'n@x.fr',
            role: 'player',
            verification_status: 'PENDING',
          },
        ],
        payments: [{ id: 'p1', status: 'pending', amount_eur: 5, member_name: 'Karim' }],
        workQueue: queue,
      }),
    );
    expect(reply.text).toContain('Nina');
    expect(reply.text).toContain('Karim');
    expect(reply.relanceDraft).toBeTruthy();
  });

  it('vidéo : cameras null = donnée absente', () => {
    const reply = answerAdminCopilot('combien de caméras', emptySnapshot({ cameras: null }));
    expect(reply.intent).toBe('video');
    expect(reply.text).toContain(ADMIN_COPILOT_MISSING);
  });

  it('règle paiement échoué toujours « donnée manquante »', () => {
    const rules = evaluateAdminAutomations(emptySnapshot(), {
      inactive_club_14d: true,
      failed_payment: true,
      new_club_validation: true,
    });
    const failed = rules.find((r) => r.id === 'failed_payment');
    expect(failed?.evaluable).toBe(false);
    expect(failed?.missingLabel).toBe('Donnée manquante');
    expect(failed?.matchCount).toBe(0);
  });

  it('questions courtes filetées vers le copilote', () => {
    expect(isAdminCopilotShortQuery('clubs inactifs')).toBe(true);
    expect(isAdminCopilotShortQuery('paiements échoués')).toBe(true);
    expect(isAdminCopilotShortQuery('Marie Dupont')).toBe(false);
  });
});
