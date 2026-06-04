/** Ligne produit — app standard ou univers ProDay Woman (foot féminin). */
export type ProductLineId = 'standard' | 'woman';

export const PRODUCT_LINE_STORAGE_KEY = 'proday_product_line';
export const WOMAN_SPACE_ACTIVE_KEY = 'proday_woman_space_active';

export const PRODAY_WOMAN_BRAND = {
  name: 'Pro Day for Women',
  /** Mot-symbole logo (ligne 1 + ligne 2) */
  logoLine1: 'Pro Day',
  logoLine2Lead: 'For ',
  logoLine2Accent: 'Women',
  tagline: 'JOUER • BRILLER • GRANDIR',
  shortTagline: 'Le foot au féminin, par ProDay',
  entryCta: 'For women',
} as const;

/** @deprecated Utiliser PRODAY_WOMAN_BRAND */
export const PRODAY_GIRL_BRAND = PRODAY_WOMAN_BRAND;

export function isWomanProductLine(line: ProductLineId): boolean {
  return line === 'woman';
}

/** @deprecated */
export function isGirlProductLine(line: ProductLineId): boolean {
  return isWomanProductLine(line);
}

export function normalizeStoredProductLine(stored: string | null): ProductLineId | null {
  if (stored === 'woman' || stored === 'girl') return 'woman';
  if (stored === 'standard') return 'standard';
  return null;
}
