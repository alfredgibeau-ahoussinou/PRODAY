import type { CarouselPoleId } from '../../../models/CarouselPole';
import {
  carouselPoleToProductLine,
  normalizeCarouselPole,
} from '../../../models/CarouselPole';
import type { UserRole } from '../../../models/User';
import { canAccessProductLine } from '../../../content/universeRoles';
import {
  isPartnerPoleTestAccount,
  isUniversalPoleTestAccount,
} from '../../../config/emailVerificationBypass';
import { UNIVERSE_CHOICE_ORDER } from './universeChoiceShared';

export type UniverseAccessOpts = {
  role?: UserRole | null;
  email?: string | null;
  /** Flag AuthContext — console admin (pas un UserRole). */
  isAdmin?: boolean;
};

/**
 * Univers proposés au sélecteur selon le profil.
 * Pré-auth / admin / comptes test multi-pôles → vitrine complète.
 * Sinon → uniquement les pôles ACL-compatibles (Président = même line Club).
 */
export function filterAccessibleUniversePoles(
  roleOrOpts?: UserRole | null | UniverseAccessOpts,
  email?: string | null,
): CarouselPoleId[] {
  const opts: UniverseAccessOpts =
    roleOrOpts != null && typeof roleOrOpts === 'object' && !Array.isArray(roleOrOpts)
      ? roleOrOpts
      : { role: (roleOrOpts as UserRole | null | undefined) ?? null, email };

  const role = opts.role ?? null;
  const mail = opts.email ?? email ?? null;
  const showcase = UNIVERSE_CHOICE_ORDER.map(normalizeCarouselPole);

  if (opts.isAdmin) {
    return [...showcase, 'admin'];
  }

  if (
    !role ||
    isUniversalPoleTestAccount(mail) ||
    isPartnerPoleTestAccount(mail)
  ) {
    return showcase;
  }

  return showcase.filter((pole) => {
    const line = carouselPoleToProductLine(pole);
    if (canAccessProductLine(role, line)) return true;
    // Parent peut ouvrir le guest Supporter (shell dédié).
    if (role === 'parent' && pole === 'supporter') return true;
    return false;
  });
}
