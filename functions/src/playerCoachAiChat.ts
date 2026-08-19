import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { configStr } from './runtimeConfig';
import { MISTRAL_CHAT_MODEL, extractMistralChatText } from './mistralModels';
import { stripDashTypography } from './clubAssistantChat';
import { playerAgent, formatPlayerAgentFacts } from './aiAgents/agents/playerAgent';

const MAX_HISTORY = 16;
const MAX_USER_CHARS = 1200;
const MAX_REPLY_CHARS = 2400;

type ChatRole = 'user' | 'assistant';
type ChatMessageIn = { role: ChatRole; content: string };

function getMistralApiKey(): string | null {
  return configStr('mistral', 'api_key', ['MISTRAL_API_KEY']) ?? null;
}

function sanitizeMessages(raw: unknown): ChatMessageIn[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessageIn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: string }).role;
    const content = String((item as { content?: string }).content ?? '').trim();
    if ((role !== 'user' && role !== 'assistant') || !content) continue;
    out.push({ role, content: content.slice(0, MAX_USER_CHARS) });
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

function buildSystemPrompt(contextBlock: string): string {
  return `Tu es le Coach IA personnel ProDay d'un joueur de football amateur français.
Tu parles en français, tutoiement chaleureux, concret et sportif.

Règles absolues:
1. Tu ne cites QUE les données du contexte ci-dessous. JAMAIS d'invention de stats, scores ou blessures.
2. Si une donnée manque, dis exactement: « Je n'ai pas encore cette donnée » et indique où la renseigner dans l'app (Performance, Matchs, check wellness).
3. INTERDIT: diagnostic médical, prescription, certitude sur une blessure. Oriente vers un adulte / professionnel de santé si douleur ou blessure.
4. Pas de tirets (-, –, —). Phrases courtes ou numéros 1. 2. 3.
5. 3 à 8 phrases max. Suggestions, pas ordres.
6. Entraînement maison: tu peux proposer des idées générales; pour une séance structurée, suggère « Créer mon entraînement » dans l'app.

Contexte joueur (données réelles):
${contextBlock || 'Aucune donnée disponible.'}`;
}

async function callMistralChat(
  apiKey: string,
  system: string,
  messages: ChatMessageIn[],
): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_CHAT_MODEL,
      temperature: 0.6,
      max_tokens: 1600,
      reasoning_effort: 'high',
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[playerCoachAiChat] Mistral error', res.status, body.slice(0, 400));
    throw new HttpsError('internal', 'Le Coach IA a échoué. Réessayez dans un instant.');
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const text = extractMistralChatText(json.choices?.[0]?.message?.content);
  if (!text) throw new HttpsError('internal', 'Réponse IA vide.');
  return stripDashTypography(text.slice(0, MAX_REPLY_CHARS));
}

/** Coach IA joueur — contexte enrichi via playerAgent. */
export const playerCoachAiChat = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const apiKey = getMistralApiKey();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Coach IA non configuré.');
    }

    const uid = request.auth.uid;
    const messages = sanitizeMessages((request.data as { messages?: unknown })?.messages);
    if (messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Message requis.');
    }

    const agentResult = await playerAgent({
      uid,
      role: 'player',
      query: messages.at(-1)?.content ?? '',
    });
    const contextBlock = formatPlayerAgentFacts(agentResult);
    const system = buildSystemPrompt(contextBlock);

    const reply = await callMistralChat(apiKey, system, messages);
    return {
      reply,
      model: MISTRAL_CHAT_MODEL,
      agents_used: ['player'],
    };
  },
);
