import type { User, UserRole } from '../models/User';

import { requiresMessageRequest } from './messageRequestState';

export type ThreadKind = 'standard' | 'physio_care' | 'team_group' | 'message_request';

export function isPhysioCarePair(roleA: UserRole, roleB: UserRole): boolean {
  return (
    (roleA === 'physio' && roleB === 'player') || (roleA === 'player' && roleB === 'physio')
  );
}

export function threadKindForParticipants(
  currentRole: UserRole,
  otherRole: UserRole
): ThreadKind {
  if (isPhysioCarePair(currentRole, otherRole)) return 'physio_care';
  if (requiresMessageRequest(currentRole, otherRole)) return 'message_request';
  return 'standard';
}

export function physioCareThreadLabel(kind: ThreadKind | undefined): string | null {
  if (kind === 'physio_care') return 'Suivi kiné';
  if (kind === 'team_group') return 'Équipe';
  return null;
}
