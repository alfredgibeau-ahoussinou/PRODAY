/**
 * Persistance locale des conversations du Copilote.
 *
 * Le stockage est **cloisonné par portée** (`copilotScopeKey`) : une conversation écrite
 * pour un compte/club/rôle donné n'est jamais relue depuis une autre portée. Changer de club
 * ou de rôle ne donne donc pas accès à l'historique précédent, même sur le même appareil.
 *
 * Un échec de stockage ne casse pas la conversation : il est signalé (`ok: false`) pour que
 * l'interface puisse le dire, plutôt que de laisser croire à un enregistrement réussi.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MAX_CONVERSATIONS_PER_SCOPE,
  humanizeCopilotError,
  isPersistable,
  sortConversations,
} from './copilotCore';
import type { CopilotConversation } from './copilotCore';

const STORAGE_PREFIX = '@proday/copilot/v1/';

export function copilotStorageKey(scopeKey: string): string {
  return `${STORAGE_PREFIX}${scopeKey}`;
}

export type CopilotLoadResult = {
  conversations: CopilotConversation[];
  /** Vrai si la lecture a échoué : l'interface doit alors ne rien affirmer sur l'historique. */
  failed: boolean;
};

function isConversation(value: unknown): value is CopilotConversation {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<CopilotConversation>;
  return (
    typeof c.id === 'string' &&
    typeof c.scopeKey === 'string' &&
    typeof c.title === 'string' &&
    Array.isArray(c.messages)
  );
}

/**
 * Nettoie ce qui vient du disque.
 *
 * Deux garanties tenues **au moment de l'affichage**, et pas seulement à l'écriture :
 *   - un message resté `pending` à la fermeture ne se rouvre pas « en génération » à vie ;
 *   - une erreur enregistrée avant la traduction des messages reste brute sur le disque, donc
 *     elle est retraduite ici. Sans cela, un ancien `429` avec le JSON du fournisseur
 *     continuerait de s'afficher tel quel, ce qui a été constaté en conditions réelles.
 */
function revive(conv: CopilotConversation): CopilotConversation {
  return {
    ...conv,
    messages: conv.messages.map((m) => {
      if (m.status === 'pending') return { ...m, status: 'stopped' as const };
      if (m.status === 'failed' && m.error) {
        return { ...m, error: humanizeCopilotError(m.error) };
      }
      return m;
    }),
  };
}

export async function loadConversations(scopeKey: string): Promise<CopilotLoadResult> {
  try {
    const raw = await AsyncStorage.getItem(copilotStorageKey(scopeKey));
    if (!raw) return { conversations: [], failed: false };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { conversations: [], failed: false };
    const conversations = parsed
      .filter(isConversation)
      .filter((c) => c.scopeKey === scopeKey)
      .map(revive);
    return { conversations: sortConversations(conversations), failed: false };
  } catch {
    return { conversations: [], failed: true };
  }
}

export type CopilotWriteResult = { ok: boolean; reason?: string };

export async function saveConversations(
  scopeKey: string,
  conversations: CopilotConversation[],
): Promise<CopilotWriteResult> {
  const payload = sortConversations(conversations.filter(isPersistable)).slice(
    0,
    MAX_CONVERSATIONS_PER_SCOPE,
  );
  try {
    await AsyncStorage.setItem(copilotStorageKey(scopeKey), JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error && e.message ? e.message : 'stockage local indisponible',
    };
  }
}

export async function deleteConversation(scopeKey: string, id: string): Promise<CopilotWriteResult> {
  const { conversations } = await loadConversations(scopeKey);
  return saveConversations(
    scopeKey,
    conversations.filter((c) => c.id !== id),
  );
}

/** Supprime l'historique de la portée. Utilisé par « Nouvelle conversation » sur demande explicite. */
export async function clearScope(scopeKey: string): Promise<CopilotWriteResult> {
  try {
    await AsyncStorage.removeItem(copilotStorageKey(scopeKey));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'stockage local indisponible' };
  }
}
