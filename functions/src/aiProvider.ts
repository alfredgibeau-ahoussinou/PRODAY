import { configStr } from './runtimeConfig';
import { MISTRAL_CHAT_MODEL, extractMistralChatText } from './mistralModels';

export type AiChatRole = 'user' | 'assistant' | 'system';
export type AiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export interface AiCompletionOptions {
  systemPrompt?: string;
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  preferProvider?: 'gemini' | 'mistral';
}

export interface AiCompletionResult {
  text: string;
  provider: 'gemini' | 'mistral';
  model: string;
}

export const GEMINI_DEFAULT_MODEL = 'gemini-3.6-flash';

export function getGeminiModel(): string {
  return configStr('gemini', 'model', ['GEMINI_MODEL', 'EXPO_PUBLIC_GEMINI_MODEL']) ?? GEMINI_DEFAULT_MODEL;
}

/**
 * Clé Gemini, **côté serveur uniquement**.
 *
 * `EXPO_PUBLIC_GEMINI_API_KEY` a été retirée de cette liste : accepter un nom préfixé
 * `EXPO_PUBLIC_` ici revenait à bénir une variable destinée à être inlinée dans le bundle
 * client. La clé ne doit exister que dans l'environnement d'exécution des fonctions
 * (voir `D-014`).
 */
export function getGeminiApiKey(): string | null {
  return configStr('gemini', 'api_key', ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'GOOGLE_API_KEY']) ?? null;
}

/**
 * Signale (sans jamais exposer la valeur) une configuration client dangereuse : une clé
 * de modèle présente dans une variable `EXPO_PUBLIC_*` est inlinée dans le bundle livré.
 */
export function detectLeakedClientKey(): string | null {
  const leaked = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!leaked || !leaked.trim()) return null;
  return 'EXPO_PUBLIC_GEMINI_API_KEY est définie : cette variable est inlinée dans le bundle client. Retirez-la et régénérez la clé (D-014).';
}

export function getMistralApiKey(): string | null {
  return configStr('mistral', 'api_key', ['MISTRAL_API_KEY']) ?? null;
}

/**
 * Appelle l'API Google Gemini (Google AI Studio).
 * Modèles réels avec failover automatique et mitigation 429.
 */
export async function callGeminiApi(
  apiKey: string,
  systemPrompt: string | undefined,
  messages: AiChatMessage[],
  options?: { model?: string; temperature?: number; maxTokens?: number },
): Promise<string> {
  const preferredModel = options?.model ?? getGeminiModel();
  const modelsToTry = [
    preferredModel,
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
  ].filter((v, i, a) => a.indexOf(v) === i && !!v);

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.5,
          maxOutputTokens: options?.maxTokens ?? 1600,
        },
      };

      if (systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`[aiProvider] Gemini ${model} HTTP ${res.status}:`, errText.slice(0, 200));
        
        // Si 429 Rate Limit, pause courte (800ms) avant d'essayer le modèle suivant
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 800));
        }
        
        lastError = new Error(`Gemini API error (${res.status}): ${errText.slice(0, 150)}`);
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
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('Échec des appels à Google Gemini');
}

/**
 * Appelle l'API Mistral AI.
 */
export async function callMistralApi(
  apiKey: string,
  systemPrompt: string | undefined,
  messages: AiChatMessage[],
  options?: { model?: string; temperature?: number; maxTokens?: number },
): Promise<string> {
  const model = options?.model ?? MISTRAL_CHAT_MODEL;
  const chatMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: options?.temperature ?? 0.5,
      max_tokens: options?.maxTokens ?? 1600,
      messages: chatMessages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[aiProvider] Mistral error', res.status, errText.slice(0, 400));
    throw new Error(`Mistral API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };

  const text = extractMistralChatText(json.choices?.[0]?.message?.content);
  if (!text) throw new Error('Réponse Mistral vide');
  return text;
}

/**
 * Moteur universel : exécute la requête avec le meilleur fournisseur disponible (Gemini gratuit par défaut, Mistral en secours).
 */
export async function generateAiChatCompletion(
  options: AiCompletionOptions,
): Promise<AiCompletionResult> {
  const geminiKey = getGeminiApiKey();
  const mistralKey = getMistralApiKey();

  if (!geminiKey && !mistralKey) {
    throw new Error('Aucune clé IA configurée (GEMINI_API_KEY ou MISTRAL_API_KEY requise).');
  }

  // Si l'utilisateur préfère Mistral ou si seule la clé Mistral est fournie
  if (options.preferProvider === 'mistral' && mistralKey) {
    try {
      const text = await callMistralApi(mistralKey, options.systemPrompt, options.messages, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });
      return { text, provider: 'mistral', model: MISTRAL_CHAT_MODEL };
    } catch (e) {
      if (geminiKey) {
        console.warn('[aiProvider] Failover Mistral -> Gemini', e);
        const text = await callGeminiApi(geminiKey, options.systemPrompt, options.messages, {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        });
        return { text, provider: 'gemini', model: GEMINI_DEFAULT_MODEL };
      }
      throw e;
    }
  }

  // Par défaut : utiliser Gemini Flash (100% gratuit) si disponible
  if (geminiKey) {
    try {
      const text = await callGeminiApi(geminiKey, options.systemPrompt, options.messages, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });
      return { text, provider: 'gemini', model: GEMINI_DEFAULT_MODEL };
    } catch (e) {
      if (mistralKey) {
        console.warn('[aiProvider] Failover Gemini -> Mistral', e);
        const text = await callMistralApi(mistralKey, options.systemPrompt, options.messages, {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        });
        return { text, provider: 'mistral', model: MISTRAL_CHAT_MODEL };
      }
      throw e;
    }
  }

  // Fallback si uniquement clé Mistral
  const text = await callMistralApi(mistralKey!, options.systemPrompt, options.messages, {
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });
  return { text, provider: 'mistral', model: MISTRAL_CHAT_MODEL };
}
