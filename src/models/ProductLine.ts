/** Ligne produit — Homme (amateur M), Woman (foot F), Pro (coach, agent, santé). */
export type ProductLineId = 'homme' | 'woman' | 'pro';

/** @deprecated Alias stockage — migré vers homme */
export type LegacyProductLineId = 'standard';

export const PRODUCT_LINE_STORAGE_KEY = 'proday_product_line';
export const WOMAN_SPACE_ACTIVE_KEY = 'proday_woman_space_active';

export const PRODAY_HOMME_BRAND = {
  name: 'Pro Day Man',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Man',
  tagline: 'CONNECTER • PROGRESSER • RÉUSSIR',
  shortTagline: 'Le foot masculin amateur, par Pro Day',
  entryCta: 'For men',
} as const;

/** Alias lisible — même ligne produit que homme */
export const PRODAY_MAN_BRAND = PRODAY_HOMME_BRAND;

export const PRODAY_WOMAN_BRAND = {
  name: 'Pro Day for Women',
  logoLine1: 'Pro Day',
  logoLine2Lead: 'For ',
  logoLine2Accent: 'Women',
  tagline: 'JOUER • BRILLER • GRANDIR',
  shortTagline: 'Le foot au féminin, par ProDay',
  entryCta: 'For women',
} as const;

export const PRODAY_PRO_BRAND = {
  name: 'Pro Day Pro',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Pro',
  tagline: 'EXPERTISE • RÉSEAU • PERFORMANCE',
  shortTagline: 'Coach, agent et pôle santé — l’écosystème pro du foot',
  entryCta: 'Espace Pro',
} as const;

/** @deprecated Utiliser PRODAY_WOMAN_BRAND */
export const PRODAY_GIRL_BRAND = PRODAY_WOMAN_BRAND;

export function isWomanProductLine(line: ProductLineId): boolean {
  return line === 'woman';
}

export function isHommeProductLine(line: ProductLineId): boolean {
  return line === 'homme';
}

export function isProProductLine(line: ProductLineId): boolean {
  return line === 'pro';
}

/** @deprecated */
export function isGirlProductLine(line: ProductLineId): boolean {
  return isWomanProductLine(line);
}

export function normalizeStoredProductLine(stored: string | null): ProductLineId | null {
  if (stored === 'woman' || stored === 'girl') return 'woman';
  if (stored === 'pro') return 'pro';
  if (stored === 'homme' || stored === 'standard') return 'homme';
  return null;
}

export function brandForProductLine(line: ProductLineId) {
  if (line === 'woman') return PRODAY_WOMAN_BRAND;
  if (line === 'pro') return PRODAY_PRO_BRAND;
  return PRODAY_HOMME_BRAND;
}
