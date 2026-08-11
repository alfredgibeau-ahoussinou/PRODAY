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
const MAX_REPLY_CHARS = 2400;

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

async function buildPlayerContext(uid: string): Promise<string> {
  const userSnap = await db.doc(`users/${uid}`).get();
  const user = userSnap.data() ?? {};
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
  const displayName = String(user.display_name ?? 'Joueur');
  const position = String(profile.position ?? profile.preferred_position ?? 'non précisé');
  const foot = String(profile.preferred_foot ?? profile.strong_foot ?? 'non précisé');
  const age = profile.age != null ? String(profile.age) : 'non précisé';
  const gender = String(profile.gender ?? 'non précisé');
  const clubId = profile.club_id ? String(profile.club_id) : null;
  const plan = String(user.subscription_plan_id ?? 'none');
  const tier = String(user.subscription_tier ?? 'free');

  let clubName = 'sans club';
  if (clubId) {
    try {
      const clubSnap = await db.doc(`clubs/${clubId}`).get();
      clubName = String(clubSnap.data()?.name ?? clubId);
    } catch {
      clubName = clubId;
    }
  }

  let nextMatchLine = 'Aucun match à venir chargé.';
  try {
    const now = admin.firestore.Timestamp.now();
    const eventsSnap = await db
      .collection('team_events')
      .where('starts_at', '>=', now)
      .orderBy('starts_at', 'asc')
      .limit(12)
      .get();
    const events = eventsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        event_type: data.event_type,
        starts_at: data.starts_at as admin.firestore.Timestamp | undefined,
        club_id: data.club_id as string | undefined,
        player_uids: Array.isArray(data.player_uids) ? (data.player_uids as unknown[]) : [],
        member_uids: Array.isArray(data.member_uids) ? (data.member_uids as unknown[]) : [],
      };
    });
    const mine = events.find(
      (e) =>
        e.player_uids.includes(uid) ||
        e.member_uids.includes(uid) ||
        (clubId != null && e.club_id === clubId),
    );
    if (mine) {
      const title = String(mine.title ?? 'Match');
      const when = mine.starts_at?.toDate?.()?.toISOString?.() ?? 'date inconnue';
      const type = String(mine.event_type ?? 'event');
      nextMatchLine = `Prochain événement: ${title} (${type}) · ${when}`;
    }
  } catch {
    nextMatchLine = 'Calendrier match indisponible (contexte partiel).';
  }

  return [
    `Joueur: ${displayName} (uid=${uid})`,
    `Poste: ${position}`,
    `Pied fort: ${foot}`,
    `Âge: ${age}`,
    `Genre profil: ${gender}`,
    `Club: ${clubName}`,
    `Abonnement: tier=${tier}, plan=${plan}`,
    nextMatchLine,
    `App: onglets PLAY, MATCH, PERF (Smart Tactics), CARD. Coach IA = conseil tactique et amélioration individuelle.`,
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
      max_tokens: 1600,
      reasoning_effort: 'high',
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[playerTacticsChat] Mistral error', res.status, body.slice(0, 400));
    throw new HttpsError('internal', 'Le Coach IA a échoué. Réessayez dans un instant.');
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
 * Coach IA joueur — football + amélioration tactique (dialogue Mistral).
 */
export const playerTacticsChat = onCall(
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
        'Coach IA non configuré (clé Mistral manquante côté serveur).',
      );
    }

    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Profil introuvable.');
    }
    const user = userSnap.data()!;
    if (user.role !== 'player') {
      throw new HttpsError('permission-denied', 'Réservé aux comptes Joueur.');
    }

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
      contextBlock = await buildPlayerContext(uid);
    } catch (error) {
      console.warn('[playerTacticsChat] context', error);
      contextBlock = `Joueur uid=${uid} (contexte partiel).`;
    }

    const system = `Tu es le Coach IA Pro Day, spécialiste football et tactique individuelle. Tu parles à un joueur ou une joueuse qui veut s’améliorer.

Mission :
Aider à comprendre le jeu (principes tactiques, rôles par poste, phases de jeu, pressing, transitions, set pieces).
Proposer des axes d’amélioration concrets et réalistes pour son poste.
Expliquer simplement des concepts (bloc bas / haut, largeur, profondeur, 1v1, couverture, timing de course…).
Donner des drills courts réalisables à la maison, au jardin ou en club (durée, consignes, critères de réussite).
Relier le conseil au prochain match ou au XI si le contexte le permet.

Style d’écriture (obligatoire) :
Interdiction absolue et permanente d’utiliser des tirets : ni -, ni –, ni —, ni puces « - item ». Jamais de listes à tirets. Écris uniquement des phrases ou des phrases numérotées (1. 2. 3.) si une énumération est vraiment utile.
Français naturel, tutoiement, ton coach motivant et précis. Phrases courtes.
En général 3 à 7 phrases. Une idée claire par réponse, puis 1 ou 2 actions concrètes.
Pas de jargon vide. Si tu utilises un terme tactique, explique-le en une phrase.

Règles de vérité :
N’invente aucun chiffre hors du contexte fourni. Si une info manque (poste, match, forme), pose une question courte.
Tu n’es ni médecin ni préparateur médical : pas de diagnostic blessure. Orienter vers repos / staff si douleur.
Ne remplace pas le coach de club : tu complètes, tu n’imposes pas un XI.

Contexte joueur (faits serveur) :
${contextBlock}`;

    const reply = stripDashTypography(await callMistralChat(apiKey, system, messages));

    return {
      reply,
      model: MISTRAL_TEXT_MODEL,
    };
  },
);
