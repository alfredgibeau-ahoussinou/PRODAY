import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { resolveIntents } from './aiAgents/intentRouter';
import { dispatchAgents } from './aiAgents/agentDispatcher';
import type { AgentResult } from './aiAgents/types';
import { stripDashTypography } from './clubAssistantChat';
import { generateAiChatCompletion } from './aiProvider';

const db = admin.firestore();

const MAX_USER_CHARS = 1200;
const MAX_REPLY_CHARS = 2500;

type ChatRole = 'user' | 'assistant';
type ChatMsg = { role: ChatRole; content: string };

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
    let reply = '';
    let usedModel = 'gemini-2.0-flash';
    let usedProvider: 'gemini' | 'mistral' | 'proday-core' = 'gemini';

    try {
      const aiRes = await generateAiChatCompletion({
        systemPrompt,
        messages,
        temperature: 0.5,
      });
      reply = stripDashTypography(aiRes.text.slice(0, MAX_REPLY_CHARS));
      usedModel = aiRes.model;
      usedProvider = aiRes.provider;
    } catch (e: unknown) {
      console.warn('[prodayAiChat] Fallback to internal agent synthesis:', e);
      // Synthèse résiliente basée sur les données réelles collectées par les agents
      const validResults = agentResults.filter((r) => !r.error && r.summary);
      if (validResults.length > 0) {
        const summaries = validResults.map((r) => r.summary).join('\n\n');
        reply = stripDashTypography(
          `Voici les informations analysées pour votre demande :\n\n${summaries}\n\nN’hésitez pas si vous souhaitez approfondir un point précis.`
        );
      } else {
        reply = stripDashTypography(
          `J’ai bien pris en compte votre demande. Je peux vous accompagner sur la gestion de vos effectifs, l’organisation des séances et l’analyse tactique. Précisez votre question ou choisissez une consigne.`
        );
      }
      usedModel = 'proday-resilient-core';
      usedProvider = 'proday-core';
    }

    return {
      reply,
      agents_used: agentNames,
      model: usedModel,
      provider: usedProvider,
    };
  },
);
