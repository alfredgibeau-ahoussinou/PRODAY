/**
 * Miroir de src/utils/productLineResolution.ts pour scripts Node (migration Firestore).
 * Garder aligné avec la version TypeScript.
 */

const PRO_DEDUCED_ROLES = [
  'player',
  'coach',
  'agent',
  'recruiter',
  'club',
  'organizer',
  'sponsor',
];

export function isProDeducedRole(role) {
  return PRO_DEDUCED_ROLES.includes(role);
}

export function splitLegacyProByRole(role) {
  if (role === 'club') return 'pro_club';
  if (role === 'player') return 'pro_player';
  return 'pro_staff';
}

export function canonicalizeUserProductLine(line, role) {
  if (role === 'physio') return 'sante';
  if (role === 'supporter') return 'supporter';
  if (line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return line;
  }
  if (line === 'pro') {
    return splitLegacyProByRole(role);
  }
  if (!line && role !== 'player' && isProDeducedRole(role)) {
    return splitLegacyProByRole(role);
  }
  if (line === 'amateur' || line === 'sante') {
    return line;
  }
  if ((line === 'homme' || line === 'woman') && role === 'player') {
    return 'pro_player';
  }
  if (line === 'homme' || line === 'woman') return line;
  if (!line && role === 'player') return 'pro_player';
  return line ?? 'homme';
}

/** Champ product_line absent ou vide (backfill Firestore). */
export function isMissingProductLine(stored) {
  return stored == null || stored === '';
}
