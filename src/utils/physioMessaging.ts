import type { UserRole } from '../models/User';

import { requiresMessageRequest } from './messageRequestState';

/** Kinds persistés — `physio_care` conservé pour threads legacy. */
/**
 * `group` = groupe créé depuis la messagerie (participants choisis, gestion des membres).
 * Il est distinct de `team_group` (fil d'équipe créé par le club) : les libellés et les
 * droits de gestion ne sont pas les mêmes.
 */
export type ThreadKind =
  | 'standard'
  | 'physio_care'
  | 'team_group'
  | 'group'
  | 'message_request';

export function isPhysioCarePair(_roleA: UserRole, _roleB: UserRole): boolean {
  return false;
}

export function threadKindForParticipants(
  currentRole: UserRole,
  otherRole: UserRole,
): ThreadKind {
  if (requiresMessageRequest(currentRole, otherRole)) return 'message_request';
  return 'standard';
}

export function physioCareThreadLabel(kind: ThreadKind | undefined): string | null {
  if (kind === 'team_group') return 'Équipe';
  if (kind === 'group') return 'Groupe';
  return null;
}
