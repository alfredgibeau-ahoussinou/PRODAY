/**
 * « Réessayer » du Copilote — reprise **sans duplication** et délai après 429.
 *
 * Constaté en conditions réelles : après un refus de limite de débit (429),
 * chaque clic sur « Réessayer » ré-ajoutait la question à la fin du fil et
 * produisait une nouvelle carte d'erreur identique — l'utilisateur empilait
 * « Fais le point sur les convocations… » en boucle sans jamais obtenir de
 * réponse. La reprise ampute désormais la réponse à rejouer et réutilise la
 * question déjà posée quand elle est la dernière du fil ; et un 429 arme un
 * délai pendant lequel le rejeu est refusé, le limiteur du fournisseur étant
 * encore fermé.
 */

import {
  COPILOT_RATE_LIMIT_COOLDOWN_MS,
  classifyCopilotError,
  conversationForRetry,
  copilotRetryDelay,
  humanizeCopilotError,
  type CopilotConversation,
  type CopilotMessage,
} from '../features/copilot/copilotCore';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const HOOK = 'features/copilot/useCopilot.ts';
const CHAT = 'features/copilot/CopilotChat.tsx';

let seq = 0;

function userMessage(content: string, at: number): CopilotMessage {
  seq += 1;
  return { id: `u-${seq}`, role: 'user', content, status: 'complete', createdAt: at };
}

function assistantMessage(
  id: string,
  patch: Partial<CopilotMessage> = {},
): CopilotMessage {
  return {
    id,
    role: 'assistant',
    content: '',
    status: 'failed',
    createdAt: 1_000,
    ...patch,
  };
}

function conversation(messages: CopilotMessage[]): CopilotConversation {
  return {
    id: 'conv-1',
    scopeKey: 'scope',
    title: 'Test',
    messages,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('conversationForRetry — reprise sans duplication', () => {
  it('ampute la réponse à rejouer et réutilise la question de fin de fil', () => {
    const conv = conversation([
      userMessage('Fais le point sur les convocations en attente de la semaine', 900),
      assistantMessage('a1', { error: 'limite de débit' }),
    ]);

    const plan = conversationForRetry(conv, 'a1')!;
    expect(plan.userText).toBe('Fais le point sur les convocations en attente de la semaine');
    expect(plan.reuseLastUser).toBe(true);
    /** La question n'est PAS ré-empilée : le fil amputé se termine par elle. */
    expect(plan.conv.messages).toHaveLength(1);
    expect(plan.conv.messages[plan.conv.messages.length - 1]!.role).toBe('user');
  });

  it('ne traite qu’une réponse assistant, jamais un message utilisateur', () => {
    const conv = conversation([userMessage('Bonjour', 900)]);
    expect(conversationForRetry(conv, conv.messages[0]!.id)).toBeNull();
    expect(conversationForRetry(conv, 'inconnu')).toBeNull();
  });

  it('refuse un tour encore en cours — il se stoppe d’abord', () => {
    const conv = conversation([
      userMessage('Question', 900),
      assistantMessage('a1', { status: 'pending' }),
    ]);
    expect(conversationForRetry(conv, 'a1')).toBeNull();
  });

  it('réutilise une réponse complète (regénération) sans toucher aux autres tours', () => {
    const conv = conversation([
      userMessage('Première question', 100),
      assistantMessage('a1', { status: 'complete', content: 'Réponse' }),
      userMessage('Deuxième question', 200),
      assistantMessage('a2', { status: 'complete', content: 'Réponse 2' }),
    ]);

    const plan = conversationForRetry(conv, 'a1')!;
    expect(plan.reuseLastUser).toBe(false);
    expect(plan.conv.messages).toHaveLength(3);
    expect(plan.conv.messages.some((m) => m.id === 'a1')).toBe(false);
    expect(plan.userText).toBe('Première question');
  });

  it('ampute la pile héritée du bug : reprendre le dernier échec réutilise la question dupliquée', () => {
    const error = humanizeCopilotError('Mistral API error (429): {"rate_limited":true}');
    /** Le bug empilait des paires question + échec : voici l'état réellement persisté. */
    const conv = conversation([
      userMessage('Fais le point sur les convocations', 900),
      assistantMessage('a1', { error, createdAt: 910 }),
      userMessage('Fais le point sur les convocations', 920),
      assistantMessage('a2', { error, createdAt: 930 }),
    ]);

    const plan = conversationForRetry(conv, 'a2')!;
    /** L'échec de la première tentative reste dans l'historique (il a son propre Réessayer). */
    expect(plan.conv.messages.filter((m) => m.status === 'failed')).toHaveLength(1);
    /** La question dupliquée est réutilisée, pas re-ajoutée : la boucle est rompue. */
    expect(plan.reuseLastUser).toBe(true);
    expect(plan.userText).toBe('Fais le point sur les convocations');
    expect(plan.conv.messages.filter((m) => m.role === 'user')).toHaveLength(2);
  });
});

describe('copilotRetryDelay — délai après limite de débit', () => {
  const rateLimitError = humanizeCopilotError('Mistral API error (429): {"rate_limited":true}');
  const otherError = humanizeCopilotError('Deadline exceeded');

  it('classe bien le 429 comme limite de débit', () => {
    expect(classifyCopilotError('HTTP 429')).toBe('rate_limit');
  });

  it('impose le délai complet juste après l’échec', () => {
    const message = assistantMessage('a1', { error: rateLimitError, failedAt: 10_000 });
    expect(copilotRetryDelay(message, 10_000)).toBe(COPILOT_RATE_LIMIT_COOLDOWN_MS);
  });

  it('décompte le délai restant, puis le lève', () => {
    const message = assistantMessage('a1', { error: rateLimitError, failedAt: 10_000 });
    expect(copilotRetryDelay(message, 10_000 + 20_000)).toBe(10_000);
    expect(copilotRetryDelay(message, 10_000 + COPILOT_RATE_LIMIT_COOLDOWN_MS)).toBe(0);
  });

  it('retombe sur createdAt quand failedAt manque (anciens messages persistés)', () => {
    const message = assistantMessage('a1', { error: rateLimitError });
    expect(copilotRetryDelay(message, 1_000)).toBe(COPILOT_RATE_LIMIT_COOLDOWN_MS);
    expect(copilotRetryDelay(message, 1_000 + COPILOT_RATE_LIMIT_COOLDOWN_MS)).toBe(0);
  });

  it('ne délai ni les autres échecs, ni un message complet', () => {
    expect(
      copilotRetryDelay(assistantMessage('a1', { error: otherError, failedAt: 10_000 }), 10_001),
    ).toBe(0);
    expect(
      copilotRetryDelay(
        assistantMessage('a1', { status: 'complete', content: 'ok', error: rateLimitError }),
        10_001,
      ),
    ).toBe(0);
    expect(copilotRetryDelay(null, 10_001)).toBe(0);
  });
});

describe('Le hook et l’écran appliquent les deux règles', () => {
  it('la reprise passe par le plan et réutilise la question de fin de fil', () => {
    const hook = read(HOOK);
    expect(hook).toContain('conversationForRetry(conv, assistantMessageId)');
    expect(hook).toContain('reuseLastUser: plan.reuseLastUser');
    expect(hook).toContain('options?.reuseLastUser ? conv : appendMessage(conv, userMsg)');
    /** L’ancien chemin qui ré-écrivait toujours la question a disparu. */
    expect(hook).not.toContain('previousUserMessage(conv, assistantMessageId);');
  });

  it('le rejeu est refusé pendant le délai, et le délai est exposé à l’écran', () => {
    const hook = read(HOOK);
    expect(hook).toContain('copilotRetryDelay(target, Date.now()) > 0) return;');
    expect(hook).toContain('retryDelayMs: copilotRetryDelay(');

    const chat = read(CHAT);
    expect(chat).toContain('disabled={controller.retryDelayMs > 0}');
    expect(chat).toContain('Réessayer dans ${seconds} s');
  });

  it('l’échec horodate le motif pour armer le délai', () => {
    const hook = read(HOOK);
    expect(hook).toContain('failedAt: Date.now()');
  });
});
