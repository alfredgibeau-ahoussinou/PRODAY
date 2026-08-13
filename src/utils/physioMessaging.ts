import type { UserRole } from '../models/User';

import { requiresMessageRequest } from './messageRequestState';

/** Kinds persistés — `physio_care` conservé pour threads legacy. */
export type ThreadKind = 'standard' | 'physio_care' | 'team_group' | 'message_request';

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
  return null;
}
