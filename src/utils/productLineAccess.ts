import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPlatformAdminEmail } from '../config/admin';
import { isFeminineAppSpace } from '../models/AppSpace';
import {
  normalizeStoredProductLine,
  PRODUCT_LINE_STORAGE_KEY,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import type { User, UserRole } from '../models/User';
import {
  isRoleAllowedForProductLine,
  productLineLabel,
} from '../content/universeRoles';
import {
  isPartnerPoleTestAccount,
  isUniversalPoleTestAccount,
} from '../config/emailVerificationBypass';
import {
  canonicalizeActiveProductLine,
  canonicalizeUserProductLine,
  isProFamilyLine,
  productLinesEquivalent,
} from './productLineResolution';
import { resolvePlayerSegment } from './playerSegment';

/** Ligne produit active (AsyncStorage — même logique que ProductLineContext). */
export async function getActiveProductLineFromStorage(): Promise<ProductLineId> {
  const pairs = await AsyncStorage.multiGet([
    PRODUCT_LINE_STORAGE_KEY,
    WOMAN_SPACE_ACTIVE_KEY,
  ]);
  const storedLine = pairs.find(([k]) => k === PRODUCT_LINE_STORAGE_KEY)?.[1] ?? null;
  const spaceFlag = pairs.find(([k]) => k === WOMAN_SPACE_ACTIVE_KEY)?.[1] ?? null;
  const line = normalizeStoredProductLine(storedLine) ?? 'amateur';
  if (spaceFlag === '1' && line === 'homme') return 'amateur';
  if (line === 'homme' || line === 'woman') return 'amateur';
  return line;
}

/** Ligne canonique du compte (Firestore + déduction legacy). */
export function getUserProductLine(user: User): ProductLineId {
  if (user.product_line) {
    return canonicalizeUserProductLine(user.product_line, user.role);
  }
  // Legacy sans product_line : espace féminin → Amateur (ou Pro Joueur si joueur).
  if (user.app_space && isFeminineAppSpace(user.app_space)) {
    if (user.role === 'player') return 'pro_player';
    return 'amateur';
  }
  return canonicalizeUserProductLine(undefined, user.role);
}

export function getProductLineMismatchMessage(
  userLine: ProductLineId,
  activeLine: ProductLineId,
  role: UserRole = 'player',
): string {
  // Même ligne « joueur » mais rôle / segment incompatible → message générique.
  if (productLinesEquivalent(userLine, activeLine, role)) {
    return 'Ce compte n’est pas compatible avec cet espace. Choisissez le bon pôle au lancement, ou utilisez l’accès Fondation VIP pour un compte administrateur.';
  }
  return `Ce compte a été créé sur ${productLineLabel(canonicalizeUserProductLine(userLine, role))}. Choisissez « ${productLineLabel(canonicalizeActiveProductLine(activeLine, role))} » au lancement pour vous connecter.`;
}

export class ProductLineMismatchError extends Error {
  readonly code = 'auth/product-line-mismatch' as const;

  constructor(
    public readonly userLine: ProductLineId,
    public readonly activeLine: ProductLineId,
    role: UserRole = 'player',
  ) {
    super(getProductLineMismatchMessage(userLine, activeLine, role));
    this.name = 'ProductLineMismatchError';
  }
}

/** Rôle effectif en session — comptes test multi-pôles. */
export function getEffectiveRoleForProductLine(
  user: User,
  activeLine: ProductLineId,
): UserRole {
  if (isPartnerPoleTestAccount(user.email)) {
    if (activeLine === 'sponsor') return 'sponsor';
    if (activeLine === 'pro_player') return 'player';
    if (activeLine === 'pro_club') return 'club';
    if (activeLine === 'pro_staff' || activeLine === 'pro') return 'coach';
    return user.role;
  }
  if (isUniversalPoleTestAccount(user.email)) {
    if (activeLine === 'sante') return 'physio';
    if (isProFamilyLine(activeLine)) return 'coach';
    if (activeLine === 'amateur') return 'player';
    return 'player';
  }
  return user.role;
}

/**
 * Comptes fondateurs / admin plateforme : pas de gate pôle.
 * L’accès Control Center reste protégé par le claim Firebase `admin`
 * (voir AdminAppShell / useIsAdmin). Aligné avec App.tsx qui ignore déjà
 * le forçage product_line pour ces emails.
 */
export function isProductLineGateExempt(email: string | null | undefined): boolean {
  return isPlatformAdminEmail(email);
}

export function profileMatchesActiveLine(user: User, activeLine: ProductLineId): boolean {
  if (isProductLineGateExempt(user.email)) return true;
  if (isPartnerPoleTestAccount(user.email)) {
    return activeLine === 'sponsor' || isProFamilyLine(activeLine);
  }
  if (isUniversalPoleTestAccount(user.email)) return true;

  const userLine = getUserProductLine(user);
  if (!productLinesEquivalent(userLine, activeLine, user.role)) return false;

  const canonicalActive = canonicalizeActiveProductLine(activeLine, user.role);
  if (!isRoleAllowedForProductLine(user.role, canonicalActive)) return false;

  if (user.role === 'player' && canonicalActive === 'pro_player') {
    const userSegment = resolvePlayerSegment(user, userLine);
    const carouselSegment =
      activeLine === 'woman' ? 'female' : activeLine === 'homme' ? 'male' : null;
    if (userSegment && carouselSegment && userSegment !== carouselSegment) return false;
  }

  return true;
}

export function assertProfileMatchesActiveLine(
  user: User,
  activeLine: ProductLineId,
): void {
  if (isProductLineGateExempt(user.email)) return;
  if (isPartnerPoleTestAccount(user.email)) {
    if (activeLine !== 'sponsor' && !isProFamilyLine(activeLine)) {
      throw new ProductLineMismatchError('sponsor', activeLine, user.role);
    }
    return;
  }
  if (isUniversalPoleTestAccount(user.email)) return;

  if (!profileMatchesActiveLine(user, activeLine)) {
    const userLine = getUserProductLine(user);
    throw new ProductLineMismatchError(userLine, activeLine, user.role);
  }
}
/** Profil adapté à l’univers actif (comptes test multi-pôles). */
export function getSessionProfile(user: User, activeLine: ProductLineId): User {
  if (isPartnerPoleTestAccount(user.email)) {
    const role = getEffectiveRoleForProductLine(user, activeLine);
    return {
      ...user,
      role,
      product_line: canonicalizeActiveProductLine(activeLine, role),
    };
  }
  if (!isUniversalPoleTestAccount(user.email)) return user;
  const role = getEffectiveRoleForProductLine(user, activeLine);
  return {
    ...user,
    role,
    product_line: canonicalizeActiveProductLine(activeLine, role),
  };
}
