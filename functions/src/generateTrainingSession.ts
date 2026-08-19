/**
 * CF callable — génère une séance d'entraînement collectif via Mistral.
 * Appelée par le coach depuis CoachTrainingEventHub.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { configStr } from './runtimeConfig';
import { MISTRAL_CHAT_MODEL, extractMistralChatText } from './mistralModels';

const db = admin.firestore();

interface GenerateRequest {
  club_id: string;
  team_id?: string;
  objective: string;
  duration_min: number;
  level: string;
  player_count: number;
  coach_notes?: string;
}

function getMistralApiKey(): string | null {
  return configStr('mistral', 'api_key', ['MISTRAL_API_KEY']) ?? null;
}

async function assertCoachOrStaff(uid: string, clubId: string): Promise<void> {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'Profil introuvable.');
  const user = snap.data() ?? {};
  const role = String(user.role ?? '');
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
  const userClub = String(profile.club_id ?? user.club_id ?? '');
  const isStaff = ['coach', 'club', 'admin', 'staff'].includes(role) || Boolean(user.is_admin);
  if (!isStaff) throw new HttpsError('permission-denied', 'Réservé au staff coach / club.');
  if (userClub && userClub !== clubId && !user.is_admin) {
    throw new HttpsError('permission-denied', 'Club non autorisé.');
  }
}

const OBJECTIVE_LABELS: Record<string, string> = {
  technique: 'Technique individuelle et collective',
  physique: 'Préparation physique',
  tactique: 'Organisation tactique',
  recuperation: 'Récupération active',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export const generateTrainingSession = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const data = (request.data ?? {}) as GenerateRequest;
    const clubId = String(data.club_id ?? '').trim();
    if (!clubId) throw new HttpsError('invalid-argument', 'club_id requis.');

    await assertCoachOrStaff(request.auth.uid, clubId);

    const apiKey = getMistralApiKey();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Mistral non configuré (MISTRAL_API_KEY).');
    }

    const objective = OBJECTIVE_LABELS[data.objective] ?? data.objective ?? 'Technique';
    const level = LEVEL_LABELS[data.level] ?? data.level ?? 'Intermédiaire';
    const durationMin = Math.min(Math.max(Number(data.duration_min) || 90, 30), 120);
    const playerCount = Math.min(Math.max(Number(data.player_count) || 18, 4), 40);

    const prompt = [
      `Génère une séance d'entraînement collectif football.`,
      `Objectif : ${objective}`,
      `Durée totale : ${durationMin} minutes`,
      `Niveau : ${level}`,
      `Nombre de joueurs : ${playerCount}`,
      data.coach_notes ? `Notes du coach : ${String(data.coach_notes).slice(0, 400)}` : '',
      '',
      `Réponds en JSON strict avec ce schéma :`,
      `{`,
      `  "phases": [`,
      `    {`,
      `      "name": "warmup|exercises|game|cooldown",`,
      `      "label": "Nom de la phase en français",`,
      `      "duration_min": 15,`,
      `      "exercises": [`,
      `        {`,
      `          "name": "Nom de l'exercice",`,
      `          "description": "Description détaillée (2-3 phrases)",`,
      `          "duration_min": 8,`,
      `          "reps": null,`,
      `          "sets": null,`,
      `          "rest_sec": 60,`,
      `          "equipment": ["ballon", "cônes"],`,
      `          "tips": ["Conseil technique"]`,
      `        }`,
      `      ]`,
      `    }`,
      `  ]`,
      `}`,
      '',
      `Règles :`,
      `- EXACTEMENT 4 phases : warmup, exercises, game, cooldown`,
      `- La somme des duration_min des phases doit être ~${durationMin} min`,
      `- Chaque phase a 1 à 3 exercices concrets`,
      `- Exercices adaptés au nombre de joueurs (${playerCount})`,
      `- Descriptions précises : distances, répétitions, organisation du terrain`,
      `- equipment : uniquement ballon, cônes, chasubles, mini-buts, plots, échelle, tapis`,
      `- tips : 1-2 conseils par exercice`,
      `- Langue : français uniquement`,
    ].filter(Boolean).join('\n');

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MISTRAL_CHAT_MODEL,
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Tu es un éducateur football diplômé. Réponds UNIQUEMENT en JSON valide, sans markdown. Langue: français.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[generateTrainingSession] Mistral', res.status, body.slice(0, 400));
      throw new HttpsError('internal', 'Le modèle IA a échoué. Réessayez.');
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const text = extractMistralChatText(json.choices?.[0]?.message?.content);
    if (!text) throw new HttpsError('internal', 'Réponse IA vide.');

    try {
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned) as { phases?: unknown[] };
      if (!Array.isArray(parsed.phases) || parsed.phases.length === 0) {
        throw new Error('phases manquantes');
      }
      return {
        source: 'mistral',
        objective: data.objective,
        duration_min: durationMin,
        level: data.level,
        player_count: playerCount,
        phases: parsed.phases,
      };
    } catch {
      throw new HttpsError('internal', 'Réponse IA illisible.');
    }
  },
);
