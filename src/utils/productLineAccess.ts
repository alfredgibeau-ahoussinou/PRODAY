import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFeminineAppSpace } from '../models/AppSpace';
import {
  normalizeStoredProductLine,
  PRODUCT_LINE_STORAGE_KEY,
  WOMAN_SPACE_ACTIVE_KEY,
  type ProductLineId,
} from '../models/ProductLine';
import type { User } from '../models/User';

/** Ligne produit active (AsyncStorage — même logique que ProductLineContext). */
export async function getActiveProductLineFromStorage(): Promise<ProductLineId> {
  const pairs = await AsyncStorage.multiGet([
    PRODUCT_LINE_STORAGE_KEY,
    WOMAN_SPACE_ACTIVE_KEY,
  ]);
  const storedLine = pairs.find(([k]) => k === PRODUCT_LINE_STORAGE_KEY)?.[1] ?? null;
  const spaceFlag = pairs.find(([k]) => k === WOMAN_SPACE_ACTIVE_KEY)?.[1] ?? null;
  const line = normalizeStoredProductLine(storedLine) ?? 'standard';
  const inWoman = spaceFlag === '1' && line === 'woman';
  return inWoman ? 'woman' : 'standard';
}

/** Ligne d'inscription du compte (champ Firestore ou déduction legacy). */
export function getUserProductLine(user: User): ProductLineId {
  if (user.product_line === 'woman' || user.product_line === 'standard') {
    return user.product_line;
  }
  if (user.app_space && isFeminineAppSpace(user.app_space)) {
    return 'woman';
  }
  return 'standard';
}

export function getProductLineMismatchMessage(
  userLine: ProductLineId,
  activeLine: ProductLineId
): string {
  if (userLine === 'woman' && activeLine === 'standard') {
    return 'Ce compte a été créé sur ProDay Woman. Choisissez l’espace « For Women » au lancement pour vous connecter.';
  }
  if (userLine === 'standard' && activeLine === 'woman') {
    return 'Ce compte ProDay classique ne peut pas être utilisé sur l’espace Woman. Revenez à l’application ProDay standard.';
  }
  return 'Ce compte n’est pas compatible avec cette version de l’application.';
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

export function profileMatchesActiveLine(user: User, activeLine: ProductLineId): boolean {
  return getUserProductLine(user) === activeLine;
}

export function assertProfileMatchesActiveLine(
  user: User,
  activeLine: ProductLineId
): void {
  const userLine = getUserProductLine(user);
  if (userLine !== activeLine) {
    throw new ProductLineMismatchError(userLine, activeLine);
  }
}
