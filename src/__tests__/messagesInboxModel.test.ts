import type { MessageThread } from '../lib/firestoreMappers';
import {
  countUnreadThreads,
  formatThreadPreview,
  messagesInboxCountLabel,
  sortThreadsForInbox,
} from '../utils/messagesInboxModel';

function thread(partial: Partial<MessageThread> & { id: string }): MessageThread {
  return {
    id: partial.id,
    other_user_id: partial.other_user_id ?? 'b',
    participant_name: partial.participant_name ?? 'Contact',
    last_message: partial.last_message ?? '',
    updated_at: partial.updated_at ?? new Date('2026-01-02T12:00:00Z'),
    unread: partial.unread ?? false,
    thread_kind: partial.thread_kind,
    request_status: partial.request_status,
  };
}

describe('messagesInboxModel', () => {
  it('trie les non-lus d’abord puis par date', () => {
    const sorted = sortThreadsForInbox([
      thread({ id: 'old-read', unread: false, updated_at: new Date('2026-01-01T10:00:00Z') }),
      thread({ id: 'new-read', unread: false, updated_at: new Date('2026-01-03T10:00:00Z') }),
      thread({ id: 'old-unread', unread: true, updated_at: new Date('2026-01-01T12:00:00Z') }),
      thread({ id: 'new-unread', unread: true, updated_at: new Date('2026-01-04T10:00:00Z') }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(['new-unread', 'old-unread', 'new-read', 'old-read']);
  });

  it('compte et libelle les non-lus', () => {
    const list = [
      thread({ id: '1', unread: true }),
      thread({ id: '2', unread: false }),
      thread({ id: '3', unread: true }),
    ];
    expect(countUnreadThreads(list)).toBe(2);
    expect(messagesInboxCountLabel({ resultCount: 3, unreadCount: 2 })).toBe('3 · 2 non lus');
    expect(messagesInboxCountLabel({ resultCount: 0, unreadCount: 0 })).toBe('Aucune conversation');
    expect(formatThreadPreview('  Salut  ')).toBe('Salut');
    expect(formatThreadPreview('')).toBe('Nouvelle conversation');
    expect(formatThreadPreview(undefined)).toBe('Nouvelle conversation');
  });
});
