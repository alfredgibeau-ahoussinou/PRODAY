/**
 * Alertes Intelligence + règles d’automatisation — dérivées des faits, jamais mockées.
 */

import type { AdminWorkItem } from './adminInsights';
import type { AdminNavTarget } from '../navigation/adminNavConfig';
import type { AdminCopilotFacts, AdminCopilotSnapshot } from './adminCopilot';
import { buildAdminCopilotFacts } from './adminCopilot';

export type AdminIntelAlertLevel = 'critical' | 'high' | 'medium' | 'low';

export type AdminIntelAlert = {
  id: string;
  level: AdminIntelAlertLevel;
  title: string;
  problem: string;
  impact?: string;
  reco: string;
  nav: AdminNavTarget;
  source: 'workQueue' | 'payments' | 'verifications' | 'clubs';
};

export type AdminAutomationRuleId = 'inactive_club_14d' | 'failed_payment' | 'new_club_validation';

export type AdminAutomationRule = {
  id: AdminAutomationRuleId;
  label: string;
  description: string;
  evaluable: boolean;
  missingLabel?: string;
  matchCount: number;
};

export const DEFAULT_ADMIN_AUTOMATION_TOGGLES: Record<AdminAutomationRuleId, boolean> = {
  inactive_club_14d: true,
  failed_payment: true,
  new_club_validation: true,
};

export function buildAdminIntelAlerts(
  snapshot: AdminCopilotSnapshot,
  facts?: AdminCopilotFacts,
): AdminIntelAlert[] {
  const f = facts ?? buildAdminCopilotFacts(snapshot);
  const alerts: AdminIntelAlert[] = [];

  for (const item of snapshot.workQueue) {
    alerts.push({
      id: `wq-${item.id}`,
      level: workLevel(item),
      title: item.title,
      problem: item.subtitle || item.kind,
      reco: 'Analyser dans la file.',
      nav: workNav(item),
      source: 'workQueue',
    });
  }

  if (f.pendingPaymentsCount > 0) {
    alerts.push({
      id: 'pay-pending',
      level: 'high',
      title: `${f.pendingPaymentsCount} paiement${f.pendingPaymentsCount > 1 ? 's' : ''} en attente`,
      problem: 'Paiements club au statut pending.',
      impact: `${f.pendingPaymentsSumEur} €`,
      reco: 'Ouvrir Business → Paiements.',
      nav: { section: 'business', screenTab: 'paiements' },
      source: 'payments',
    });
  }

  if (f.pendingVerificationsCount > 0) {
    alerts.push({
      id: 'verif-pending',
      level: 'critical',
      title: `${f.pendingVerificationsCount} vérification${f.pendingVerificationsCount > 1 ? 's' : ''} profil`,
      problem: 'Comptes en attente de validation admin.',
      reco: 'Ouvrir Utilisateurs → À valider.',
      nav: { section: 'users', screenTab: 'decisions' },
      source: 'verifications',
    });
  }

  if (f.inactiveClubsAvailable && f.inactiveClubNames && f.inactiveClubNames.length > 0) {
    alerts.push({
      id: 'clubs-inactive',
      level: 'medium',
      title: `${f.inactiveClubNames.length} club${f.inactiveClubNames.length > 1 ? 's' : ''} inactif${f.inactiveClubNames.length > 1 ? 's' : ''} (14 j)`,
      problem: 'Aucun événement ni last_active membre daté dans les 14 derniers jours.',
      reco: 'Voir Clubs → Activité.',
      nav: { section: 'clubs', screenTab: 'activity' },
      source: 'clubs',
    });
  }

  return alerts;
}

export function evaluateAdminAutomations(
  snapshot: AdminCopilotSnapshot,
  toggles: Record<AdminAutomationRuleId, boolean>,
  facts?: AdminCopilotFacts,
): AdminAutomationRule[] {
  const f = facts ?? buildAdminCopilotFacts(snapshot);
  const unverified = snapshot.clubs.filter((c) => c.verified === false).length;

  return [
    {
      id: 'inactive_club_14d',
      label: 'Club inactif 14 jours → alerte',
      description: 'Déclenché si un club n’a ni événement ni last_active membre depuis 14 j.',
      evaluable: f.inactiveClubsAvailable,
      missingLabel: f.inactiveClubsAvailable
        ? undefined
        : 'Donnée manquante (pas de last_seen club, événements non chargés)',
      matchCount: toggles.inactive_club_14d && f.inactiveClubsAvailable
        ? (f.inactiveClubNames?.length ?? 0)
        : 0,
    },
    {
      id: 'failed_payment',
      label: 'Paiement échoué → alerte',
      description: 'ProDay n’a pas de statut « failed » (pending / paid / late seulement).',
      evaluable: false,
      missingLabel: 'Donnée manquante',
      matchCount: 0,
    },
    {
      id: 'new_club_validation',
      label: 'Nouveau club → tâche validation',
      description: 'Clubs non vérifiés (verified = false).',
      evaluable: true,
      matchCount: toggles.new_club_validation ? unverified : 0,
    },
  ];
}

function workLevel(item: AdminWorkItem): AdminIntelAlertLevel {
  if (item.priority === 'critical') return 'critical';
  if (item.priority === 'high') return 'high';
  if (item.priority === 'low') return 'low';
  return 'medium';
}

function workNav(item: AdminWorkItem): AdminNavTarget {
  switch (item.kind) {
    case 'verification':
      return { section: 'users', screenTab: 'decisions' };
    case 'reel':
      return { section: 'contenus', screenTab: 'fil' };
    case 'report':
      return { section: 'contenus', screenTab: 'signalements' };
    case 'payment':
      return { section: 'business', screenTab: 'paiements' };
    case 'application':
    case 'post':
      return { section: 'clubs', screenTab: 'recrutement' };
    case 'quote':
      return { section: 'business', screenTab: 'sponsors' };
    case 'membership':
      return { section: 'clubs', screenTab: 'validation' };
    case 'subscription_request':
      return { section: 'business', screenTab: 'abonnements' };
    default:
      return { section: 'ia', screenTab: 'alertes' };
  }
}
