import type { ImageStyle, StyleProp } from 'react-native';

/** Variante de conteneur — fichiers pré-recadrés via scripts/download-*-showcase-images. */
export type ShowcaseImageVariant = 'hero' | 'card' | 'wide' | 'thumb';

const VARIANT_BASE: Record<ShowcaseImageVariant, ImageStyle> = {
  hero: { width: '100%', height: '100%' },
  card: { width: '100%', height: '100%' },
  wide: { width: '100%', height: '100%' },
  thumb: { width: '100%', height: '100%' },
};

/** Cadrage Woman — léger recentrage (sources déjà recadrées foot F). */
const WOMAN_VARIANT_FOCAL: Partial<Record<ShowcaseImageVariant, ImageStyle>> = {
  hero: { transform: [{ scale: 1.04 }, { translateY: -8 }] },
  card: { transform: [{ scale: 1.03 }] },
  wide: { transform: [{ scale: 1.04 }] },
};

export function getShowcaseImageStyle(
  variant: ShowcaseImageVariant = 'card',
  extra?: ImageStyle,
  isWoman = false
): StyleProp<ImageStyle> {
  const base = VARIANT_BASE[variant];
  const focal = isWoman ? WOMAN_VARIANT_FOCAL[variant] : undefined;
  if (focal && extra) return [base, focal, extra];
  if (focal) return [base, focal];
  if (extra) return [base, extra];
  return base;
}
