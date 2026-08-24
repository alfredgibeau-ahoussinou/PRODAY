import type { ProductLineId } from '../../models/ProductLine';

export type DiscoverQuickId = 'mercato' | 'matchs' | 'reels' | 'shop' | 'sponsors';

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
