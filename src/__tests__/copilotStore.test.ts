import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearScope,
  copilotStorageKey,
  deleteConversation,
  loadConversations,
  saveConversations,
} from '../features/copilot/copilotStore';
import {
  appendMessage,
  createConversation,
  makePendingAssistantMessage,
  makeUserMessage,
} from '../features/copilot/copilotCore';
import type { CopilotConversation } from '../features/copilot/copilotCore';

const SCOPE_A = '1:club:U1:C1:club';
const SCOPE_B = '1:club:U1:C2:club';

function conversationWithReply(scopeKey: string, question: string, answer: string): CopilotConversation {
  let conv = createConversation(scopeKey);
  conv = appendMessage(conv, makeUserMessage(question));
  const pending = makePendingAssistantMessage();
  conv = appendMessage(conv, { ...pending, content: answer, status: 'complete' });
  return conv;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('persistance des conversations', () => {
  it('restaure une conversation après réouverture', async () => {
    const conv = conversationWithReply(SCOPE_A, 'Combien d licenciés ?', 'Aucune donnée chargée.');
    const write = await saveConversations(SCOPE_A, [conv]);
    expect(write.ok).toBe(true);

    const loaded = await loadConversations(SCOPE_A);
    expect(loaded.failed).toBe(false);
    expect(loaded.conversations).toHaveLength(1);
    expect(loaded.conversations[0]!.messages.map((m) => m.content)).toEqual([
      'Combien d licenciés ?',
      'Aucune donnée chargée.',
    ]);
    expect(loaded.conversations[0]!.title).toBe('Combien d licenciés ?');
  });

  it('ne rend jamais l historique d un autre club', async () => {
    await saveConversations(SCOPE_A, [conversationWithReply(SCOPE_A, 'Question club A', 'Réponse A')]);
    const other = await loadConversations(SCOPE_B);
    expect(other.conversations).toEqual([]);
  });

  it('ignore les conversations écrites sous une autre portée (défense en profondeur)', async () => {
    // Simule un stockage dont la portée ne correspond pas à la clé lue.
    await AsyncStorage.setItem(
      copilotStorageKey(SCOPE_A),
      JSON.stringify([conversationWithReply(SCOPE_B, 'Fuite ?', 'Fuite ?')]),
    );
    const loaded = await loadConversations(SCOPE_A);
    expect(loaded.conversations).toEqual([]);
  });

  it('ne persiste pas une conversation vide', async () => {
    await saveConversations(SCOPE_A, [createConversation(SCOPE_A)]);
    const loaded = await loadConversations(SCOPE_A);
    expect(loaded.conversations).toEqual([]);
  });

  it('rouvre un tour interrompu en « arrêté », jamais en « en cours »', async () => {
    let conv = appendMessage(createConversation(SCOPE_A), makeUserMessage('Question longue'));
    conv = appendMessage(conv, makePendingAssistantMessage());
    await saveConversations(SCOPE_A, [conv]);

    const loaded = await loadConversations(SCOPE_A);
    const assistant = loaded.conversations[0]!.messages.find((m) => m.role === 'assistant');
    expect(assistant?.status).toBe('stopped');
  });

  it('supprime une conversation sans toucher aux autres', async () => {
    const a = conversationWithReply(SCOPE_A, 'A', 'a');
    const b = conversationWithReply(SCOPE_A, 'B', 'b');
    await saveConversations(SCOPE_A, [a, b]);

    await deleteConversation(SCOPE_A, b.id);
    const loaded = await loadConversations(SCOPE_A);
    expect(loaded.conversations.map((c) => c.id)).toEqual([a.id]);
  });

  it('remet l historique à zéro sur demande explicite', async () => {
    await saveConversations(SCOPE_A, [conversationWithReply(SCOPE_A, 'A', 'a')]);
    await clearScope(SCOPE_A);
    expect((await loadConversations(SCOPE_A)).conversations).toEqual([]);
  });

  it('ne plante pas sur un contenu corrompu et le signale', async () => {
    await AsyncStorage.setItem(copilotStorageKey(SCOPE_A), '{{{ pas du json');
    const loaded = await loadConversations(SCOPE_A);
    expect(loaded.failed).toBe(true);
    expect(loaded.conversations).toEqual([]);
  });

  it('retraduit une erreur enregistrée avant la traduction des messages', async () => {
    let conv = appendMessage(createConversation(SCOPE_A), makeUserMessage('Question'));
    const pending = makePendingAssistantMessage();
    conv = appendMessage(conv, {
      ...pending,
      status: 'failed',
      error:
        'Mistral API error (429): {"object":"error","message":"Rate limit exceeded","code":"1300"}',
    });
    await saveConversations(SCOPE_A, [conv]);

    const loaded = await loadConversations(SCOPE_A);
    const error = loaded.conversations[0]!.messages.find((m) => m.status === 'failed')?.error ?? '';
    expect(error).toMatch(/limite de débit/i);
    expect(error).not.toMatch(/mistral/i);
    expect(error).not.toMatch(/\{/);
  });

  it('écarte les entrées qui ne sont pas des conversations', async () => {
    await AsyncStorage.setItem(
      copilotStorageKey(SCOPE_A),
      JSON.stringify([{ id: 42 }, { nope: true }, null]),
    );
    const loaded = await loadConversations(SCOPE_A);
    expect(loaded.failed).toBe(false);
    expect(loaded.conversations).toEqual([]);
  });
});
