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
  if (line === 'sponsor') {
    return sponsorGradients;
  }
  if (line === 'parent') {
    return parentGradients;
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
  hero: ['#000000', '#020814'] as const,
  heroDark: ['#000000', '#002478'] as const,
  card: ['#0c0c0c', '#000000'] as const,
  cta: ['#002478', '#006CFC'] as const,
  ambient: ['rgba(0, 108, 252, 0.35)', '#020814', '#000000'] as const,
};

const presidentGradients = {
  hero: ['#03050A', '#0A0F1A'] as const,
  heroDark: ['#03050A', '#05070E'] as const,
  card: ['#0E1524', '#05070E'] as const,
  cta: ['#92700C', '#D4B880'] as const,
  ambient: ['rgba(212, 184, 128, 0.22)', '#05070E', '#03050A'] as const,
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
  ambient: ['rgba(212, 175, 55, 0.2)', '#070605', '#030303'] as const,
};

const parentGradients = {
  hero: ['#042f2e', '#0F766E'] as const,
  heroDark: ['#022c22', '#134e4a'] as const,
  card: ['#0f1f1e', '#042f2e'] as const,
  cta: ['#0F766E', '#2DD4BF'] as const,
  ambient: ['rgba(45, 212, 191, 0.18)', '#042f2e', '#000000'] as const,
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
  if (pole === 'president') return presidentGradients;
  if (pole === 'pro_staff') return proStaffGradients;
  if (pole === 'sponsor') return sponsorGradients;
  if (pole === 'parent') return parentGradients;
  if (pole === 'pro_player') {
    return {
      hero: proGradients.hero,
      heroDark: proGradients.heroDark,
      card: proGradients.card,
      cta: proGradients.cta,
      ambient: ['rgba(96, 165, 250, 0.14)', '#0A0A0A', '#000000'] as const,
    };
  }
  const line =
    pole === 'amateur' || pole === 'supporter' || pole === 'sante' ? pole : 'pro';
  return gradientsForLine(line);
}

export { gradients, FLASH_CYAN, FLASH_CYAN_DIM };
