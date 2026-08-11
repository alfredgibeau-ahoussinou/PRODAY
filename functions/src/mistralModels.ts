/**
 * Modèles Mistral — versions 2026 (IDs datés, pas d’alias flou).
 * @see https://docs.mistral.ai/getting-started/models/models_overview/
 *
 * Medium 3.5 · avril 2026 (v26.04) — frontier multimodal + reasoning configurable.
 * Small 4 · mars 2026 — texte rapide (alias -latest = Small 4).
 */

/** Copilote Club — Mistral Medium 3.5 (2026-04). */
export const MISTRAL_CHAT_MODEL = 'mistral-medium-3-5';

/** Vision documents / highlights — même Medium 3.5 multimodal. */
export const MISTRAL_VISION_MODEL = 'mistral-medium-3-5';

/** Texte léger (tags) — Small 4. */
export const MISTRAL_TEXT_FAST_MODEL = 'mistral-small-latest';

/** Reasoning Medium 3.5 / Small 4. */
export type MistralReasoningEffort = 'none' | 'high';

/**
 * Extrait le texte final d’une réponse chat (string ou chunks thinking+text).
 */
export function extractMistralChatText(content: unknown): string {
  if (typeof content === 'string') return content.trim();
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const chunk of content) {
    if (!chunk || typeof chunk !== 'object') continue;
    const c = chunk as { type?: string; text?: string };
    if (c.type === 'text' && typeof c.text === 'string') {
      parts.push(c.text);
    }
  }
  return parts.join('').trim();
}
