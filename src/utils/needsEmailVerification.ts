import type { UserRole } from '../models/User';
import { isBetaAccountBypassed } from '../config/emailVerificationBypass';

export interface MinimalAuthUser {
  emailVerified: boolean;
  providerData: Array<{ providerId: string }>;
  email?: string | null;
}

export function usesPasswordProvider(fbUser: MinimalAuthUser): boolean {
  return fbUser.providerData.some((p) => p.providerId === 'password');
}

export function needsEmailVerification(
  fbUser: MinimalAuthUser | null,
  profileEmail?: string | null,
  profileEmailVerified?: boolean,
  role?: UserRole | string | null
): boolean {
  if (profileEmailVerified === true) return false;
  if (role === 'coach' || role === 'club') return false;
  if (!fbUser || fbUser.emailVerified) return false;
  if (!usesPasswordProvider(fbUser)) return false;
  const email = profileEmail ?? fbUser.email ?? '';
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith('@proday.club')) return false;
  if (isBetaAccountBypassed(email)) return false;
  return true;
}
