import type { Membership, MembershipStatus } from '../models/Membership';

const TERMINAL_STATUSES = new Set<MembershipStatus>(['left', 'rejected']);

export function hasActiveClubMembership(
  memberships: Membership[],
  clubId: string,
): boolean {
  return memberships.some(
    (m) => m.club_id === clubId && (m.status === 'active' || m.status === 'pending'),
  );
}

export function canRequestClubMembership(
  memberships: Membership[],
  clubId: string,
): { allowed: boolean; reason?: string } {
  const existing = memberships.filter((m) => m.club_id === clubId);
  const active = existing.find((m) => m.status === 'active');
  if (active) {
    return { allowed: false, reason: 'Vous êtes déjà affilié à ce club.' };
  }
  const pending = existing.find((m) => m.status === 'pending');
  if (pending) {
    return { allowed: false, reason: 'Une demande est déjà en attente pour ce club.' };
  }
  const open = existing.filter((m) => !TERMINAL_STATUSES.has(m.status));
  if (open.length > 0) {
    return { allowed: false, reason: 'Affiliation déjà en cours pour ce club.' };
  }
  return { allowed: true };
}

export function canApproveMembership(
  membership: Membership,
  approverClubId: string | null | undefined,
): boolean {
  if (membership.status !== 'pending') return false;
  if (!approverClubId) return false;
  return membership.club_id === approverClubId;
}
