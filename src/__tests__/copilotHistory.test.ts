import {
  conversationExcerpt,
  createConversation,
  filterConversations,
  groupConversationsByDay,
  makeUserMessage,
  type CopilotConversation,
} from '../features/copilot/copilotCore';

const conv = (over: Partial<CopilotConversation> = {}): CopilotConversation => ({
  id: 'c1',
  scopeKey: 'uid:club',
  title: 'Cotisations',
  messages: [],
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

const withMessages = (id: string, text: string, updatedAt: number): CopilotConversation =>
  conv({
    id,
    title: text,
    messages: [makeUserMessage(text, updatedAt)],
    updatedAt,
  });

describe('historique du Copilote — recherche', () => {
  const list = [
    withMessages('a', 'Quelles cotisations sont impayées cette saison ?', 300),
    withMessages('b', 'Prépare une séance de pressing', 200),
    withMessages('c', 'Résume les dépenses de septembre', 100),
  ];

  it('renvoie tout sans requête', () => {
    expect(filterConversations(list, '')).toHaveLength(3);
    expect(filterConversations(list, '   ')).toHaveLength(3);
  });

  it('cherche dans le titre et dans le corps du message', () => {
    expect(filterConversations(list, 'cotisation').map((c) => c.id)).toEqual(['a']);
    expect(filterConversations(list, 'pressing').map((c) => c.id)).toEqual(['b']);
  });

  it('ignore la casse et les accents', () => {
    expect(filterConversations(list, 'IMPAYEES').map((c) => c.id)).toEqual(['a']);
    expect(filterConversations(list, 'depenses').map((c) => c.id)).toEqual(['c']);
    expect(filterConversations(list, 'impayées').map((c) => c.id)).toEqual(['a']);
  });

  it('ne sort jamais de la liste reçue', () => {
    // Même une requête qui nommerait un autre club ne peut rien faire apparaître.
    expect(filterConversations(list, 'autre-club')).toEqual([]);
  });

  it('rend une liste vide honnête plutôt qu’un repli', () => {
    expect(filterConversations(list, 'zzz-introuvable')).toEqual([]);
  });
});

describe('historique du Copilote — regroupement par jour', () => {
  it('nomme les deux premiers jours en relatif', () => {
    const now = new Date('2026-09-15T18:00:00').getTime();
    const today = new Date('2026-09-15T09:00:00').getTime();
    const yesterday = new Date('2026-09-14T09:00:00').getTime();
    const older = new Date('2026-09-11T09:00:00').getTime();
    const groups = groupConversationsByDay(
      [withMessages('a', 'ce matin', today), withMessages('b', 'hier', yesterday), withMessages('c', 'avant', older)],
      now,
    );
    expect(groups.map((g) => g.label)).toEqual(["Aujourd'hui", 'Hier', '11 septembre']);
  });

  it('trie du plus récent au plus ancien sans perdre de conversation', () => {
    const now = new Date('2026-09-15T18:00:00').getTime();
    const day = new Date('2026-09-15T10:00:00').getTime();
    const groups = groupConversationsByDay(
      [withMessages('vieux', 'x', day - 5000), withMessages('recent', 'y', day)],
      now,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.conversations.map((c) => c.id)).toEqual(['recent', 'vieux']);
  });

  it('ne fabrique aucun groupe sans conversation', () => {
    expect(groupConversationsByDay([], Date.now())).toEqual([]);
  });

  it('ajoute l’année quand elle diffère', () => {
    const now = new Date('2026-09-15T18:00:00').getTime();
    const lastYear = new Date('2025-09-11T09:00:00').getTime();
    expect(groupConversationsByDay([withMessages('a', 'x', lastYear)], now)[0]!.label).toBe(
      '11 septembre 2025',
    );
  });
});

describe('historique du Copilote — aperçu de liste', () => {
  it('montre la DERNIÈRE question, tronquée', () => {
    const c = conv({
      messages: [makeUserMessage('Première question', 1), makeUserMessage('a'.repeat(200), 2)],
      updatedAt: 2,
    });
    const excerpt = conversationExcerpt(c)!;
    expect(excerpt.length).toBeLessThanOrEqual(72);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(excerpt.startsWith('aaa')).toBe(true);
  });

  it('ne répète pas le titre quand la conversation n’a qu’un tour', () => {
    // Le titre est dérivé du premier message : l’aperçu n’ajouterait rien.
    expect(conversationExcerpt(withMessages('a', 'Combien de licenciés ?', 1))).toBeNull();
  });

  it('ne fabrique pas d’aperçu sans message', () => {
    expect(conversationExcerpt(createConversation('uid:club'))).toBeNull();
  });
});
