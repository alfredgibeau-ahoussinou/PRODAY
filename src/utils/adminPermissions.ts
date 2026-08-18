import { isPlatformAdminEmail } from '../config/admin';
import type { AdminSectionId } from '../navigation/adminNavConfig';

/** Rôles admin plateforme (Firestore `users/{uid}.admin_role` ou claim). */
export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'moderateur'
  | 'admin_finance'
  | 'admin_clubs';

export type AdminPermissionAction =
  | 'view'
  | 'edit'
  | 'moderate'
  | 'finance'
  | 'config'
  | 'security'
  | 'audit';

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super administrateur',
  admin: 'Administrateur',
  moderateur: 'Modérateur',
  admin_finance: 'Finance',
  admin_clubs: 'Clubs',
};

const ALL_SECTIONS: AdminSectionId[] = [
  'accueil',
  'utilisateurs',
  'clubs',
  'coachs',
  'joueurs',
  'parents',
  'equipes',
  'matchs_events',
  'recrutement',
  'video',
  'abonnements',
  'marketplace',
  'sponsors',
  'contenus',
  'messagerie',
  'signalements',
  'statistiques',
  'parametres',
  'audit',
  'securite',
  'config_plateforme',
];

/** Sections visibles par rôle — super_admin = tout. */
const ROLE_SECTIONS: Record<Exclude<AdminRole, 'super_admin'>, AdminSectionId[]> = {
  admin: ALL_SECTIONS,
  moderateur: [
    'accueil',
    'utilisateurs',
    'contenus',
    'messagerie',
    'signalements',
    'statistiques',
    'parametres',
    'audit',
  ],
  admin_finance: [
    'accueil',
    'abonnements',
    'marketplace',
    'sponsors',
    'statistiques',
    'parametres',
    'audit',
  ],
  admin_clubs: [
    'accueil',
    'clubs',
    'coachs',
    'joueurs',
    'parents',
    'equipes',
    'matchs_events',
    'recrutement',
    'statistiques',
    'parametres',
  ],
};

const ROLE_ACTIONS: Record<AdminRole, AdminPermissionAction[]> = {
  super_admin: ['view', 'edit', 'moderate', 'finance', 'config', 'security', 'audit'],
  admin: ['view', 'edit', 'moderate', 'finance', 'config', 'security', 'audit'],
  moderateur: ['view', 'moderate', 'audit'],
  admin_finance: ['view', 'finance', 'audit'],
  admin_clubs: ['view', 'edit'],
};

const SECTION_REQUIRED_ACTION: Partial<Record<AdminSectionId, AdminPermissionAction>> = {
  abonnements: 'finance',
  marketplace: 'finance',
  sponsors: 'finance',
  contenus: 'moderate',
  messagerie: 'moderate',
  signalements: 'moderate',
  config_plateforme: 'config',
  securite: 'security',
  audit: 'audit',
};

export function normalizeAdminRole(raw?: string | null): AdminRole | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/-/g, '_') as AdminRole;
  return key in ADMIN_ROLE_LABELS ? key : null;
}

/** Résout le rôle effectif : emails fondateurs → super_admin. */
export function resolveAdminRole(
  email?: string | null,
  profileAdminRole?: string | null,
): AdminRole {
  if (isPlatformAdminEmail(email)) return 'super_admin';
  const fromProfile = normalizeAdminRole(profileAdminRole);
  if (fromProfile) return fromProfile;
  return 'admin';
}

export function canAccessSection(role: AdminRole, section: AdminSectionId): boolean {
  if (role === 'super_admin') return true;
  const allowed = ROLE_SECTIONS[role];
  if (!allowed.includes(section)) return false;
  const required = SECTION_REQUIRED_ACTION[section];
  if (!required) return true;
  return ROLE_ACTIONS[role].includes(required);
}

export function canPerformAction(role: AdminRole, action: AdminPermissionAction): boolean {
  return ROLE_ACTIONS[role].includes(action);
}

export function filterSectionsForRole(
  role: AdminRole,
  sections: AdminSectionId[],
): AdminSectionId[] {
  return sections.filter((s) => canAccessSection(role, s));
}
