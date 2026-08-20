import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { configStr } from './runtimeConfig';
import { MISTRAL_CHAT_MODEL, extractMistralChatText } from './mistralModels';

const db = admin.firestore();
const SUMMARIES_COL = 'supporter_match_summaries';

const DISCLAIMER =
  'Résumé généré par IA à partir de données publiques du match — interprétation indicative, sans données privées joueur.';

function getMistralApiKey(): string | null {
  return configStr('mistral', 'api_key', ['MISTRAL_API_KEY']) ?? null;
}

export interface SupporterMatchSummaryPayload {
  matchId: string;
  happened: string[];
  keyMoment: string;
  stats: string[];
  evolution: string[];
  players: string[];
  conclusion: string;
  disclaimer: string;
}

function sanitizePublicMatch(raw: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    'matchId',
    'id',
    'homeLabel',
    'awayLabel',
    'home',
    'away',
    'scoreHome',
    'scoreAway',
    'status',
    'competitionLabel',
    'events',
    'statistics',
    'minute',
  ];
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (raw[key] !== undefined) out[key] = raw[key];
  }
  return out;
}

function parseSummaryJson(text: string, matchId: string): SupporterMatchSummaryPayload {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const arr = (k: string) => (Array.isArray(parsed[k]) ? parsed[k].map(String) : []);
    return {
      matchId,
      happened: arr('happened'),
      keyMoment: String(parsed.keyMoment ?? parsed.key_moment ?? ''),
      stats: arr('stats'),
      evolution: arr('evolution'),
      players: arr('players'),
      conclusion: String(parsed.conclusion ?? ''),
      disclaimer: DISCLAIMER,
    };
  } catch {
    return {
      matchId,
      happened: [cleaned.slice(0, 400)],
      keyMoment: '',
      stats: [],
      evolution: [],
      players: [],
      conclusion: cleaned.slice(0, 200),
      disclaimer: DISCLAIMER,
    };
  }
}

async function callMistralSummary(apiKey: string, matchJson: string): Promise<string> {
  const system = `Tu es un journaliste sportif. Produis UNIQUEMENT du JSON valide (sans markdown) avec les clés :
happened (array de strings, 2-4 bullets),
keyMoment (string),
stats (array, 2-3 bullets factuels),
evolution (array, 2-3 bullets sur le déroulé),
players (array, joueurs marquants — prénoms/noms publics uniquement),
conclusion (string courte).
Données publiques uniquement. Français. Pas de tirets cadratins.`;

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_CHAT_MODEL,
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Match public JSON:\n${matchJson}` },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new HttpsError('internal', `Mistral error: ${errText.slice(0, 200)}`);
  }

  const body = (await res.json()) as Parameters<typeof extractMistralChatText>[0];
  return extractMistralChatText(body);
}

/** Résumé post-match supporter — données publiques, cache Firestore. */
export const generateSupporterMatchSummary = onCall(
  { region: 'europe-west1', timeoutSeconds: 90, memory: '512MiB' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise');
    }

    const matchRaw = (request.data as { match?: Record<string, unknown> })?.match;
    if (!matchRaw || typeof matchRaw !== 'object') {
      throw new HttpsError('invalid-argument', 'match requis');
    }

    const match = sanitizePublicMatch(matchRaw);
    const matchId = String(match.matchId ?? match.id ?? '').trim();
    if (!matchId) throw new HttpsError('invalid-argument', 'matchId requis');

    const status = String(match.status ?? '');
    if (status !== 'finished') {
      throw new HttpsError('failed-precondition', 'Résumé disponible après la fin du match');
    }

    const cacheRef = db.doc(`${SUMMARIES_COL}/${matchId}`);
    const cached = await cacheRef.get();
    if (cached.exists && !request.data?.force) {
      const d = cached.data()!;
      return {
        matchId,
        happened: d.happened ?? [],
        keyMoment: d.key_moment ?? '',
        stats: d.stats ?? [],
        evolution: d.evolution ?? [],
        players: d.players ?? [],
        conclusion: d.conclusion ?? '',
        disclaimer: d.disclaimer ?? DISCLAIMER,
      } satisfies SupporterMatchSummaryPayload;
    }

    const apiKey = getMistralApiKey();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Clé Mistral non configurée');
    }

    const text = await callMistralSummary(apiKey, JSON.stringify(match));
    const summary = parseSummaryJson(text, matchId);

    await cacheRef.set({
      happened: summary.happened,
      key_moment: summary.keyMoment,
      stats: summary.stats,
      evolution: summary.evolution,
      players: summary.players,
      conclusion: summary.conclusion,
      disclaimer: summary.disclaimer,
      generated_at: admin.firestore.FieldValue.serverTimestamp(),
      generated_by_uid: request.auth.uid,
    });

    return summary;
  },
);
