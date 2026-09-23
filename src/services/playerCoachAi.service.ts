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
 * Coach IA joueur — **échange uniquement côté serveur**.
 *
 * Ce service appelait auparavant `generativelanguage.googleapis.com` directement avec une
 * clé lue dans `process.env.EXPO_PUBLIC_GEMINI_API_KEY`, **en repli du callable**. Or toute
 * variable `EXPO_PUBLIC_*` est inlinée dans le bundle : la clé était donc livrée dans
 * l'application (fuite confirmée dans le bundle courant, `D-014`). Ce repli est supprimé
 * plutôt que déplacé : laisser au client un second chemin vers le modèle rendrait le
 * cloisonnement des données impossible à garantir, puisque le prompt est construit ici.
 */
export async function sendPlayerCoachMessage(
  messages: PlayerCoachAiMessage[],
  context?: PlayerCoachContext,
): Promise<PlayerCoachAiResult> {
  return callFunction<
    { messages: PlayerCoachAiMessage[]; context?: PlayerCoachContext },
    PlayerCoachAiResult
  >('playerCoachAiChat', { messages, context }, 'europe-west1');
}

