import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { configStr } from './runtimeConfig';
import { MISTRAL_CHAT_MODEL, extractMistralChatText } from './mistralModels';
import { resolveIntents } from './aiAgents/intentRouter';
import { dispatchAgents } from './aiAgents/agentDispatcher';
import type { AgentResult } from './aiAgents/types';
import { stripDashTypography } from './clubAssistantChat';

const db = admin.firestore();

const MAX_USER_CHARS = 1200;
const MAX_REPLY_CHARS = 2500;

type ChatRole = 'user' | 'assistant';
type ChatMsg = { role: ChatRole; content: string };

function getMistralApiKey(): string | null {
  return configStr('mistral', 'api_key', ['MISTRAL_API_KEY']) ?? null;
}

function sanitizeMessages(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMsg[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: string }).role;
    const content = String((item as { content?: string }).content ?? '').trim();
    if ((role !== 'user' && role !== 'assistant') || !content) continue;
    out.push({ role, content: content.slice(0, MAX_USER_CHARS) });
    if (out.length >= 16) break;
  }
  return out;
}

function buildSynthesisPrompt(results: AgentResult[], role: string): string {
  const dataBlocks = results
    .filter((r) => !r.error)
    .map((r) => `[${r.agent.toUpperCase()}]\n${r.summary}\nDonnées : ${JSON.stringify(r.facts)}`)
    .join('\n\n');

  const errorBlocks = results
    .filter((r) => r.error)
    .map((r) => r.agent)
    .join(', ');

  return `Tu es ProDay AI, l'assistant intelligent de la plateforme ProDay (football amateur français).
Tu parles en français, de manière naturelle, concise et utile.

Règles absolues :
1. Tu ne cites QUE les données factuelles fournies ci-dessous. JAMAIS d'invention.
2. Si une donnée manque, dis-le honnêtement et propose comment la trouver dans l'app.
3. Présente tes analyses comme des suggestions, pas des certitudes.
4. Interdiction d'utiliser des tirets (-, –, —). Utilise des phrases ou des numéros (1. 2. 3.).
5. Tutoiement simple et direct. 3 à 6 phrases max.
6. Le rôle de l'utilisateur est « ${role} ». Adapte ton niveau de détail.

Données collectées par les agents spécialisés :
${dataBlocks || 'Aucune donnée disponible.'}
${errorBlocks ? `\nAgents en erreur (ne pas mentionner) : ${errorBlocks}` : ''}

Réponds à la question de l'utilisateur en te basant UNIQUEMENT sur ces données.`;
}

async function callMistralSynthesis(
  apiKey: string,
  systemPrompt: string,
  messages: ChatMsg[],
): Promise<string> {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_CHAT_MODEL,
      temperature: 0.5,
      max_tokens: 1600,
      reasoning_effort: 'high',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[prodayAiChat] Mistral error', res.status, body.slice(0, 400));
    throw new HttpsError('internal', 'Le modèle IA a échoué. Réessayez dans un instant.');
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const text = extractMistralChatText(json.choices?.[0]?.message?.content);
  if (!text) throw new HttpsError('internal', 'Réponse IA vide.');
  return text.slice(0, MAX_REPLY_CHARS);
}

export const prodayAiChat = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const uid = request.auth.uid;
    const apiKey = getMistralApiKey();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'ProDay AI non configuré (clé Mistral manquante).');
    }

    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Profil introuvable.');
    }

    const user = userSnap.data()!;
    const role = String(user.role ?? 'player');
    const profile = (user.profile as Record<string, unknown>) ?? {};
    const clubId = String(profile.club_id ?? user.club_id ?? '');
    const teamId = String(request.data?.team_id ?? profile.team_id ?? '');

    const messages = sanitizeMessages(request.data?.messages);
    if (messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Aucun message.');
    }

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user') {
      throw new HttpsError('invalid-argument', 'Le dernier message doit venir de l\'utilisateur.');
    }

    const query = lastMsg.content;
    const agentNames = resolveIntents(query, role);

    const agentResults = await dispatchAgents(agentNames, {
      uid,
      role,
      club_id: clubId || undefined,
      team_id: teamId || undefined,
      query,
    });

    const systemPrompt = buildSynthesisPrompt(agentResults, role);
    const reply = stripDashTypography(await callMistralSynthesis(apiKey, systemPrompt, messages));

    return {
      reply,
      agents_used: agentNames,
      model: MISTRAL_CHAT_MODEL,
    };
  },
);
