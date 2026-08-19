import { callFunction } from '../lib/firebaseFunctions';

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
  | { type: 'save_weekly_goal'; goal: string };

export type PlayerCoachAiResult = {
  reply: string;
  model: string;
  agents_used?: string[];
  actions?: PlayerAiAction[];
  suggestions?: string[];
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
