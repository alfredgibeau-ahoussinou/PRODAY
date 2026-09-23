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
 * Copilote Club.
 *
 * **Aucun appel direct au modèle depuis le client.** Le service appelait auparavant
 * `generativelanguage.googleapis.com` avec une clé lue dans
 * `process.env.EXPO_PUBLIC_GEMINI_API_KEY` : toute variable `EXPO_PUBLIC_*` étant
 * **inlinée dans le bundle**, la clé partait dans le binaire livré (fuite confirmée,
 * `D-014`). L'échange se fait désormais uniquement côté serveur, via la fonction
 * `clubAssistantChat`, où la clé reste dans l'environnement d'exécution.
 *
 * `context` reste accepté pour ne pas casser les appelants, mais il n'est plus transmis :
 * le serveur relit les données autorisées du club à partir de l'identité authentifiée,
 * ce qui interdit au client d'influencer le périmètre de données.
 */
export async function sendClubAssistantMessage(
  messages: ClubAssistantChatMessage[],
  _context?: ClubAssistantContext,
): Promise<ClubAssistantChatResult> {
  return callFunction<
    { messages: ClubAssistantChatMessage[] },
    ClubAssistantChatResult
  >('clubAssistantChat', { messages }, 'europe-west1');
}
