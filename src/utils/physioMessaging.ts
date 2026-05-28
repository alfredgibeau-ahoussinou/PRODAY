import type { User, UserRole } from '../models/User';

export type ThreadKind = 'standard' | 'physio_care';

export function isPhysioCarePair(roleA: UserRole, roleB: UserRole): boolean {
  return (
    (roleA === 'physio' && roleB === 'player') || (roleA === 'player' && roleB === 'physio')
  );
}

export function threadKindForParticipants(
  currentRole: UserRole,
  otherRole: UserRole
): ThreadKind {
  return isPhysioCarePair(currentRole, otherRole) ? 'physio_care' : 'standard';
}

export function physioCareThreadLabel(kind: ThreadKind | undefined): string | null {
  if (kind === 'physio_care') return 'Suivi kiné';
  return null;
}
