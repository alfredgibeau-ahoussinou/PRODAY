import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { configStr } from './runtimeConfig';
import {
  MISTRAL_CHAT_MODEL,
  extractMistralChatText,
} from './mistralModels';
import { stripDashTypography } from './clubAssistantChat';

const db = admin.firestore();
const MISTRAL_TEXT_MODEL = MISTRAL_CHAT_MODEL;
const MAX_HISTORY = 16;
const MAX_USER_CHARS = 1200;
const MAX_REPLY_CHARS = 2200;

type ChatRole = 'user' | 'assistant';

type ChatMessageIn = {
  role: ChatRole;
  content: string;
};

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
    out.push({
      role,
      content: content.slice(0, MAX_USER_CHARS),
    });
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

async function buildPresidentContext(uid: string, clubId: string): Promise<string> {
  const [clubSnap, teamsSnap, membershipsSnap] = await Promise.all([
    db.doc(`clubs/${clubId}`).get(),
    db.collection('teams').where('club_id', '==', clubId).limit(40).get(),
    db.collection('memberships').where('club_id', '==', clubId).limit(80).get(),
  ]);

  const club = clubSnap.data() ?? {};
  const clubName = String(club.name ?? 'Club');
  const ownerUid = String(club.owner_uid ?? '');
  const teams = teamsSnap.docs.map((d) => d.data());
  const memberships = membershipsSnap.docs.map((d) => d.data());
  const pending = memberships.filter((m) => m.status === 'pending').length;
  const players = memberships.filter(
    (m) => m.status === 'approved' || m.status === 'active',
  ).length;
  const withoutCoach = teams.filter(
    (t) => !Array.isArray(t.coach_uids) || t.coach_uids.length === 0,
  ).length;
  const teamLabels = teams
    .slice(0, 12)
    .map((t) => String(t.name ?? t.category ?? 'Équipe'))
    .join(', ');

  return [
    `Club: ${clubName} (id=${clubId})`,
    `Owner uid: ${ownerUid || 'inconnu'}`,
    `Demandeur uid: ${uid}`,
    `Équipes: ${teams.length}${teamLabels ? ` (${teamLabels})` : ''}`,
    `Licenciés / membres listés: ${players}`,
    `Adhésions en attente: ${pending}`,
    `Équipes sans coach: ${withoutCoach}`,
    `Navigation Président: Cockpit, Mon club, Sportif, Finances, Adhérents, Équipes, Coachs, Sponsors, Communication, Événements, Documents, Analyses, IA, Paramètres, Comité, Saison, Objectifs, Alertes.`,
    `Le Pôle Président pilote : la gestion opérationnelle (CRUD) se fait dans le Pôle Club via deep links.`,
  ].join('\n');
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
      model: MISTRAL_TEXT_MODEL,
      temperature: 0.65,
      top_p: 0.9,
      max_tokens: 1400,
      reasoning_effort: 'high',
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[presidentAssistantChat] Mistral error', res.status, body.slice(0, 400));
    throw new HttpsError('internal', 'Le modèle IA a échoué. Réessayez dans un instant.');
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const text = extractMistralChatText(json.choices?.[0]?.message?.content);
  if (!text) {
    throw new HttpsError('internal', 'Réponse IA vide.');
  }
  return text.slice(0, MAX_REPLY_CHARS);
}

/**
 * Chat exécutif Pôle Président — Mistral.
 * Auth rôle club requise. Env : MISTRAL_API_KEY.
 */
export const presidentAssistantChat = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 90,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }
    const uid = request.auth.uid;
    const apiKey = getMistralApiKey();
    if (!apiKey) {
      throw new HttpsError(
        'failed-precondition',
        'Assistant IA non configuré (clé Mistral manquante côté serveur).',
      );
    }

    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Profil introuvable.');
    }
    const user = userSnap.data()!;
    if (user.role !== 'club') {
      throw new HttpsError('permission-denied', 'Réservé aux comptes Club / dirigeants.');
    }

    const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
    const clubId = String(profile.club_id ?? uid);
    const messages = sanitizeMessages(request.data?.messages);
    if (messages.length === 0) {
      throw new HttpsError('invalid-argument', 'Aucun message.');
    }
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
      throw new HttpsError('invalid-argument', 'Le dernier message doit venir de l’utilisateur.');
    }

    let contextBlock = '';
    try {
      contextBlock = await buildPresidentContext(uid, clubId);
    } catch (error) {
      console.warn('[presidentAssistantChat] context', error);
      contextBlock = `Club id=${clubId} (contexte partiel).`;
    }

    const hint = request.data?.contextHint;
    if (hint && typeof hint === 'object') {
      const h = hint as Record<string, unknown>;
      contextBlock += `\nIndices client: équipes=${h.teamsCount ?? '?'}, joueurs=${h.playersCount ?? '?'}, coachs=${h.coachesCount ?? '?'}, pending=${h.pendingMemberships ?? '?'}, sansCoach=${h.teamsWithoutCoach ?? '?'}.`;
    }

    const system = `Tu es le conseiller exécutif du Pôle Président ProDay. Tu parles au président ou dirigeant principal, avec une posture de direction : stratégie, priorités, risques, décisions.

Style d’écriture (obligatoire) :
Interdiction absolue d’utiliser des tirets : ni -, ni –, ni —, ni puces « - item ». Jamais de listes à tirets. Phrases ou numérotation 1. 2. 3. si nécessaire.
Français soigné, vouvoiement de direction par défaut. Clair, calme, premium. 2 à 6 phrases.
Oriente vers les sections du Pôle Président ou vers le Pôle Club pour l’opérationnel (« ouvrez Sportif puis Match Center dans Club »).

Règles :
N’invente aucun chiffre hors contexte. Ne promets aucun envoi automatique de message ni de rapport sans confirmation humaine.
Tu n’es ni avocat, ni expert-comptable, ni médecin.

Contexte :
${contextBlock}`;

    const reply = stripDashTypography(await callMistralChat(apiKey, system, messages));

    return {
      reply,
      model: MISTRAL_TEXT_MODEL,
      clubId,
    };
  },
);
