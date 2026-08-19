/**
 * CF callable — génère un programme d'entraînement individuel via Mistral.
 * Appelée par le joueur depuis TrainHubScreen.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { configStr } from './runtimeConfig';
import { MISTRAL_CHAT_MODEL, extractMistralChatText } from './mistralModels';

interface GenerateRequest {
  objective: string;
  position?: string;
  level: string;
  duration_min: number;
  equipment: string[];
  partner: boolean;
}

function getMistralApiKey(): string | null {
  return configStr('mistral', 'api_key', ['MISTRAL_API_KEY']) ?? null;
}

const OBJECTIVE_LABELS: Record<string, string> = {
  pied_faible: 'Travail du pied faible',
  vitesse: 'Vitesse et explosivité',
  endurance: 'Endurance',
  frappe: 'Frappe et finition',
  dribble: 'Dribble et feintes',
  passes: 'Passes et vision du jeu',
  heading: 'Jeu de tête',
  technique: 'Technique générale',
  physique: 'Préparation physique',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export const generateHomeTraining = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const apiKey = getMistralApiKey();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Mistral non configuré (MISTRAL_API_KEY).');
    }

    const data = (request.data ?? {}) as GenerateRequest;
    const objective = OBJECTIVE_LABELS[data.objective] ?? data.objective ?? 'Technique';
    const level = LEVEL_LABELS[data.level] ?? data.level ?? 'Intermédiaire';
    const durationMin = Math.min(Math.max(Number(data.duration_min) || 30, 10), 90);
    const equipment = Array.isArray(data.equipment)
      ? data.equipment.map(String).slice(0, 10)
      : [];
    const partner = Boolean(data.partner);
    const position = data.position ? String(data.position).slice(0, 30) : undefined;

    const prompt = [
      `Génère un programme d'entraînement individuel football.`,
      `Objectif : ${objective}`,
      `Durée disponible : ${durationMin} minutes`,
      `Niveau : ${level}`,
      position ? `Poste du joueur : ${position}` : '',
      `Matériel disponible : ${equipment.length ? equipment.join(', ') : 'aucun (sans matériel)'}`,
      `Partenaire : ${partner ? 'oui (avec quelqu\'un)' : 'non (seul)'}`,
      '',
      `Réponds en JSON strict avec ce schéma :`,
      `{`,
      `  "phases": [`,
      `    {`,
      `      "name": "warmup|exercises|cooldown",`,
      `      "label": "Nom de la phase",`,
      `      "duration_min": 5,`,
      `      "exercises": [`,
      `        {`,
      `          "name": "Nom",`,
      `          "description": "Description détaillée (2-3 phrases, consignes claires)",`,
      `          "duration_min": 5,`,
      `          "reps": 10,`,
      `          "sets": 3,`,
      `          "rest_sec": 30,`,
      `          "equipment": ["ballon"],`,
      `          "tips": ["Conseil"]`,
      `        }`,
      `      ]`,
      `    }`,
      `  ]`,
      `}`,
      '',
      `Règles :`,
      `- 3 phases : warmup, exercises, cooldown`,
      `- La somme des duration_min doit être ~${durationMin} min`,
      `- Phase exercises : 3 à 5 exercices progressifs`,
      `- Exercices réalisables ${partner ? 'à deux' : 'seul'} ${equipment.length ? `avec ${equipment.join(', ')}` : 'sans matériel'}`,
      `- Adapter au poste ${position ? `(${position})` : 'polyvalent'}`,
      `- reps et sets obligatoires pour les exercices physiques / techniques`,
      `- rest_sec entre séries`,
      `- tips : 1-2 conseils concrets par exercice`,
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
            content: 'Tu es un préparateur physique football. Réponds UNIQUEMENT en JSON valide, sans markdown. Langue: français.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[generateHomeTraining] Mistral', res.status, body.slice(0, 400));
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
        equipment,
        partner,
        position,
        phases: parsed.phases,
      };
    } catch {
      throw new HttpsError('internal', 'Réponse IA illisible.');
    }
  },
);
