import type { UserRole } from '../models/User';
import type { ProductLineId } from '../models/ProductLine';

export type ProSplitProductLine = 'pro_player' | 'pro_club' | 'pro_staff';

const PRO_DEDUCED_ROLES: UserRole[] = [
  'player',
  'coach',
  'agent',
  'recruiter',
  'club',
  'organizer',
];

export function isProDeducedRole(role: UserRole): boolean {
  return PRO_DEDUCED_ROLES.includes(role);
}

export function isProFamilyLine(line: ProductLineId): line is ProductLineId {
  return (
    line === 'pro' ||
    line === 'pro_player' ||
    line === 'pro_club' ||
    line === 'pro_staff'
  );
}

export function isProSplitLine(line: ProductLineId): line is ProSplitProductLine {
  return line === 'pro_player' || line === 'pro_club' || line === 'pro_staff';
}

/** Répartit l’ancien `product_line: pro` selon le rôle métier. */
export function splitLegacyProByRole(role: UserRole): ProSplitProductLine {
  if (role === 'club') return 'pro_club';
  if (role === 'player') return 'pro_player';
  return 'pro_staff';
}

/**
 * Ligne produit canonique d'un compte utilisateur (Firestore + legacy).
 */
export function canonicalizeUserProductLine(
  line: ProductLineId | undefined | null,
  role: UserRole,
): ProductLineId {
  if (role === 'physio') return 'sante';
  if (role === 'supporter') return 'supporter';
  if (role === 'sponsor') return 'sponsor';
  if (role === 'parent') return 'parent';
  if (line === 'sponsor') return 'sponsor';
  if (line === 'parent') return 'parent';

  // Split pro stale : réeligner si le rôle ne correspond plus à la ligne stockée
  if (line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    if (role === 'player' && line !== 'pro_player') return 'pro_player';
    if (role === 'club' && line !== 'pro_club') return 'pro_club';
    if (
      ['coach', 'agent', 'recruiter', 'organizer'].includes(role) &&
      line !== 'pro_staff'
    ) {
      return 'pro_staff';
    }
    return line;
  }
  if (line === 'pro') {
    return splitLegacyProByRole(role);
  }
  if (!line && role !== 'player' && isProDeducedRole(role)) {
    return splitLegacyProByRole(role);
  }
  // Comptes coach encore stockés en `amateur` → Pôle Staff (hors Joueur).
  if (line === 'amateur' && role === 'coach') return 'pro_staff';
  if (line === 'amateur' || line === 'sante') {
    return line;
  }
  // Legacy homme/woman → pôles canoniques (persister via migration).
  if (line === 'homme' || line === 'woman') {
    if (role === 'player') return 'pro_player';
    if (role === 'club') return 'pro_club';
    if (['coach', 'agent', 'recruiter', 'organizer'].includes(role)) {
      return 'pro_staff';
    }
    return 'amateur';
  }
  if (!line && role === 'player') return 'pro_player';
  return line ?? 'amateur';
}

/**
 * Ligne active choisie au carousel (sans écraser le pôle par le rôle session).
 */
export function canonicalizeActiveProductLine(
  line: ProductLineId,
  role?: UserRole | null,
): ProductLineId {
  if (line === 'sponsor') return 'sponsor';
  if (line === 'pro') return splitLegacyProByRole(role ?? 'coach');
  if (line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') return line;
  if ((line === 'homme' || line === 'woman') && role === 'player') return 'pro_player';
  return line;
}

/** @deprecated Préférer canonicalizeUserProductLine / canonicalizeActiveProductLine */
export function canonicalizeProductLine(
  line: ProductLineId | undefined | null,
  role: UserRole,
): ProductLineId {
  return canonicalizeUserProductLine(line, role);
}

export function productLinesEquivalent(
  userLine: ProductLineId | undefined,
  activeLine: ProductLineId,
  role: UserRole,
): boolean {
  const userCanonical = canonicalizeUserProductLine(userLine, role);
  const activeCanonical = canonicalizeActiveProductLine(activeLine, role);
  if (userCanonical === activeCanonical) return true;

  // Pôle Joueur unifié : Amateur ↔ Pro Joueur (même espace joueur).
  if (
    role === 'player' &&
    isPlayerJoueurLine(userCanonical) &&
    isPlayerJoueurLine(activeCanonical)
  ) {
    return true;
  }

  return false;
}

/** Lignes du Pôle Joueur (amateur + pro joueur). */
function isPlayerJoueurLine(line: ProductLineId): boolean {
  return line === 'amateur' || line === 'pro_player';
}

/** Valeur à persister en Firestore pour un nouvel inscrit ou une migration. */
export function resolvePersistedProductLine(
  line: ProductLineId,
  role: UserRole,
): ProductLineId {
  if (role === 'coach' && line === 'amateur') return 'pro_staff';
  if (isProSplitLine(line)) return line;
  if (line === 'pro' || line === 'homme' || line === 'woman') {
    return canonicalizeUserProductLine(line, role);
  }
  return line;
}

/** Indique si le document Firestore doit être migré hors des lignes legacy. */
export function needsProductLineMigration(
  stored: ProductLineId | undefined,
): stored is 'pro' | 'homme' | 'woman' {
  return stored === 'pro' || stored === 'homme' || stored === 'woman';
}
