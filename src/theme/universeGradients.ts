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

/** Continuité couleurs planche brand → shells. */
const proClubGradients = {
  hero: ['#000000', '#1A0B2E'] as const,
  heroDark: ['#000000', '#2E1065'] as const,
  card: ['#0c0c0c', '#000000'] as const,
  cta: ['#5B21B6', '#7C3AED'] as const,
  ambient: ['rgba(124, 58, 237, 0.28)', '#1A0B2E', '#000000'] as const,
};

const presidentGradients = {
  hero: ['#03050A', '#1A1408'] as const,
  heroDark: ['#03050A', '#05070E'] as const,
  card: ['#0E1524', '#05070E'] as const,
  cta: ['#D97706', '#FBBF24'] as const,
  ambient: ['rgba(251, 191, 36, 0.22)', '#05070E', '#03050A'] as const,
};

const proStaffGradients = {
  hero: ['#000000', '#052e16'] as const,
  heroDark: ['#000000', '#022c22'] as const,
  card: ['#1A1A1A', '#0A0A0A'] as const,
  cta: ['#15803D', '#22C55E'] as const,
  ambient: ['rgba(34, 197, 94, 0.18)', '#0A0A0A', '#000000'] as const,
};

const sponsorGradients = {
  hero: ['#070605', '#1a0808'] as const,
  heroDark: ['#030303', '#070605'] as const,
  card: ['#14110a', '#0c0a06'] as const,
  cta: ['#B91C1C', '#EF4444'] as const,
  ambient: ['rgba(239, 68, 68, 0.2)', '#070605', '#030303'] as const,
};

const parentGradients = {
  hero: ['#0c0704', '#7C2D12'] as const,
  heroDark: ['#030303', '#431407'] as const,
  card: ['#1c120c', '#0c0704'] as const,
  cta: ['#EA580C', '#F97316'] as const,
  ambient: ['rgba(249, 115, 22, 0.2)', '#0c0704', '#000000'] as const,
};

const joueurGradients = {
  hero: ['#000000', '#0A1A5C'] as const,
  heroDark: ['#000000', '#050D2E'] as const,
  card: ['#0c0c0c', '#000000'] as const,
  cta: ['#1E3AFF', '#4C6FFF'] as const,
  ambient: ['rgba(30, 58, 255, 0.28)', '#050D2E', '#000000'] as const,
};

const supporterBrandGradients = {
  hero: ['#000000', '#083344'] as const,
  heroDark: ['#000000', '#042f2e'] as const,
  card: ['#0c0c0c', '#000000'] as const,
  cta: ['#0891B2', '#06B6D4'] as const,
  ambient: ['rgba(6, 182, 212, 0.22)', '#042f2e', '#000000'] as const,
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
  if (pole === 'pro_club' || pole === 'evenements') return proClubGradients;
  if (pole === 'president') return presidentGradients;
  if (pole === 'pro_staff' || pole === 'coach') return proStaffGradients;
  if (pole === 'sponsor') return sponsorGradients;
  if (pole === 'parent') return parentGradients;
  if (pole === 'joueur' || pole === 'amateur' || pole === 'pro_player') {
    return joueurGradients;
  }
  if (pole === 'supporter') return supporterBrandGradients;
  const line = pole === 'sante' ? pole : 'pro';
  return gradientsForLine(line);
}

export { gradients, FLASH_CYAN, FLASH_CYAN_DIM };
