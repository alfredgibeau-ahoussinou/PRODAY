/**
 * Design system inscription / gate / login —
 * Palette Electric Athletic & Deep Midnight Slate.
 */

import type { UserRole } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import type { CarouselPoleId } from '../../models/CarouselPole';
import {
  PRODAY_MASTER,
  PRODAY_POLE_LABELS,
  type ProDayBrandVariant,
} from '../../theme/prodayBrand';
import { brandVariantForCarouselPole } from '../../components/branding/intro/universePoleBrand';

export type SignupVisualChrome = {
  variant: ProDayBrandVariant;
  /** Label pôle affiché (JOUEUR, COACH…). */
  poleLabel: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  focus: string;
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  washTop: string;
  washMid: string;
  washTransparent: string;
  danger: string;
  dangerSoft: string;
};

/** Palette Electric Athletic moderne et contrastée */
export const ATHLETIC_PALETTE = {
  bg: '#0B0F19',
  surface: '#111827',
  elevated: 'rgba(22, 33, 58, 0.88)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  electricMint: '#00F0A8',
  onMint: '#051B14',
  iceCyan: '#38BDF8',
  onCyan: '#082F49',
  amberSunset: '#F59E0B',
  onAmber: '#451A03',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
} as const;

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
  return 'player';
}

export function buildSignupVisualChrome(
  variant: ProDayBrandVariant,
): SignupVisualChrome {
  let accent: string = ATHLETIC_PALETTE.electricMint;
  let onAccent: string = ATHLETIC_PALETTE.onMint;
  let accentSoft: string = 'rgba(0, 240, 168, 0.16)';

  if (variant === 'coach' || variant === 'admin' || variant === 'supporter') {
    accent = ATHLETIC_PALETTE.iceCyan;
    onAccent = ATHLETIC_PALETTE.onCyan;
    accentSoft = 'rgba(56, 189, 248, 0.16)';
  } else if (variant === 'club' || variant === 'sponsor') {
    accent = ATHLETIC_PALETTE.amberSunset;
    onAccent = ATHLETIC_PALETTE.onAmber;
    accentSoft = 'rgba(245, 158, 11, 0.16)';
  }

  const poleLabel = PRODAY_POLE_LABELS[variant] || 'PRODAY';

  return {
    variant,
    poleLabel,
    accent,
    accentSoft,
    onAccent,
    focus: accent,
    bg: ATHLETIC_PALETTE.bg,
    surface: ATHLETIC_PALETTE.surface,
    elevated: ATHLETIC_PALETTE.elevated,
    border: ATHLETIC_PALETTE.border,
    borderStrong: ATHLETIC_PALETTE.borderStrong,
    text: ATHLETIC_PALETTE.text,
    textMuted: ATHLETIC_PALETTE.textMuted,
    textFaint: ATHLETIC_PALETTE.textFaint,
    washTop: `rgba(${accent === ATHLETIC_PALETTE.iceCyan ? '56, 189, 248' : accent === ATHLETIC_PALETTE.amberSunset ? '245, 158, 11' : '0, 240, 168'}, 0.12)`,
    washMid: 'rgba(15, 23, 42, 0.04)',
    washTransparent: 'transparent',
    danger: ATHLETIC_PALETTE.danger,
    dangerSoft: ATHLETIC_PALETTE.dangerSoft,
  };
}

export function resolveSignupVisual(opts: {
  role?: UserRole | null;
  productLine?: ProductLineId | null;
  pole?: CarouselPoleId | null;
  sante?: boolean;
}): SignupVisualChrome {
  const variant = resolveSignupBrandVariant(opts);
  return buildSignupVisualChrome(variant);
}

export const SIGNUP_POLE_ACCENT_MAP = {
  player: ATHLETIC_PALETTE.electricMint,
  coach: ATHLETIC_PALETTE.iceCyan,
  club: ATHLETIC_PALETTE.amberSunset,
  parent: ATHLETIC_PALETTE.electricMint,
  sponsor: ATHLETIC_PALETTE.amberSunset,
  supporter: ATHLETIC_PALETTE.iceCyan,
} as const;
