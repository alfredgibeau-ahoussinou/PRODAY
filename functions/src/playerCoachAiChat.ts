import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { stripDashTypography } from './clubAssistantChat';
import { playerAgent, formatPlayerAgentFacts } from './aiAgents/agents/playerAgent';
import { generateAiChatCompletion } from './aiProvider';
import {
  buildPlayerCoachSuggestions,
  detectPlayerCoachActions,
  savePlayerWeeklyFocus,
  type PlayerAiAction,
} from './playerCoachActions';

const MAX_HISTORY = 16;
const MAX_USER_CHARS = 1200;
const MAX_REPLY_CHARS = 2400;

type ChatRole = 'user' | 'assistant';
type ChatMessageIn = { role: ChatRole; content: string };

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
7. Résumé semaine: utilise weekly_session_count, weekly_goal_percent, wellness_score et next_event du contexte.
8. Navigation: tu peux inviter le joueur à ouvrir Matchs, Saison, Profil ou Entraînement IA dans l'app.

Contexte joueur (données réelles):
${contextBlock || 'Aucune donnée disponible.'}`;
}

/** Coach IA joueur — contexte enrichi via playerAgent + actions structurées. */
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

    const uid = request.auth.uid;
    const messages = sanitizeMessages((request.data as { messages?: unknown })?.messages);
    if (messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Message requis.');
    }

    const query = messages.at(-1)?.content ?? '';
    const agentResult = await playerAgent({
      uid,
      role: 'player',
      query,
    });
    const facts = (agentResult.facts ?? {}) as Record<string, unknown>;
    const contextBlock = formatPlayerAgentFacts(agentResult);
    const system = buildSystemPrompt(contextBlock);

    let aiRes;
    try {
      aiRes = await generateAiChatCompletion({
        systemPrompt: system,
        messages,
        temperature: 0.6,
      });
    } catch (e: unknown) {
      console.error('[playerCoachAiChat] AI error', e);
      throw new HttpsError(
        'internal',
        e instanceof Error ? e.message : 'Le Coach IA a échoué. Réessayez dans un instant.',
      );
    }

    const reply = stripDashTypography(aiRes.text.slice(0, MAX_REPLY_CHARS));

    const actions: PlayerAiAction[] = detectPlayerCoachActions(query, facts);
    for (const action of actions) {
      if (action.type === 'save_weekly_goal') {
        await savePlayerWeeklyFocus(uid, action.goal);
      }
    }

    const suggestions = buildPlayerCoachSuggestions(facts);

    return {
      reply,
      model: aiRes.model,
      provider: aiRes.provider,
      agents_used: ['player'],
      actions: actions.length > 0 ? actions : undefined,
      suggestions,
    };
  },
);
