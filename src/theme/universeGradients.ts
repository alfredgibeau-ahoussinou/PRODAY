import type { ProductLineId } from '../models/ProductLine';
import type { CarouselPoleId } from '../models/CarouselPole';
import { gradients, FLASH_CYAN, FLASH_CYAN_DIM } from './designTokens';
import { proGradients, santeGradients, womanGradients, amateurGradients, supporterGradients } from './universeTheme';

export type GradientStops = readonly [string, string, ...string[]];

export const hommeGradients = {
  hero: ['#000000', '#14532D'] as const,
  heroDark: ['#000000', '#052e16'] as const,
  card: ['#1A1A24', '#0A0A0F'] as const,
  cta: ['#15803D', '#4ADE80'] as const,
  ambient: ['rgba(74, 222, 128, 0.12)', '#0A0A0F', '#000000'] as const,
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
      ambient: ['rgba(244, 114, 182, 0.14)', '#0A0A0F', '#000000'] as const,
    };
  }
  if (line === 'pro_club') {
    return proClubGradients;
  }
  if (line === 'pro_player') {
    return joueurGradients;
  }
  if (line === 'pro' || line === 'pro_staff') {
    return {
      hero: proGradients.hero,
      heroDark: proGradients.heroDark,
      card: proGradients.card,
      cta: proGradients.cta,
      ambient: ['rgba(197, 160, 89, 0.18)', '#0A0A0F', '#000000'] as const,
    };
  }
  if (line === 'amateur') {
    return {
      hero: amateurGradients.hero,
      heroDark: amateurGradients.heroDark,
      card: amateurGradients.card,
      cta: amateurGradients.cta,
      ambient: ['rgba(255, 255, 255, 0.12)', '#0A0A0F', '#000000'] as const,
    };
  }
  if (line === 'supporter') {
    return {
      hero: supporterGradients.hero,
      heroDark: supporterGradients.heroDark,
      card: supporterGradients.card,
      cta: supporterGradients.cta,
      ambient: ['rgba(6, 182, 212, 0.22)', '#0A0A0F', '#000000'] as const,
    };
  }
  if (line === 'sante') {
    return {
      hero: santeGradients.hero,
      heroDark: santeGradients.heroDark,
      card: santeGradients.card,
      cta: santeGradients.cta,
      ambient: ['rgba(45, 212, 191, 0.14)', '#0A0A0F', '#000000'] as const,
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

/**
 * Continuité couleurs planche brand → shells.
 *
 * Pôle Club : **palette mesurée sur la référence** (D-011) — canvas noir,
 * surface élevée `#262E33`, accent or `#F8D548` (dégradé CTA depuis l'or
 * assombri relevé sur l'antialiasing du FAB), aucun wash teinté.
 */
const proClubGradients = {
  hero: ['#000000', '#000000'] as const,
  heroDark: ['#000000', '#0A0A0F'] as const,
  card: ['#262E33', '#0A0A0F'] as const,
  cta: ['#9F8629', '#F8D548'] as const,
  /** Discover / canvas Club — noir pur, pas de wash teinté. */
  ambient: ['#000000', '#000000', '#000000'] as const,
};

const presidentGradients = {
  hero: ['#03050A', '#1A1408'] as const,
  heroDark: ['#03050A', '#05070E'] as const,
  card: ['#0E1524', '#05070E'] as const,
  cta: ['#9A7B2F', '#C5A059'] as const,
  ambient: ['rgba(197, 160, 89, 0.22)', '#05070E', '#03050A'] as const,
};

const proStaffGradients = {
  hero: ['#000000', '#1A1408'] as const,
  heroDark: ['#000000', '#0A0A0F'] as const,
  card: ['#1A1A24', '#0A0A0F'] as const,
  cta: ['#9A7B2F', '#C5A059'] as const,
  ambient: ['rgba(197, 160, 89, 0.18)', '#0A0A0F', '#000000'] as const,
};

const sponsorGradients = {
  hero: ['#070605', '#1a0818'] as const,
  heroDark: ['#030303', '#070605'] as const,
  card: ['#14110a', '#0c0a06'] as const,
  cta: ['#6B1F68', '#92278F'] as const,
  ambient: ['rgba(146, 39, 143, 0.2)', '#070605', '#030303'] as const,
};

const parentGradients = {
  hero: ['#0c0704', '#1A2408'] as const,
  heroDark: ['#030303', '#141A06'] as const,
  card: ['#1c120c', '#0c0704'] as const,
  cta: ['#6B9A2E', '#8CC63F'] as const,
  ambient: ['rgba(140, 198, 63, 0.2)', '#0c0704', '#000000'] as const,
};

const joueurGradients = {
  hero: ['#000000', '#0A0A0F'] as const,
  heroDark: ['#000000', '#050505'] as const,
  card: ['#0c0c0c', '#000000'] as const,
  cta: ['#E5E5E5', '#FFFFFF'] as const,
  ambient: ['rgba(255, 255, 255, 0.12)', '#050505', '#000000'] as const,
};

const eventsGradients = {
  hero: ['#0c0704', '#2A1808'] as const,
  heroDark: ['#030303', '#1A1006'] as const,
  card: ['#1c120c', '#0c0704'] as const,
  cta: ['#D97B12', '#F7941D'] as const,
  ambient: ['rgba(247, 148, 29, 0.2)', '#0c0704', '#000000'] as const,
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
  '#0A0A0F',
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
  if (pole === 'evenements') return eventsGradients;
  if (pole === 'president' || pole === 'admin') return presidentGradients;
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
