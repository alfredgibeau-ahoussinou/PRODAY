import {
  categorizeConversations,
  categoriesForRoles,
  conversationKindLabel,
  countUnread,
  filterByCategory,
  matchesConversationQuery,
  resolveConversationKind,
} from '../features/messaging/conversationCategories';
import type { CategorizableThread } from '../features/messaging/conversationCategories';
import type { UserRole } from '../models/User';

const ME = 'me1';

const roles: Record<string, UserRole> = {
  player1: 'player',
  player2: 'player',
  parent1: 'parent',
  coach1: 'coach',
  boss1: 'club',
};

const resolveRole = (uid: string): UserRole | null => roles[uid] ?? null;

const categorized = (threads: CategorizableThread[]) =>
  categorizeConversations(threads, ME, resolveRole);

describe('nature de la conversation', () => {
  it('distingue direct, groupe et annonce', () => {
    expect(resolveConversationKind({ id: 'a' })).toBe('direct');
    expect(resolveConversationKind({ id: 'a', is_group: true })).toBe('group');
    expect(resolveConversationKind({ id: 'a', thread_kind: 'team_group' })).toBe('group');
    expect(resolveConversationKind({ id: 'a', is_announcement: true })).toBe('announcement');
    expect(resolveConversationKind({ id: 'a', thread_kind: 'announcement' })).toBe('announcement');
  });

  it('donne un libellé lisible', () => {
    expect(conversationKindLabel('group')).toBe('Groupe');
    expect(conversationKindLabel('announcement')).toBe('Annonce');
    expect(conversationKindLabel('direct')).toBe('Direct');
  });
});

describe('rôles → catégories', () => {
  it('mappe les rôles sur les catégories attendues', () => {
    expect(categoriesForRoles(['player'])).toEqual(['players']);
    expect(categoriesForRoles(['parent'])).toEqual(['parents']);
    expect(categoriesForRoles(['coach'])).toEqual(['coaches']);
    expect(categoriesForRoles(['club'])).toEqual(['club_staff']);
  });

  it('place un rôle inconnu dans aucune catégorie précise plutôt que de deviner', () => {
    expect(categoriesForRoles([])).toEqual([]);
  });
});

describe('catégorisation', () => {
  it('classe un direct selon le rôle réel de l autre participant', () => {
    const [entry] = categorized([{ id: 't1', other_user_id: 'parent1' }]);
    expect(entry!.kind).toBe('direct');
    expect(entry!.categories).toEqual(['parents']);
  });

  it('classe un groupe dans plusieurs catégories (groupe mixte)', () => {
    const [entry] = categorized([
      {
        id: 'g1',
        is_group: true,
        participant_ids: [ME, 'player1', 'parent1', 'coach1'],
      },
    ]);
    expect(entry!.kind).toBe('group');
    expect(entry!.categories.sort()).toEqual(['coaches', 'parents', 'players']);
  });

  it('utilise les rôles enregistrés sans avoir à les résoudre', () => {
    const [entry] = categorized([
      {
        id: 'g2',
        is_group: true,
        participant_roles: { me1: 'coach', player1: 'player' },
      },
    ]);
    expect(entry!.categories).toEqual(['players']);
  });

  it('ne classe nulle part un fil dont le rôle est inconnu', () => {
    const [entry] = categorized([{ id: 't2', other_user_id: 'inconnu' }]);
    expect(entry!.categories).toEqual([]);
    expect(filterByCategory([entry!], 'all')).toHaveLength(1);
    expect(filterByCategory([entry!], 'players')).toHaveLength(0);
  });
});

describe('filtres', () => {
  const list = categorized([
    { id: 'direct-parent', other_user_id: 'parent1' },
    { id: 'direct-player', other_user_id: 'player1' },
    { id: 'group-mixte', is_group: true, participant_ids: [ME, 'player1', 'coach1'] },
  ]);

  it('« Tous » retourne tout', () => {
    expect(filterByCategory(list, 'all').map((c) => c.thread.id)).toEqual([
      'direct-parent',
      'direct-player',
      'group-mixte',
    ]);
  });

  it('filtre par catégorie sans dupliquer un fil présent dans plusieurs', () => {
    const players = filterByCategory(list, 'players');
    expect(players.map((c) => c.thread.id)).toEqual(['direct-player', 'group-mixte']);
    expect(new Set(players.map((c) => c.thread.id)).size).toBe(players.length);
  });

  it('ne modifie jamais les droits : un fil reste présent dans « Tous » quoi qu il arrive', () => {
    for (const category of ['players', 'parents', 'coaches', 'club_staff'] as const) {
      const filtered = filterByCategory(list, category);
      for (const entry of filtered) {
        expect(filterByCategory(list, 'all')).toContainEqual(entry);
      }
    }
  });

  it('compte les non-lus', () => {
    const unread = categorized([
      { id: 'a', other_user_id: 'parent1', unread: true },
      { id: 'b', other_user_id: 'player1' },
      { id: 'c', other_user_id: 'coach1', unread: true },
    ]);
    expect(countUnread(unread)).toBe(2);
  });
});

describe('recherche de conversation', () => {
  const [entry] = categorized([
    {
      id: 't',
      other_user_id: 'parent1',
      participant_name: 'Amélie Durand',
      last_message: 'Convocation reçue, merci',
    },
  ]);

  it('trouve par nom, accents ignorés', () => {
    expect(matchesConversationQuery(entry!, 'amelie')).toBe(true);
    expect(matchesConversationQuery(entry!, 'DURAND')).toBe(true);
  });

  it('trouve par contenu du dernier message', () => {
    expect(matchesConversationQuery(entry!, 'convocation')).toBe(true);
  });

  it('ne trouve pas un terme absent', () => {
    expect(matchesConversationQuery(entry!, 'basket')).toBe(false);
  });

  it('une requête vide laisse tout passer', () => {
    expect(matchesConversationQuery(entry!, '   ')).toBe(true);
  });
});
