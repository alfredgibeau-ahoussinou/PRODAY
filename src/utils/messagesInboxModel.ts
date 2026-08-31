/**
 * Helpers purs inbox messagerie — tri non-lus, libellés (testables).
 */
import type { MessageThread } from '../lib/firestoreMappers';

/** Non-lus d’abord, puis date décroissante. */
export function sortThreadsForInbox(threads: MessageThread[]): MessageThread[] {
  return [...threads].sort((a, b) => {
    const ua = a.unread ? 1 : 0;
    const ub = b.unread ? 1 : 0;
    if (ua !== ub) return ub - ua;
    return b.updated_at.getTime() - a.updated_at.getTime();
  });
}

export function countUnreadThreads(threads: MessageThread[]): number {
  return threads.filter((t) => t.unread).length;
}

export function messagesInboxCountLabel(input: {
  resultCount: number;
  unreadCount: number;
  loading?: boolean;
}): string {
  if (input.loading) return 'Chargement…';
  if (input.resultCount === 0) return 'Aucune conversation';
  if (input.unreadCount > 0) {
    return `${input.resultCount} · ${input.unreadCount} non lu${input.unreadCount > 1 ? 's' : ''}`;
  }
  return `${input.resultCount} conversation${input.resultCount > 1 ? 's' : ''}`;
}

export function formatThreadPreview(lastMessage?: string | null): string {
  const t = (lastMessage ?? '').trim();
  return t || 'Nouvelle conversation';
}
