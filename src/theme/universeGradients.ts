import type { ProductLineId } from '../models/ProductLine';
import { gradients } from './designTokens';
import { proGradients, santeGradients, womanGradients } from './universeTheme';

export type GradientStops = readonly [string, string, ...string[]];

export const hommeGradients = {
  hero: ['#0A0A0A', '#14532D'] as const,
  heroDark: ['#052e16', '#0A0A0A'] as const,
  card: ['#F0FDF4', '#FFFFFF'] as const,
  cta: ['#0A0A0A', '#15803D'] as const,
  ambient: ['#ECFDF5', '#F7F7F7', '#F7F7F7'] as const,
};

export function gradientsForLine(line: ProductLineId): {
  hero: GradientStops;
  heroDark: GradientStops;
  card: GradientStops;
  cta: GradientStops;
  ambient: GradientStops;
} {
  if (line === 'woman') {
    return {
      hero: womanGradients.hero,
      heroDark: womanGradients.heroDark,
      card: womanGradients.card,
      cta: womanGradients.cta,
      ambient: ['#FCE7F3', '#FFF5F8', '#FFF5F8'] as const,
    };
  }
  if (line === 'pro') {
    return {
      hero: proGradients.hero,
      heroDark: proGradients.heroDark,
      card: proGradients.card,
      cta: proGradients.cta,
      ambient: ['#DBEAFE', '#F8FAFC', '#F8FAFC'] as const,
    };
  }
  if (line === 'sante') {
    return {
      hero: santeGradients.hero,
      heroDark: santeGradients.heroDark,
      card: santeGradients.card,
      cta: santeGradients.cta,
      ambient: ['#CCFBF1', '#F0FDFA', '#F0FDFA'] as const,
    };
  }
  return {
    hero: hommeGradients.hero,
    heroDark: hommeGradients.heroDark,
    card: hommeGradients.card,
    cta: hommeGradients.cta,
    ambient: hommeGradients.ambient,
  };
}

export function ctaGradient(line: ProductLineId): GradientStops {
  return gradientsForLine(line).cta;
}

export { gradients };
