import { callFunction } from '../lib/firebaseFunctions';

export type PlayerTacticsChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PlayerTacticsChatResult = {
  reply: string;
  model: string;
};

/** Coach IA joueur — football & tactique via Cloud Function. */
export async function sendPlayerTacticsMessage(
  messages: PlayerTacticsChatMessage[],
): Promise<PlayerTacticsChatResult> {
  return callFunction<
    { messages: PlayerTacticsChatMessage[] },
    PlayerTacticsChatResult
  >('playerTacticsChat', { messages }, 'europe-west1');
}
