import { callFunction } from '../lib/firebaseFunctions';
import type { PlayerThemePrefs } from '../models/PlayerThemePrefs';

export type PlayerCoachAiMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PlayerAiNavigateTab =
  | 'home'
  | 'matchs'
  | 'feed'
  | 'profil'
  | 'plus'
  | 'messages'
  | 'train_ai';

export type PlayerAiAction =
  | { type: 'navigate'; tab: PlayerAiNavigateTab }
  | { type: 'open_training'; params?: Record<string, unknown> }
  | { type: 'report_late'; eventId: string; delay: 'under_10' | 'over_10' | 'unknown' }
  | { type: 'generate_training'; objective: string; durationMin: number }
  | { type: 'save_weekly_goal'; goal: string }
  | { type: 'apply_theme'; prefs: PlayerThemePrefs; label: string };

export type PlayerCoachAiResult = {
  reply: string;
  model: string;
  agents_used?: string[];
  actions?: PlayerAiAction[];
  suggestions?: string[];
};

export type PlayerCoachContext = {
  playerName?: string;
  position?: string;
  clubName?: string;
  wellness?: {
    energy?: string;
    sleep?: string;
    muscleState?: string;
  };
};

/**
 * Appel direct à Google Gemini API si configuré côté client (EXPO_PUBLIC_GEMINI_API_KEY).
 */
async function callDirectGemini(
  apiKey: string,
  messages: PlayerCoachAiMessage[],
  context?: PlayerCoachContext,
): Promise<PlayerCoachAiResult> {
  const preferredModel = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const modelsToTry = [preferredModel, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'].filter(
    (v, i, a) => a.indexOf(v) === i && !!v,
  );

  const systemInstruction = `Tu es le Conseiller Tactique & Coach IA personnel ProDay pour un joueur de football français, propulsé par Google Gemini.
Si on te demande quelle IA tu es, confirme expressément que tu es Google Gemini.
Tu t'adresses au joueur avec bienveillance, tutoiement chaleureux, conseils tactiques précis, drills d'entraînement et routines de forme.
Données joueur connues :
- Nom : ${context?.playerName || 'Joueur ProDay'}
- Poste : ${context?.position || 'Non spécifié'}
- Club : ${context?.clubName || 'Autonome'}
- État de forme du jour : Énergie: ${context?.wellness?.energy || 'Normal'}, Sommeil: ${context?.wellness?.sleep || 'Normal'}, Muscles: ${context?.wellness?.muscleState || 'Frais'}

Règles :
1. Phrases concises (3 à 6 phrases), percutantes, sans tirets (-) excessifs.
2. Conseils réalistes et adaptés au poste et à l'état de fatigue.
3. Jamais de faux diagnostic médical. En cas de douleur aiguë, recommander un repos ou un avis médical.`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1200,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        lastError = new Error(`Gemini Direct API error (${res.status}): ${err.slice(0, 100)}`);
        continue;
      }

      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        lastError = new Error(`Réponse Gemini ${model} vide`);
        continue;
      }

      return {
        reply: text,
        model: `Google Gemini (${model})`,
        agents_used: ['gemini-direct'],
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('Échec direct Google Gemini');
}

/** Coach IA joueur — contexte profil, wellness, matchs via Cloud Function ou Gemini direct. */
export async function sendPlayerCoachMessage(
  messages: PlayerCoachAiMessage[],
  context?: PlayerCoachContext,
): Promise<PlayerCoachAiResult> {
  const directApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  try {
    return await callFunction<
      { messages: PlayerCoachAiMessage[]; context?: PlayerCoachContext },
      PlayerCoachAiResult
    >('playerCoachAiChat', { messages, context }, 'europe-west1');
  } catch (cloudErr) {
    if (directApiKey) {
      return await callDirectGemini(directApiKey, messages, context);
    }
    throw cloudErr;
  }
}

