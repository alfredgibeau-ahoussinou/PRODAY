/**
 * Design system inscription / gate / login —
 * mêmes accents officiels que les shells authentifiés (PRODAY_POLE_ACCENTS).
 * Pas de feuille blanche legacy, pas d’or forcé sur le pôle Joueur.
 */

import type { UserRole } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import type { CarouselPoleId } from '../../models/CarouselPole';
import {
  PRODAY_MASTER,
  PRODAY_POLE_ACCENTS,
  PRODAY_POLE_LABELS,
  brandVariantForProductLine,
  poleAccent,
  poleAccentSoft,
  poleOnAccent,
  type ProDayBrandVariant,
} from '../../theme/prodayBrand';
import { brandVariantForCarouselPole } from '../../components/branding/intro/universePoleBrand';
import { santeColorOverrides } from '../../theme/prodaySanteTheme';

export type SignupVisualChrome = {
  variant: ProDayBrandVariant;
  /** Label pôle affiché (JOUEUR, COACH…). */
  poleLabel: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  /** Focus input / progress — blanc joueur → or pour lisibilité fine. */
  focus: string;
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** Wash haut d’écran (comme ClubAppShell). */
  washTop: string;
  washMid: string;
  washTransparent: string;
  danger: string;
  dangerSoft: string;
};

function hexToWash(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(197, 160, 89, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function brandVariantForSignupRole(role: UserRole): ProDayBrandVariant {
  switch (role) {
    case 'player':
      return 'player';
    case 'coach':
      return 'coach';
    case 'club':
      return 'club';
    case 'parent':
      return 'parent';
    case 'sponsor':
      return 'sponsor';
    case 'supporter':
      return 'supporter';
    case 'physio':
      return 'master';
    case 'agent':
    case 'recruiter':
    case 'organizer':
      return 'coach';
    default:
      return 'master';
  }
}

export function resolveSignupBrandVariant(opts: {
  role?: UserRole | null;
  productLine?: ProductLineId | null;
  pole?: CarouselPoleId | null;
}): ProDayBrandVariant {
  if (opts.pole) return brandVariantForCarouselPole(opts.pole);
  if (opts.role) return brandVariantForSignupRole(opts.role);
  return brandVariantForProductLine(opts.productLine, {
    sponsor: opts.productLine === 'sponsor',
  });
}

/**
 * Chrome inscription = look shell (noir + wash pôle + charcoal).
 * Santé : teal legacy conservé.
 */
export function buildSignupVisualChrome(
  variant: ProDayBrandVariant,
): SignupVisualChrome {
  const accent = poleAccent(variant);
  const accentSoft = poleAccentSoft(variant, 0.22);
  const onAccent = poleOnAccent(variant);
  const poleLabel = PRODAY_POLE_LABELS[variant] || 'PRODAY';

  const focus =
    accent.toUpperCase() === '#FFFFFF' ? PRODAY_MASTER.goldBright : accent;

  return {
    variant,
    poleLabel,
    accent,
    accentSoft,
    onAccent,
    focus,
    bg: PRODAY_MASTER.black,
    surface: PRODAY_MASTER.surfaceAlt,
    elevated: PRODAY_MASTER.surface,
    border: 'rgba(255, 255, 255, 0.10)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',
    text: '#F4F7FC',
    textMuted: 'rgba(244, 247, 252, 0.68)',
    textFaint: 'rgba(244, 247, 252, 0.44)',
    washTop: hexToWash(accent, 0.16),
    washMid: hexToWash(accent, 0.06),
    washTransparent: 'transparent',
    danger: '#F87171',
    dangerSoft: 'rgba(248, 113, 113, 0.16)',
  };
}

/** Santé / physio — accent teal produit. */
export function buildSanteSignupVisualChrome(): SignupVisualChrome {
  const accent = santeColorOverrides.accent;
  return {
    variant: 'master',
    poleLabel: 'SANTÉ',
    accent,
    accentSoft: santeColorOverrides.accentSoft,
    onAccent: PRODAY_MASTER.black,
    focus: accent,
    bg: PRODAY_MASTER.black,
    surface: PRODAY_MASTER.surfaceAlt,
    elevated: PRODAY_MASTER.surface,
    border: 'rgba(255, 255, 255, 0.10)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',
    text: '#F4F7FC',
    textMuted: 'rgba(244, 247, 252, 0.68)',
    textFaint: 'rgba(244, 247, 252, 0.44)',
    washTop: hexToWash(accent, 0.16),
    washMid: hexToWash(accent, 0.06),
    washTransparent: 'transparent',
    danger: '#F87171',
    dangerSoft: 'rgba(248, 113, 113, 0.16)',
  };
}

export function resolveSignupVisual(opts: {
  role?: UserRole | null;
  productLine?: ProductLineId | null;
  pole?: CarouselPoleId | null;
  sante?: boolean;
}): SignupVisualChrome {
  if (opts.sante || opts.productLine === 'sante' || opts.role === 'physio') {
    return buildSanteSignupVisualChrome();
  }
  const variant = resolveSignupBrandVariant(opts);
  return buildSignupVisualChrome(variant);
}

/** Accents officiels exposés pour les tests / audit. */
export const SIGNUP_POLE_ACCENT_MAP = {
  player: PRODAY_POLE_ACCENTS.player,
  coach: PRODAY_POLE_ACCENTS.coach,
  club: PRODAY_POLE_ACCENTS.club,
  parent: PRODAY_POLE_ACCENTS.parent,
  sponsor: PRODAY_POLE_ACCENTS.sponsor,
  supporter: PRODAY_POLE_ACCENTS.supporter,
} as const;
