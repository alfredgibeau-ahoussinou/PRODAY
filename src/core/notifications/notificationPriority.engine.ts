import type { MainTabId } from '../../navigation/mainTabConfig';

export type NotificationKind = 'match' | 'health' | 'social' | 'opportunity';

export interface PrioritizedNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  priority: number;
  tab: MainTabId;
  createdAt: Date;
}

const KIND_BASE: Record<NotificationKind, number> = {
  health: 100,
  match: 85,
  opportunity: 70,
  social: 55,
};

/** Priorisation notifications — max 3 push/jour (spec §10). */
export function rankNotifications(
  items: PrioritizedNotification[],
  maxPush = 3
): { push: PrioritizedNotification[]; inbox: PrioritizedNotification[] } {
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  return {
    push: sorted.slice(0, maxPush),
    inbox: sorted.slice(maxPush),
  };
}

export function scoreNotification(kind: NotificationKind, urgency: number): number {
  return KIND_BASE[kind] + Math.min(15, urgency);
}

export function buildNotificationCandidates(params: {
  pendingConvocations: number;
  unreadMessages: number;
  healthAlert: boolean;
  mercatoOpportunities: number;
}): PrioritizedNotification[] {
  const now = new Date();
  const out: PrioritizedNotification[] = [];

  if (params.healthAlert) {
    out.push({
      id: 'health-alert',
      kind: 'health',
      title: 'Alerte récupération',
      body: 'Votre charge suggère une journée de repos.',
      priority: scoreNotification('health', 10),
      tab: 'home',
      createdAt: now,
    });
  }
  if (params.pendingConvocations > 0) {
    out.push({
      id: 'convoc',
      kind: 'match',
      title: 'Convocation en attente',
      body: `${params.pendingConvocations} réponse(s) attendue(s)`,
      priority: scoreNotification('match', params.pendingConvocations * 3),
      tab: 'matchs',
      createdAt: now,
    });
  }
  if (params.mercatoOpportunities > 0) {
    out.push({
      id: 'mercato',
      kind: 'opportunity',
      title: 'Opportunité Mercato',
      body: 'Nouvelles annonces compatibles',
      priority: scoreNotification('opportunity', 5),
      tab: 'recrutement',
      createdAt: now,
    });
  }
  if (params.unreadMessages > 0) {
    out.push({
      id: 'messages',
      kind: 'social',
      title: 'Messages',
      body: `${params.unreadMessages} non lu(s)`,
      priority: scoreNotification('social', Math.min(10, params.unreadMessages)),
      tab: 'messages',
      createdAt: now,
    });
  }

  return out;
}
