import { callFunction } from '../lib/firebaseFunctions';

export type PresidentAssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PresidentAssistantChatResult = {
  reply: string;
  model?: string;
  clubId?: string;
};

export type PresidentAssistantContextHint = {
  clubName?: string;
  teamsCount?: number;
  playersCount?: number;
  coachesCount?: number;
  pendingMemberships?: number;
  teamsWithoutCoach?: number;
};

/**
 * Client CF `presidentAssistantChat` (europe-west1).
 * Env serveur : MISTRAL_API_KEY (runtimeConfig mistral.api_key).
 */
export async function sendPresidentAssistantMessage(
  messages: PresidentAssistantChatMessage[],
  contextHint?: PresidentAssistantContextHint,
): Promise<PresidentAssistantChatResult> {
  return callFunction<
    {
      messages: PresidentAssistantChatMessage[];
      contextHint?: PresidentAssistantContextHint;
    },
    PresidentAssistantChatResult
  >('presidentAssistantChat', { messages, contextHint }, 'europe-west1');
}
