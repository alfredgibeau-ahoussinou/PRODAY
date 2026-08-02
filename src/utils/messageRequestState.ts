import type { UserRole } from '../models/User';
import type {
  ConversationAccessState,
  MessageRequest,
  MessageRequestPairKind,
  MessageRequestStatus,
} from '../models/MessageRequest';

/** Joueur ↔ agent : flux invitation obligatoire. */
export function requiresMessageRequest(
  roleA: UserRole,
  roleB: UserRole,
): boolean {
  const pair = new Set([roleA, roleB]);
  return pair.has('player') && pair.has('agent');
}

export function messageRequestPairKind(
  roleA: UserRole,
  roleB: UserRole,
): MessageRequestPairKind {
  return requiresMessageRequest(roleA, roleB) ? 'player_agent' : 'standard';
}

export function conversationAccessFromRequest(
  request: Pick<MessageRequest, 'status'> | null | undefined,
  pairKind: MessageRequestPairKind,
): ConversationAccessState {
  if (pairKind !== 'player_agent') return 'open';
  if (!request) return 'request_pending';
  switch (request.status) {
    case 'accepted':
      return 'open';
    case 'refused':
      return 'request_refused';
    case 'cancelled':
      return 'blocked';
    case 'pending':
    default:
      return 'request_pending';
  }
}

export function canSendInConversation(access: ConversationAccessState): boolean {
  return access === 'open';
}

/** Transitions autorisées pour le destinataire (accept / refuse). */
export function resolveMessageRequest(
  current: MessageRequestStatus,
  action: 'accept' | 'refuse' | 'cancel',
  actor: 'recipient' | 'requester',
): MessageRequestStatus | null {
  if (current !== 'pending') return null;
  if (action === 'cancel' && actor === 'requester') return 'cancelled';
  if (actor !== 'recipient') return null;
  if (action === 'accept') return 'accepted';
  if (action === 'refuse') return 'refused';
  return null;
}

export function isActiveConversation(
  request: Pick<MessageRequest, 'status'> | null | undefined,
  pairKind: MessageRequestPairKind,
): boolean {
  return canSendInConversation(conversationAccessFromRequest(request, pairKind));
}
