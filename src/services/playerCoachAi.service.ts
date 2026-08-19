import { callFunction } from '../lib/firebaseFunctions';

export type PlayerCoachAiMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PlayerCoachAiResult = {
  reply: string;
  model: string;
  agents_used?: string[];
};

/** Coach IA joueur — contexte profil, wellness, matchs via Cloud Function. */
export async function sendPlayerCoachMessage(
  messages: PlayerCoachAiMessage[],
): Promise<PlayerCoachAiResult> {
  return callFunction<
    { messages: PlayerCoachAiMessage[] },
    PlayerCoachAiResult
  >('playerCoachAiChat', { messages }, 'europe-west1');
}
