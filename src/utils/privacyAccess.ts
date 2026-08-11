import type {
  PrivacyAccessGrant,
  PrivacyPermission,
  PrivacyResourceType,
} from '../models/Privacy';

export type PrivacyActorRole =
  | 'patient'
  | 'physio'
  | 'parent'
  | 'coach'
  | 'club'
  | 'recruiter'
  | 'agent'
  | 'admin'
  | 'other';

export interface TreatingLink {
  physio_uid: string;
  patient_uid: string;
  /** Patient explicitly revoked treating-pro access */
  treating_revoked?: boolean;
}

export interface PrivacyAccessContext {
  actor_uid: string;
  actor_role: PrivacyActorRole;
  /** Resource owner / patient uid */
  owner_uid: string;
  resource_type: PrivacyResourceType;
  resource_id: string;
  grants: PrivacyAccessGrant[];
  /** Treating appointments between physio and patient */
  treating_links?: TreatingLink[];
  /** Parent linked to minor and parental_settings.privacy.parent_can_access_medical */
  parent_of_owner?: boolean;
  parent_can_access_medical?: boolean;
  now?: Date;
}

function grantIsActive(grant: PrivacyAccessGrant, now: Date): boolean {
  if (grant.revoked_at) return false;
  if (grant.expires_at && grant.expires_at.getTime() < now.getTime()) return false;
  return true;
}

function grantMatches(
  grant: PrivacyAccessGrant,
  ctx: PrivacyAccessContext,
  permission: PrivacyPermission,
): boolean {
  if (grant.grantee_uid !== ctx.actor_uid) return false;
  if (grant.owner_uid !== ctx.owner_uid) return false;
  if (!grant.permissions.includes(permission)) return false;

  if (grant.scope === 'all_medical') {
    return (
      ctx.resource_type === 'medical_document' || ctx.resource_type === 'medical_appointment'
    );
  }
  if (grant.scope === 'all_personal') {
    return ctx.resource_type === 'personal_document';
  }
  // resource scope
  return (
    grant.resource_type === ctx.resource_type &&
    Boolean(grant.resource_id) &&
    grant.resource_id === ctx.resource_id
  );
}

export function hasActiveGrant(
  ctx: PrivacyAccessContext,
  permission: PrivacyPermission,
): boolean {
  const now = ctx.now ?? new Date();
  return ctx.grants.some((g) => grantIsActive(g, now) && grantMatches(g, ctx, permission));
}

export function isTreatingPhysio(ctx: PrivacyAccessContext): boolean {
  if (ctx.actor_role !== 'physio') return false;
  return (ctx.treating_links ?? []).some(
    (l) =>
      l.physio_uid === ctx.actor_uid &&
      l.patient_uid === ctx.owner_uid &&
      !l.treating_revoked,
  );
}

/**
 * Pure RBAC decision for sensitive personal / medical resources.
 * Club, coach, recruiter, agent denied unless explicit grant.
 */
export function canAccessSensitiveResource(
  ctx: PrivacyAccessContext,
  permission: PrivacyPermission = 'read',
): boolean {
  // Owner / patient
  if (ctx.actor_uid === ctx.owner_uid) return true;

  // Admin break-glass — caller must still audit admin_break_glass
  if (ctx.actor_role === 'admin') return true;

  // Explicit grant
  if (hasActiveGrant(ctx, permission)) return true;

  // Medical-only paths below
  const isMedical =
    ctx.resource_type === 'medical_document' || ctx.resource_type === 'medical_appointment';

  if (isMedical) {
    if (isTreatingPhysio(ctx)) return true;
    if (
      ctx.actor_role === 'parent' &&
      ctx.parent_of_owner === true &&
      ctx.parent_can_access_medical === true
    ) {
      return true;
    }
    return false;
  }

  // Personal docs: only owner, admin, or grant
  return false;
}

export function denyReason(
  ctx: PrivacyAccessContext,
  permission: PrivacyPermission = 'read',
): string | null {
  if (canAccessSensitiveResource(ctx, permission)) return null;
  if (ctx.actor_role === 'coach' || ctx.actor_role === 'club' || ctx.actor_role === 'recruiter' || ctx.actor_role === 'agent') {
    return 'Accès médical refusé : autorisation explicite du patient requise.';
  }
  if (ctx.actor_role === 'parent' && !ctx.parent_can_access_medical) {
    return 'Accès médical parental désactivé.';
  }
  if (ctx.actor_role === 'physio' && !isTreatingPhysio(ctx)) {
    return 'Praticien non autorisé pour ce patient.';
  }
  return 'Accès refusé.';
}

/** Roles that must never see medical data without a grant. */
export const MEDICAL_BLOCKED_ROLES: PrivacyActorRole[] = [
  'coach',
  'club',
  'recruiter',
  'agent',
  'other',
];

export function mapUserRoleToPrivacyActor(role: string | undefined): PrivacyActorRole {
  switch (role) {
    case 'player':
      return 'patient';
    case 'physio':
      return 'physio';
    case 'parent':
      return 'parent';
    case 'coach':
      return 'coach';
    case 'club':
      return 'club';
    case 'recruiter':
      return 'recruiter';
    case 'agent':
      return 'agent';
    case 'admin':
      return 'admin';
    default:
      return 'other';
  }
}
