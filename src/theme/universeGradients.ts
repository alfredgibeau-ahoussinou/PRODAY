import type { ProductLineId } from '../models/ProductLine';
import type { CarouselPoleId } from '../models/CarouselPole';
import { gradients } from './designTokens';
import { proGradients, santeGradients, womanGradients, amateurGradients, supporterGradients } from './universeTheme';

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
  if (line === 'pro' || line === 'pro_player' || line === 'pro_club' || line === 'pro_staff') {
    return {
      hero: proGradients.hero,
      heroDark: proGradients.heroDark,
      card: proGradients.card,
      cta: proGradients.cta,
      ambient: ['#DBEAFE', '#F8FAFC', '#F8FAFC'] as const,
    };
  }
  if (line === 'amateur') {
    return {
      hero: amateurGradients.hero,
      heroDark: amateurGradients.heroDark,
      card: amateurGradients.card,
      cta: amateurGradients.cta,
      ambient: ['#FFEDD5', '#FFFBF5', '#FFFBF5'] as const,
    };
  }
  if (line === 'supporter') {
    return {
      hero: supporterGradients.hero,
      heroDark: supporterGradients.heroDark,
      card: supporterGradients.card,
      cta: supporterGradients.cta,
      ambient: ['#EDE9FE', '#FAFAFF', '#FAFAFF'] as const,
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

const proClubGradients = {
  hero: ['#0A0A0A', '#0C4A6E'] as const,
  heroDark: ['#082f49', '#0A0A0A'] as const,
  card: ['#F0F9FF', '#FFFFFF'] as const,
  cta: ['#0A0A0A', '#0369A1'] as const,
  ambient: ['#E0F2FE', '#F8FAFC', '#F8FAFC'] as const,
};

const proStaffGradients = {
  hero: ['#0A0A0A', '#312E81'] as const,
  heroDark: ['#1e1b4b', '#0A0A0A'] as const,
  card: ['#EEF2FF', '#FFFFFF'] as const,
  cta: ['#0A0A0A', '#4338CA'] as const,
  ambient: ['#E0E7FF', '#F8FAFF', '#F8FAFF'] as const,
};

const sponsorGradients = {
  hero: ['#070605', '#1a1508'] as const,
  heroDark: ['#030303', '#070605'] as const,
  card: ['#14110a', '#0c0a06'] as const,
  cta: ['#92700C', '#D4AF37'] as const,
  ambient: ['#1a1508', '#070605', '#070605'] as const,
};

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
      ambient: ['#DBEAFE', '#F8FAFC', '#F8FAFC'] as const,
    };
  }
  const line = pole === 'amateur' || pole === 'supporter' || pole === 'sante' ? pole : 'pro';
  return gradientsForLine(line);
}

export { gradients };
