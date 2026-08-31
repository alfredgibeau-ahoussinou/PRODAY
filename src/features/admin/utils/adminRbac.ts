/**
 * RBAC UI soft — le claim Firebase `admin` reste le garde-fou serveur.
 * Cette matrice ne fait que masquer/limiter des actions dans l’UI.
 * Ne remplace PAS les rules Firestore / Functions.
 */

export type AdminUiRole = 'super' | 'finance' | 'support' | 'ops';

export type AdminCapability =
  | 'view'
  | 'edit_users'
  | 'edit_clubs'
  | 'billing'
  | 'pricing'
  | 'feature_flags'
  | 'maintenance'
  | 'export'
  | 'bulk'
  | 'impersonate'
  | 'delete_sensitive';

/** Rôles UI par e-mail (étendre sans toucher au claim). */
export const ADMIN_UI_ROLE_BY_EMAIL: Record<string, AdminUiRole> = {
  'proday.admin@gmail.com': 'super',
  'semedoyohan1@gmail.com': 'super',
};

const CAPS: Record<AdminUiRole, ReadonlySet<AdminCapability>> = {
  super: new Set([
    'view',
    'edit_users',
    'edit_clubs',
    'billing',
    'pricing',
    'feature_flags',
    'maintenance',
    'export',
    'bulk',
    'impersonate',
    'delete_sensitive',
  ]),
  finance: new Set(['view', 'billing', 'pricing', 'export', 'edit_clubs']),
  support: new Set(['view', 'edit_users', 'edit_clubs', 'export', 'bulk']),
  ops: new Set(['view', 'feature_flags', 'maintenance', 'export', 'impersonate']),
};

export function resolveAdminUiRole(email: string | null | undefined): AdminUiRole {
  if (!email) return 'ops';
  return ADMIN_UI_ROLE_BY_EMAIL[email.trim().toLowerCase()] ?? 'ops';
}

export function canAdminUi(
  email: string | null | undefined,
  capability: AdminCapability,
): boolean {
  const role = resolveAdminUiRole(email);
  return CAPS[role].has(capability);
}
