import { callFunction } from '../lib/firebaseFunctions';

export type ProdayAiMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ProdayAiResult = {
  reply: string;
  agents_used: string[];
  model: string;
};

export async function askProdayAi(
  messages: ProdayAiMessage[],
  teamId?: string,
): Promise<ProdayAiResult> {
  return callFunction<
    { messages: ProdayAiMessage[]; team_id?: string },
    ProdayAiResult
  >('prodayAiChat', { messages, team_id: teamId }, 'europe-west1');
}
