import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const stored = user.product_line;
  if (user.role === 'physio') return 'sante';
  if (user.role === 'supporter') return 'supporter';
  if (user.role === 'sponsor') return 'sponsor';
  if (stored === 'sponsor') return 'sponsor';
  if (stored === 'pro') return canonicalizeUserProductLine('pro', user.role);
  if (
    stored === 'woman' ||
    stored === 'sante' ||
    stored === 'amateur' ||
    stored === 'supporter' ||
    stored === 'pro_player' ||
    stored === 'pro_club' ||
    stored === 'pro_staff'
  ) {
    if (stored === 'woman' && user.role === 'player') return 'pro_player';
    if (stored === 'pro_player' || stored === 'pro_club' || stored === 'pro_staff') {
      return canonicalizeUserProductLine(stored, user.role);
    }
    return stored;
  }
  if (stored === 'homme' || stored === 'standard') {
    if (user.role === 'player') return 'pro_player';
    return 'homme';
  }
  if (user.app_space && isFeminineAppSpace(user.app_space)) {
    if (user.role === 'player') return 'pro_player';
    return 'woman';
  }
  return canonicalizeUserProductLine(stored, user.role);
}

export function getProductLineMismatchMessage(
  userLine: ProductLineId,
  activeLine: ProductLineId,
): string {
  if (productLinesEquivalent(userLine, activeLine, 'player')) {
    return 'Ce compte n’est pas compatible avec cette version de l’application.';
  }
  return `Ce compte a été créé sur ${productLineLabel(canonicalizeUserProductLine(userLine, 'player'))}. Choisissez « ${productLineLabel(canonicalizeActiveProductLine(activeLine, 'player'))} » au lancement pour vous connecter.`;
}

export class ProductLineMismatchError extends Error {
  readonly code = 'auth/product-line-mismatch' as const;

  constructor(
    public readonly userLine: ProductLineId,
    public readonly activeLine: ProductLineId,
  ) {
    super(getProductLineMismatchMessage(userLine, activeLine));
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
    if (isProFamilyLine(activeLine) || activeLine === 'amateur') return 'coach';
    return 'player';
  }
  return user.role;
}

export function profileMatchesActiveLine(user: User, activeLine: ProductLineId): boolean {
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
  if (isPartnerPoleTestAccount(user.email)) {
    if (activeLine !== 'sponsor' && !isProFamilyLine(activeLine)) {
      throw new ProductLineMismatchError('sponsor', activeLine);
    }
    return;
  }
  if (isUniversalPoleTestAccount(user.email)) return;

  if (!profileMatchesActiveLine(user, activeLine)) {
    const userLine = getUserProductLine(user);
    throw new ProductLineMismatchError(userLine, activeLine);
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
