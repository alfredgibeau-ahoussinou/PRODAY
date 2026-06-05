import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFeminineAppSpace } from '../models/AppSpace';
import {
  normalizeStoredProductLine,
  PRODUCT_LINE_STORAGE_KEY,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import type { User, UserRole } from '../models/User';
import { isRoleAllowedForProductLine, productLineLabel } from '../content/universeRoles';
import {
  isPartnerPoleTestAccount,
  isUniversalPoleTestAccount,
} from '../config/emailVerificationBypass';

/** Ligne produit active (AsyncStorage — même logique que ProductLineContext). */
export async function getActiveProductLineFromStorage(): Promise<ProductLineId> {
  const pairs = await AsyncStorage.multiGet([
    PRODUCT_LINE_STORAGE_KEY,
    WOMAN_SPACE_ACTIVE_KEY,
  ]);
  const storedLine = pairs.find(([k]) => k === PRODUCT_LINE_STORAGE_KEY)?.[1] ?? null;
  const spaceFlag = pairs.find(([k]) => k === WOMAN_SPACE_ACTIVE_KEY)?.[1] ?? null;
  const line = normalizeStoredProductLine(storedLine) ?? 'homme';
  if (spaceFlag === '1' && line === 'homme') return 'woman';
  return line;
}

/** Ligne d'inscription du compte (champ Firestore ou déduction legacy). */
export function getUserProductLine(user: User): ProductLineId {
  const stored = user.product_line;
  if (stored === 'woman' || stored === 'pro') return stored;
  if (stored === 'homme' || stored === 'standard') return 'homme';
  if (user.app_space && isFeminineAppSpace(user.app_space)) return 'woman';
  if (
    user.role === 'coach' ||
    user.role === 'agent' ||
    user.role === 'recruiter' ||
    user.role === 'physio' ||
    user.role === 'sponsor' ||
    user.role === 'club' ||
    user.role === 'organizer'
  ) {
    return 'pro';
  }
  return 'homme';
}

export function getProductLineMismatchMessage(
  userLine: ProductLineId,
  activeLine: ProductLineId
): string {
  if (userLine === activeLine) {
    return 'Ce compte n’est pas compatible avec cette version de l’application.';
  }
  return `Ce compte a été créé sur ${productLineLabel(userLine)}. Choisissez « ${productLineLabel(activeLine)} » au lancement pour vous connecter.`;
}

export class ProductLineMismatchError extends Error {
  readonly code = 'auth/product-line-mismatch' as const;

  constructor(
    public readonly userLine: ProductLineId,
    public readonly activeLine: ProductLineId
  ) {
    super(getProductLineMismatchMessage(userLine, activeLine));
    this.name = 'ProductLineMismatchError';
  }
}

/** Rôle effectif en session — comptes test multi-pôles. */
export function getEffectiveRoleForProductLine(
  user: User,
  activeLine: ProductLineId
): UserRole {
  if (isPartnerPoleTestAccount(user.email)) {
    if (activeLine === 'pro') return 'sponsor';
    return user.role;
  }
  if (isUniversalPoleTestAccount(user.email)) {
    if (activeLine === 'pro') return 'physio';
    return 'player';
  }
  return user.role;
}

export function profileMatchesActiveLine(user: User, activeLine: ProductLineId): boolean {
  if (isPartnerPoleTestAccount(user.email)) return activeLine === 'pro';
  if (isUniversalPoleTestAccount(user.email)) return true;
  const userLine = getUserProductLine(user);
  if (userLine !== activeLine) return false;
  return isRoleAllowedForProductLine(user.role, activeLine);
}

export function assertProfileMatchesActiveLine(
  user: User,
  activeLine: ProductLineId
): void {
  if (isPartnerPoleTestAccount(user.email)) {
    if (activeLine !== 'pro') {
      throw new ProductLineMismatchError('pro', activeLine);
    }
    return;
  }
  if (isUniversalPoleTestAccount(user.email)) return;
  const userLine = getUserProductLine(user);
  if (userLine !== activeLine || !isRoleAllowedForProductLine(user.role, activeLine)) {
    throw new ProductLineMismatchError(userLine, activeLine);
  }
}

/** Profil adapté à l’univers actif (comptes test multi-pôles). */
export function getSessionProfile(user: User, activeLine: ProductLineId): User {
  if (isPartnerPoleTestAccount(user.email)) {
    return {
      ...user,
      role: activeLine === 'pro' ? 'sponsor' : user.role,
      product_line: activeLine,
    };
  }
  if (!isUniversalPoleTestAccount(user.email)) return user;
  const role = getEffectiveRoleForProductLine(user, activeLine);
  return {
    ...user,
    role,
    product_line: activeLine,
  };
}
