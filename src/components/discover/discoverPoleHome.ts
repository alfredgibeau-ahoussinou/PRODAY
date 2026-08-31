import type { ProductLineId } from '../../models/ProductLine';

export type DiscoverQuickId = 'mercato' | 'matchs' | 'reels' | 'shop' | 'sponsors';

/** En dessous : home portrait compacte. iPad 768+ garde le chrome wide. */
export const DISCOVER_PORTRAIT_MAX_WIDTH = 768;

export type DiscoverHomeChrome = {
  logoSize: number;
  topExtra: number;
  shellGap: number;
  heroMarginBottom: number;
  brandGap: number;
  wordmarkSize: number;
  poleNameSize: number;
  copyGap: number;
  heroFontSize: number;
  heroLineHeight: number;
  subFontSize: number;
  subLineHeight: number;
  ctaMinHeight: number;
  loginMinHeight: number;
  ctaGap: number;
  signupPadV: number;
  sectionGap: number;
  sectionMarginBottom: number;
  scrollBottom: number;
  quickTilePadV: number;
};

/** Portrait téléphone — 1re viewport serrée (après 4ad32ae0 trop haute). */
export const DISCOVER_HOME_PORTRAIT: DiscoverHomeChrome = {
  logoSize: 64,
  topExtra: 4,
  shellGap: 8,
  heroMarginBottom: 10,
  brandGap: 2,
  wordmarkSize: 15,
  poleNameSize: 11,
  copyGap: 4,
  heroFontSize: 21,
  heroLineHeight: 25,
  subFontSize: 13,
  subLineHeight: 17,
  ctaMinHeight: 44,
  loginMinHeight: 32,
  ctaGap: 4,
  signupPadV: 10,
  sectionGap: 6,
  sectionMarginBottom: 14,
  scrollBottom: 16,
  quickTilePadV: 8,
};

/** Wide / paysage / tablette — proche du chrome post-refonte, logo un cran plus petit. */
export const DISCOVER_HOME_WIDE: DiscoverHomeChrome = {
  logoSize: 80,
  topExtra: 8,
  shellGap: 14,
  heroMarginBottom: 20,
  brandGap: 2,
  wordmarkSize: 18,
  poleNameSize: 13,
  copyGap: 8,
  heroFontSize: 24,
  heroLineHeight: 30,
  subFontSize: 14,
  subLineHeight: 20,
  ctaMinHeight: 50,
  loginMinHeight: 40,
  ctaGap: 8,
  signupPadV: 12,
  sectionGap: 12,
  sectionMarginBottom: 24,
  scrollBottom: 32,
  quickTilePadV: 12,
};

export function isDiscoverPortraitHome(width: number, height: number): boolean {
  return height >= width && width < DISCOVER_PORTRAIT_MAX_WIDTH;
}

export function discoverHomeChrome(width: number, height: number): DiscoverHomeChrome {
  return isDiscoverPortraitHome(width, height) ? DISCOVER_HOME_PORTRAIT : DISCOVER_HOME_WIDE;
}

/** Accès rapide — 3 tuiles max, filtrées par pôle (pas de landing 4+). */
export function discoverQuickIdsForLine(line: ProductLineId): DiscoverQuickId[] {
  switch (line) {
    case 'supporter':
      return ['matchs', 'reels'];
    case 'parent':
      return ['matchs'];
    case 'sante':
      return ['matchs'];
    case 'sponsor':
      return [];
    case 'pro_club':
      return ['mercato', 'matchs'];
    case 'pro_staff':
    case 'pro':
      return ['matchs', 'mercato'];
    default:
      return ['mercato', 'matchs', 'reels'];
  }
}

/** Aperçu Mercato / fil — uniquement si le pôle s’en sert. */
export function discoverShowsMercatoPreview(line: ProductLineId): boolean {
  return (
    line === 'amateur' ||
    line === 'homme' ||
    line === 'woman' ||
    line === 'pro_player' ||
    line === 'pro_club' ||
    line === 'pro_staff' ||
    line === 'pro'
  );
}
