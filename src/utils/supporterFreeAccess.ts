import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';

/** Pôle tribune — 100 % gratuit, sans abonnement store ni paywall. */
export function isSupporterRole(role?: UserRole | null): boolean {
  return role === 'supporter';
}

export function isSupporterProductLine(line?: ProductLineId | null): boolean {
  return line === 'supporter';
}

export function isSupporterFreeAccess(
  role?: UserRole | null,
  line?: ProductLineId | null
): boolean {
  return isSupporterRole(role) || isSupporterProductLine(line);
}

/** Accès illimité aux features tribune (suivis, fil, shop, alertes). */
export function hasUnlimitedSupporterFeatures(
  role?: UserRole | null,
  line?: ProductLineId | null
): boolean {
  return isSupporterFreeAccess(role, line);
}
