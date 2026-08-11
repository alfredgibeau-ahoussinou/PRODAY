import { callFunction } from '../lib/firebaseFunctions';

export type ClubAssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ClubAssistantChatResult = {
  reply: string;
  model: string;
  clubId: string;
};

/** Copilote Club — dialogue Mistral via Cloud Function. */
export async function sendClubAssistantMessage(
  messages: ClubAssistantChatMessage[],
): Promise<ClubAssistantChatResult> {
  return callFunction<
    { messages: ClubAssistantChatMessage[] },
    ClubAssistantChatResult
  >('clubAssistantChat', { messages }, 'europe-west1');
}
