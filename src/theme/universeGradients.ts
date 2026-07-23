import type { ProductLineId } from '../models/ProductLine';
import type { CarouselPoleId } from '../models/CarouselPole';
import { gradients, FLASH_CYAN, FLASH_CYAN_DIM } from './designTokens';
import { proGradients, santeGradients, womanGradients, amateurGradients, supporterGradients } from './universeTheme';

export type GradientStops = readonly [string, string, ...string[]];

export const hommeGradients = {
  hero: ['#000000', '#14532D'] as const,
  heroDark: ['#000000', '#052e16'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#15803D', '#4ADE80'] as const,
  ambient: ['rgba(74, 222, 128, 0.12)', '#0A0A0A', '#000000'] as const,
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
      ambient: ['rgba(244, 114, 182, 0.14)', '#0A0A0A', '#000000'] as const,
    };
  }
  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return {
      hero: proGradients.hero,
      heroDark: proGradients.heroDark,
      card: proGradients.card,
      cta: proGradients.cta,
      ambient: ['rgba(96, 165, 250, 0.14)', '#0A0A0A', '#000000'] as const,
    };
  }
  if (line === 'amateur') {
    return {
      hero: amateurGradients.hero,
      heroDark: amateurGradients.heroDark,
      card: amateurGradients.card,
      cta: amateurGradients.cta,
      ambient: ['rgba(249, 115, 22, 0.14)', '#0A0A0A', '#000000'] as const,
    };
  }
  if (line === 'supporter') {
    return {
      hero: supporterGradients.hero,
      heroDark: supporterGradients.heroDark,
      card: supporterGradients.card,
      cta: supporterGradients.cta,
      ambient: ['rgba(167, 139, 250, 0.14)', '#0A0A0A', '#000000'] as const,
    };
  }
  if (line === 'sante') {
    return {
      hero: santeGradients.hero,
      heroDark: santeGradients.heroDark,
      card: santeGradients.card,
      cta: santeGradients.cta,
      ambient: ['rgba(45, 212, 191, 0.14)', '#0A0A0A', '#000000'] as const,
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

const proClubGradients = {
  hero: ['#000000', '#0C4A6E'] as const,
  heroDark: ['#000000', '#082f49'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#0369A1', '#38BDF8'] as const,
  ambient: ['rgba(56, 189, 248, 0.14)', '#0A0A0A', '#000000'] as const,
};

const proStaffGradients = {
  hero: ['#000000', '#312E81'] as const,
  heroDark: ['#000000', '#1e1b4b'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#4338CA', '#818CF8'] as const,
  ambient: ['rgba(129, 140, 248, 0.14)', '#0A0A0A', '#000000'] as const,
};

const sponsorGradients = {
  hero: ['#070605', '#1a1508'] as const,
  heroDark: ['#030303', '#070605'] as const,
  card: ['#14110a', '#0c0a06'] as const,
  cta: ['#92700C', '#D4AF37'] as const,
  ambient: ['#1a1508', '#070605', '#070605'] as const,
};

/** Ambient FLASH générique (cyan) */
export const flashAmbient = [
  `rgba(34, 211, 238, 0.14)`,
  '#0A0A0A',
  '#000000',
] as const;

export function gradientsForCarouselPole(pole: CarouselPoleId): {
  hero: GradientStops;
  heroDark: GradientStops;
  card: GradientStops;
  cta: GradientStops;
  ambient: GradientStops;
} {
  if (pole === 'pro_club') return proClubGradients;
  if (pole === 'pro_staff') return proStaffGradients;
  if (pole === 'sponsor') return sponsorGradients;
  if (pole === 'pro_player') {
    return {
      hero: proGradients.hero,
      heroDark: proGradients.heroDark,
      card: proGradients.card,
      cta: proGradients.cta,
      ambient: ['rgba(96, 165, 250, 0.14)', '#0A0A0A', '#000000'] as const,
    };
  }
  const line = pole === 'amateur' || pole === 'supporter' || pole === 'sante' ? pole : 'pro';
  return gradientsForLine(line);
}

export { gradients, FLASH_CYAN, FLASH_CYAN_DIM };
