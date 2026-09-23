import type { User, UserRole } from '../models/User';
import type { Membership } from '../models/Membership';
import { isSyntheticUser } from '../utils/realUserFilter';
import { isPlatformAdminEmail } from '../config/admin';
import { isRetiredUserRole } from '../utils/retiredRoles';
import { isSponsorRole } from '../content/sponsorExperience';

export type UserDestinationKind =
  | 'guest'
  | 'platform_admin'
  | 'retired'
  | 'standalone_role'
  | 'demo'
  | 'no_club'
  | 'pending_approval'
  | 'active_club'
  | 'multi_club';

export interface UserDestination {
  kind: UserDestinationKind;
  user?: User;
  membership?: Membership;
  memberships?: Membership[];
  clubId?: string;
  role?: UserRole;
  latestRejected?: Membership;
}

export function resolveUserDestination(
  user: User | null | undefined,
  memberships: Membership[] = [],
  options?: {
    bypassAdmin?: boolean;
  },
): UserDestination {
  if (!user) {
    return { kind: 'guest' };
  }

  // 1. Platform Admin
  if (!options?.bypassAdmin && (user.is_admin || isPlatformAdminEmail(user.email))) {
    return { kind: 'platform_admin', user };
  }

  // 2. Retired Roles
  if (isRetiredUserRole(user.role)) {
    return { kind: 'retired', user, role: user.role };
  }

  // 3. Standalone self-governed roles (Sponsor, Parent, Supporter)
  if (isSponsorRole(user.role)) {
    return { kind: 'standalone_role', role: 'sponsor', user };
  }
  if (user.role === 'parent') {
    return { kind: 'standalone_role', role: 'parent', user };
  }
  if (user.role === 'supporter') {
    return { kind: 'standalone_role', role: 'supporter', user };
  }

  // 4. Synthetic / Demo Accounts — kept strictly isolated
  if (isSyntheticUser(user)) {
    const demoClubId = user.profile?.club_id || 'demo-club';
    return { kind: 'demo', clubId: demoClubId, user, role: user.role };
  }

  // 5. Check live memberships for Player / Coach / Club
  const activeMemberships = memberships.filter((m) => m.status === 'active');
  const pendingMemberships = memberships.filter((m) => m.status === 'pending');
  const rejectedMemberships = memberships.filter((m) => m.status === 'rejected');

  // Multi-club membership
  if (activeMemberships.length > 1) {
    const storedChoice = user.profile?.club_id;
    const chosen =
      (storedChoice
        ? activeMemberships.find((m) => m.club_id === storedChoice)
        : undefined) ?? activeMemberships[0];
    return {
      // Choix d'espace déjà enregistré (et toujours actif) → club direct.
      // Sinon multi_club : l'écran de sélection propose les adhésions actives
      // (jamais de retombée silencieuse sur le premier club).
      kind:
        storedChoice && chosen.club_id === storedChoice
          ? 'active_club'
          : 'multi_club',
      memberships: activeMemberships,
      membership: chosen,
      clubId: chosen.club_id,
      role: (chosen.role as UserRole) || user.role,
      user,
    };
  }

  // Single active membership
  if (activeMemberships.length === 1) {
    const primary = activeMemberships[0];
    return {
      kind: 'active_club',
      membership: primary,
      clubId: primary.club_id,
      role: (primary.role as UserRole) || user.role,
      user,
    };
  }

  // Fallback: If user profile already has an established club_id (e.g. club owner or existing verified profile)
  // but memberships collection hasn't created a doc yet, treat as active if club role or explicit profile club_id
  if (user.profile?.club_id && user.profile.club_id !== 'demo-club' && user.profile.club_id !== 'club-demo') {
    // If there is no pending membership indicating an ongoing request
    if (pendingMemberships.length === 0) {
      return {
        kind: 'active_club',
        clubId: user.profile.club_id,
        role: user.role,
        user,
      };
    }
  }

  // Pending membership request awaiting club approval
  if (pendingMemberships.length > 0) {
    return {
      kind: 'pending_approval',
      membership: pendingMemberships[0],
      clubId: pendingMemberships[0].club_id,
      user,
    };
  }

  // No active and no pending memberships -> Autonomous "No Club" space
  const latestRejected = rejectedMemberships.sort(
    (a, b) => (b.updated_at?.getTime?.() ?? 0) - (a.updated_at?.getTime?.() ?? 0),
  )[0];

  return {
    kind: 'no_club',
    user,
    role: user.role,
    latestRejected,
  };
}
