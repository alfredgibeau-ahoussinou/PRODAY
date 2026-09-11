import { callFunction } from '../lib/firebaseFunctions';
import { stripDashTypography } from '../utils/stripDashTypography';

export type ClubAssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ClubAssistantChatResult = {
  reply: string;
  model: string;
  clubId: string;
};

export type ClubAssistantContext = {
  clubId?: string;
  clubName?: string;
  teamCount?: number;
  playerCount?: number;
  coachCount?: number;
  pendingMemberships?: number;
  eventsCount?: number;
};

/**
 * Appel direct à Google Gemini API si configuré côté client (EXPO_PUBLIC_GEMINI_API_KEY).
 */
async function callDirectGeminiClub(
  apiKey: string,
  messages: ClubAssistantChatMessage[],
  context?: ClubAssistantContext,
): Promise<ClubAssistantChatResult> {
  const preferredModel = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const modelsToTry = [preferredModel, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'].filter(
    (v, i, a) => a.indexOf(v) === i && !!v,
  );

  const systemInstruction = `Tu es le Copilote IA Dirigeant ProDay propulsé par Google Gemini (modèle Gemini Flash Lite).
Tu t'adresses au président ou dirigeant d'un club amateur de football français comme un conseiller de direction compétent, clair et chaleureux.
Si on te demande quelle IA tu es, confirme expressément que tu es Google Gemini intégré dans ProDay Club (tu n'es ni Meta, ni Mistral, ni ChatGPT).
Données club en temps réel :
- Club : ${context?.clubName || 'Club ProDay'} (ID: ${context?.clubId || 'N/A'})
- Équipes engagées : ${context?.teamCount ?? 'Non renseigné'}
- Licenciés enregistrés : ${context?.playerCount ?? 'Non renseigné'}
- Staff & Coachs : ${context?.coachCount ?? 'Non renseigné'}
- Adhésions / Licences en attente : ${context?.pendingMemberships ?? 0}
- Événements planifiés : ${context?.eventsCount ?? 0}

Règles impératives :
1. Langage naturel, clair, direct, valorisant pour le bénévole dirigeant.
2. Pas de tirets ni de puces « - » dans tes listes. Rédige en phrases fluides ou avec des numéros (1. 2. 3.).
3. Tu ne promets aucun prélèvement ni modification automatique : le dirigeant a toujours le dernier mot.
4. Si une donnée manque, explique où la retrouver ou la configurer dans l'application ProDay.`;

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
            temperature: 0.7,
            maxOutputTokens: 1400,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        console.warn(`[clubAssistant] Gemini ${model} HTTP ${res.status}:`, err.slice(0, 100));
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
        reply: stripDashTypography(text),
        model: `Google Gemini (${model})`,
        clubId: context?.clubId || '',
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('Échec direct Google Gemini');
}

/** Copilote Club — dialogue Gemini Cloud & Direct. */
export async function sendClubAssistantMessage(
  messages: ClubAssistantChatMessage[],
  context?: ClubAssistantContext,
): Promise<ClubAssistantChatResult> {
  const directKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (directKey) {
    try {
      return await callDirectGeminiClub(directKey, messages, context);
    } catch (err) {
      console.warn('[clubAssistant] Direct Gemini failed, trying Cloud Function...', err);
    }
  }

  return callFunction<
    { messages: ClubAssistantChatMessage[] },
    ClubAssistantChatResult
  >('clubAssistantChat', { messages }, 'europe-west1');
}
