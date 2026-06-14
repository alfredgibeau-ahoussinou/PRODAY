import type { ProductLineId } from '../../../models/ProductLine';

export const UNIVERSE_ACCENT: Record<ProductLineId, string> = {
  homme: '#15803D',
  woman: '#BE185D',
  pro: '#1D4ED8',
  sante: '#0F766E',
};

export const UNIVERSE_ACCENT_SOFT: Record<ProductLineId, string> = {
  homme: '#DCFCE7',
  woman: '#FCE7F3',
  pro: '#DBEAFE',
  sante: '#CCFBF1',
};

export const UNIVERSE_SHORT: Record<ProductLineId, string> = {
  homme: 'Men',
  woman: 'Women',
  pro: 'Pro',
  sante: 'Santé',
};
