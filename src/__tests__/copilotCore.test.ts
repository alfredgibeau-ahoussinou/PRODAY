import {
  MAX_TITLE_CHARS,
  appendMessage,
  conversationTurnCount,
  copilotScopeKey,
  createConversation,
  deriveConversationTitle,
  describeActionOutcome,
  classifyCopilotError,
  findUnconfirmedSuccessClaims,
  historyForRequest,
  humanizeCopilotError,
  isGenerating,
  isPersistable,
  makePendingAssistantMessage,
  makeUserMessage,
  normalizeAction,
  parseCopilotBlocks,
  parseInline,
  previousUserMessage,
  replaceMessage,
  requiresConfirmation,
  sortConversations,
  upsertConversation,
} from '../features/copilot/copilotCore';
import type { CopilotConversation } from '../features/copilot/copilotCore';

describe('portée du Copilote (cloisonnement)', () => {
  const base = { uid: 'U1', role: 'club', pole: 'club' as const, clubId: 'C1' };

  it('produit la même clé pour un contexte identique', () => {
    expect(copilotScopeKey(base)).toBe(copilotScopeKey({ ...base }));
  });

  it('sépare deux clubs : aucun historique partagé entre clubs', () => {
    expect(copilotScopeKey(base)).not.toBe(copilotScopeKey({ ...base, clubId: 'C2' }));
  });

  it('sépare deux comptes sur le même club', () => {
    expect(copilotScopeKey(base)).not.toBe(copilotScopeKey({ ...base, uid: 'U2' }));
  });

  it('sépare un changement de rôle dans le même club (réévaluation des droits)', () => {
    expect(copilotScopeKey(base)).not.toBe(copilotScopeKey({ ...base, role: 'coach' }));
  });

  it('sépare les pôles', () => {
    expect(copilotScopeKey(base)).not.toBe(
      copilotScopeKey({ ...base, pole: 'coach', role: 'coach' }),
    );
  });

  it('tolère les champs absents sans planter', () => {
    const key = copilotScopeKey({ uid: '', role: '', pole: 'coach' });
    expect(key).toContain('noclub');
    expect(key).toContain('anon');
  });
});

describe('titre de conversation', () => {
  const withUser = (content: string) => ({
    ...createConversation('s'),
    messages: [makeUserMessage(content)],
  });

  it('dérive le titre du premier message utilisateur', () => {
    expect(deriveConversationTitle(withUser('Combien de licenciés en attente ?').messages)).toBe(
      'Combien de licenciés en attente ?',
    );
  });

  it('ignore les lignes vides initiales', () => {
    expect(deriveConversationTitle(withUser('\n\n  Bilan du mois  ').messages)).toBe('Bilan du mois');
  });

  it('nettoie le balisage markdown', () => {
    expect(deriveConversationTitle(withUser('**Effectif** 2026').messages)).toBe('Effectif 2026');
  });

  it('tronque proprement les titres longs', () => {
    const title = deriveConversationTitle(
      withUser('Peux tu me preparer une longue analyse detaillee du calendrier du club cette saison').messages,
    );
    expect(title).not.toBeNull();
    expect(title!.length).toBeLessThanOrEqual(MAX_TITLE_CHARS + 1);
    expect(title!.endsWith('…')).toBe(true);
  });

  it('retourne null quand aucun message utilisateur exploitable n existe', () => {
    expect(deriveConversationTitle([])).toBeNull();
    expect(deriveConversationTitle([makePendingAssistantMessage()])).toBeNull();
  });
});

describe('états de message', () => {
  it('un message assistant en attente rend la conversation « en génération »', () => {
    const conv = appendMessage(createConversation('s'), makePendingAssistantMessage());
    expect(isGenerating(conv)).toBe(true);
  });

  it('un arrêt ou un échec ne laisse pas la conversation en génération', () => {
    const conv = appendMessage(createConversation('s'), makePendingAssistantMessage());
    const stopped = replaceMessage(conv, conv.messages[0]!.id, { status: 'stopped' });
    expect(isGenerating(stopped)).toBe(false);
    const failed = replaceMessage(conv, conv.messages[0]!.id, { status: 'failed' });
    expect(isGenerating(failed)).toBe(false);
  });

  it('n envoie au modèle que les tours complets : jamais un échec ni un arrêt', () => {
    let conv = appendMessage(createConversation('s'), makeUserMessage('Question ?'));
    conv = appendMessage(conv, makePendingAssistantMessage());
    conv = replaceMessage(conv, conv.messages[1]!.id, { status: 'failed', content: 'erreur' });
    expect(historyForRequest(conv)).toEqual([{ role: 'user', content: 'Question ?' }]);
  });

  it('retrouve le message utilisateur précédent pour « Réessayer »', () => {
    let conv = appendMessage(createConversation('s'), makeUserMessage('Première'));
    conv = appendMessage(conv, makeUserMessage('Deuxième'));
    const target = conv.messages[1]!;
    expect(previousUserMessage(conv, target.id)?.content).toBe('Première');
    expect(previousUserMessage(conv, 'inexistant')).toBeNull();
  });

  it('met à jour le titre dès le premier message utilisateur', () => {
    const conv = appendMessage(createConversation('s'), makeUserMessage('Etat des finances'));
    expect(conv.title).toBe('Etat des finances');
    expect(conversationTurnCount(conv)).toBe(1);
  });
});

describe('découpage en blocs', () => {
  it('reconnaît paragraphes, listes à puces et listes numérotées', () => {
    const blocks = parseCopilotBlocks(
      ['Voici le résumé.', '', '• Premier point', '• Second point', '', '1. Étape une', '2. Étape deux'].join('\n'),
    );
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'bullets', 'ordered']);
    const bullets = blocks[1] as { kind: 'bullets'; items: { text: string }[][] };
    expect(bullets.items.map((it) => it[0]!.text)).toEqual(['Premier point', 'Second point']);
  });

  it('reconnaît les tirets utilisés comme puces (format des réponses serveur)', () => {
    const blocks = parseCopilotBlocks('- Alpha\n- Beta');
    expect(blocks[0]!.kind).toBe('bullets');
  });

  it('reconnaît un tableau avec en-tête et lignes', () => {
    const blocks = parseCopilotBlocks('| Équipe | Joueurs |\n| --- | --- |\n| U15 | 22 |\n| U17 | 19 |');
    expect(blocks).toHaveLength(1);
    const table = blocks[0] as { kind: 'table'; headers: { text: string }[][]; rows: { text: string }[][][] };
    expect(table.kind).toBe('table');
    expect(table.headers.map((h) => h[0]!.text)).toEqual(['Équipe', 'Joueurs']);
    expect(table.rows).toHaveLength(2);
    expect(table.rows[1]![0]![0]!.text).toBe('U17');
  });

  it('reconnaît un bloc de code avec sa langue', () => {
    const blocks = parseCopilotBlocks('```ts\nconst a = 1;\n```');
    expect(blocks).toEqual([{ kind: 'code', language: 'ts', code: 'const a = 1;' }]);
  });

  it('reconnaît titres, citations et séparateurs', () => {
    const blocks = parseCopilotBlocks('## Titre\n> Citation\n---');
    expect(blocks.map((b) => b.kind)).toEqual(['heading', 'quote', 'divider']);
  });

  it('rattache les lignes indentées à leur item de liste', () => {
    const blocks = parseCopilotBlocks('1. Premier\n   avec précision\n2. Second');
    const ordered = blocks[0] as { kind: 'ordered'; items: { text: string }[][] };
    expect(ordered.items).toHaveLength(2);
    expect(ordered.items[0]!.map((s) => s.text).join('')).toContain('avec précision');
  });

  it('ne perd jamais de contenu : texte brut sans balisage reste un paragraphe', () => {
    const blocks = parseCopilotBlocks('Une seule phrase.');
    expect(blocks).toEqual([
      { kind: 'paragraph', spans: [{ text: 'Une seule phrase.' }] },
    ]);
  });
});

describe('mise en forme en ligne', () => {
  it('sépare gras, code et liens', () => {
    const spans = parseInline('Voir **Effectif** et `U15` sur [le club](https://proday.app/club)');
    expect(spans.find((s) => s.text === 'Effectif')?.bold).toBe(true);
    expect(spans.find((s) => s.text === 'U15')?.code).toBe(true);
    const link = spans.find((s) => s.text === 'le club');
    expect(link?.href).toBe('https://proday.app/club');
  });

  it('ignore un lien dont la cible n est pas http(s) — pas de schéma exécutable', () => {
    const spans = parseInline('[clic](javascript:alert(1))');
    expect(spans.some((s) => s.href)).toBe(false);
    expect(spans.map((s) => s.text).join('')).toContain('javascript');
  });
});

describe('conseil / brouillon / action', () => {
  it('seule une action exige une confirmation', () => {
    expect(requiresConfirmation('advice')).toBe(false);
    expect(requiresConfirmation('draft')).toBe(false);
    expect(requiresConfirmation('action')).toBe(true);
  });

  it('normalise une action en marquant la confirmation requise', () => {
    const send = normalizeAction({ id: 'send', kind: 'action', label: 'Envoyer', effect: 'DM aux 22 joueurs' });
    expect(send.requiresConfirmation).toBe(true);
    expect(send.effect).toBe('DM aux 22 joueurs');
    expect(normalizeAction({ id: 'draft', kind: 'draft', label: 'Brouillon' }).requiresConfirmation).toBe(false);
  });

  it('n affirme un succès que si l action a réellement abouti', () => {
    expect(describeActionOutcome({ state: 'idle' }, 'Envoyer')).toContain('en attente de confirmation');
    expect(describeActionOutcome({ state: 'running' }, 'Envoyer')).toContain('en cours');
    expect(describeActionOutcome({ state: 'running' }, 'Envoyer')).not.toMatch(/terminé/);
    expect(describeActionOutcome({ state: 'failed', reason: 'Réseau.' }, 'Envoyer')).toContain('échec');
    expect(describeActionOutcome({ state: 'failed', reason: 'Réseau.' }, 'Envoyer')).not.toMatch(/terminé/);
    expect(describeActionOutcome({ state: 'done', detail: '22 envois' }, 'Envoyer')).toContain('terminé');
  });

  it('détecte les affirmations de succès non confirmées (garde-fou de copie)', () => {
    expect(findUnconfirmedSuccessClaims('Le message a été envoyé à tous les parents.')).toEqual([
      'envoyé',
    ]);
    expect(findUnconfirmedSuccessClaims('Je peux préparer un brouillon à valider.')).toEqual([]);
    expect(findUnconfirmedSuccessClaims('Aucune action effectuée.')).toEqual([]);
  });
});

describe('erreurs du service', () => {
  it('traduit le 429 réellement observé sans exposer le fournisseur ni le JSON', () => {
    const raw =
      'Mistral API error (429): {"object":"error","message":"Rate limit exceeded","type":"rate_limited","param":null,"code":"1300","raw_status_code":429}';
    const msg = humanizeCopilotError(raw);
    expect(msg).toMatch(/limite de débit/i);
    expect(msg).not.toMatch(/mistral/i);
    expect(msg).not.toMatch(/\{/);
    expect(msg).not.toMatch(/rate_limited/);
  });

  it('classe les familles d erreur utiles', () => {
    expect(classifyCopilotError('429 too many requests')).toBe('rate_limit');
    expect(classifyCopilotError('resource-exhausted: quota')).toBe('quota');
    expect(classifyCopilotError('API key not valid')).toBe('unauthorized');
    expect(classifyCopilotError('failed-precondition: not configured')).toBe('not_configured');
    expect(classifyCopilotError('Deadline exceeded')).toBe('timeout');
    expect(classifyCopilotError('Failed to fetch')).toBe('network');
  });

  it('ne renvoie jamais de JSON brut, même sur une erreur inconnue', () => {
    const msg = humanizeCopilotError('OpenAI said {"error":"boom"} something odd');
    expect(msg).not.toMatch(/\{/);
    expect(msg).not.toMatch(/openai/i);
    expect(msg.length).toBeGreaterThan(0);
  });

  it('produit un message exploitable même sur une erreur vide', () => {
    expect(humanizeCopilotError('')).toBe(
      'Le service de génération a échoué sans message exploitable.',
    );
  });
});

describe('historique', () => {
  const conv = (id: string, updatedAt: number): CopilotConversation => ({
    id,
    scopeKey: 's',
    title: id,
    messages: [],
    createdAt: updatedAt,
    updatedAt,
  });

  it('trie du plus récent au plus ancien', () => {
    expect(sortConversations([conv('a', 1), conv('b', 3), conv('c', 2)]).map((c) => c.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('remplace une conversation existante sans la dupliquer', () => {
    const list = upsertConversation([conv('a', 1)], conv('a', 5));
    expect(list).toHaveLength(1);
    expect(list[0]!.updatedAt).toBe(5);
  });

  it('ne persiste pas une conversation sans contenu', () => {
    expect(isPersistable(createConversation('s'))).toBe(false);
    expect(isPersistable(appendMessage(createConversation('s'), makeUserMessage('Bonjour')))).toBe(true);
  });
});
