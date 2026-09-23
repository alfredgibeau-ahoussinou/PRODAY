import { Platform, type ViewStyle } from 'react-native';
import {
  LIQUID_GLASS_INTENSITIES,
  OPAQUE_TOKENS,
  type LiquidGlassIntensity,
  type LiquidGlassTokens,
} from '../../../theme/liquidGlass';
import { useAppearance } from '../../../context/AppearanceContext';

/**
 * Tokens — ProDay Espace Admin Plateforme (Apple-Inspired Design System & Liquid Glass).
 * Apple System Blue · Dark & Light Layered Surfaces · SF Pro Typography.
 */

export type AdminThemeTokens = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceGlass: string;
  border: string;
  borderStrong: string;
  borderLuxury: string;
  specularTop: string;
  glassBackdrop?: Record<string, unknown>;
  foreground: string;
  muted: string;
  faint: string;
  accent: string;
  accentHot: string;
  accentSoft: string;
  accentText: string;
  signal: string;
  signalSoft: string;
  champagne: string;
  champagneBright: string;
  champagneSoft: string;
  champagneGlow: string;
  success: string;
  successSoft: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  indigo: string;
  purple: string;
  teal: string;
  sidebarBg: string;
  headerBg: string;
  dockBg: string;
  overlay: string;
  hairline: string;
  ink: string;
  healthGood: string;
  healthMid: string;
  healthBad: string;
  railInk: string;
  stripBg: string;
  isGlass: boolean;
};

export function resolveAdminTokens(
  isGlassActive = true,
  intensity: LiquidGlassIntensity = 'regular',
): AdminThemeTokens {
  const glassTokens: LiquidGlassTokens = isGlassActive
    ? LIQUID_GLASS_INTENSITIES[intensity] ?? LIQUID_GLASS_INTENSITIES.regular
    : OPAQUE_TOKENS;

  const isGlass = glassTokens.mode === 'glass';

  return {
    // Apple Deep System Surfaces
    bg: '#080C14',
    bgElevated: isGlass ? 'rgba(28, 28, 30, 0.85)' : '#1C1C1E',
    surface: '#161922',
    surfaceRaised: isGlass ? 'rgba(38, 42, 54, 0.85)' : '#232836',
    surfaceMuted: isGlass ? 'rgba(20, 24, 34, 0.65)' : '#11151F',
    surfaceGlass: isGlass ? glassTokens.bg : '#161922',
    border: isGlass ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)',
    borderStrong: isGlass ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.16)',
    borderLuxury: 'rgba(10, 132, 255, 0.40)',
    specularTop: isGlass ? glassTokens.specularTop : 'rgba(255, 255, 255, 0.08)',
    glassBackdrop: isGlass ? glassTokens.blurStyle : undefined,

    // Typography
    foreground: '#FFFFFF',
    muted: '#94A3B8',
    faint: '#64748B',

    // Apple System Blue Primary Interactive
    accent: '#0A84FF',
    accentHot: '#0A84FF',
    accentSoft: 'rgba(10, 132, 255, 0.15)',
    accentText: '#FFFFFF',
    signal: '#0A84FF',
    signalSoft: 'rgba(10, 132, 255, 0.15)',

    // Apple Brand & Accent Highlights
    champagne: '#38BDF8',
    champagneBright: '#7DD3FC',
    champagneSoft: 'rgba(56, 189, 248, 0.12)',
    champagneGlow: 'rgba(56, 189, 248, 0.20)',

    // Apple Semantic Colors (iOS / macOS specifications)
    success: '#30D158',
    successSoft: 'rgba(48, 209, 88, 0.15)',
    warn: '#FF9F0A',
    warnSoft: 'rgba(255, 159, 10, 0.15)',
    danger: '#FF453A',
    dangerSoft: 'rgba(255, 69, 58, 0.15)',
    info: '#0A84FF',
    infoSoft: 'rgba(10, 132, 255, 0.15)',
    indigo: '#5E5CE6',
    purple: '#BF5AF2',
    teal: '#63E6E2',

    // Shell & Translucent Chrome
    sidebarBg: isGlass ? 'rgba(15, 18, 26, 0.85)' : '#0F121A',
    headerBg: isGlass ? 'rgba(20, 24, 34, 0.88)' : '#141822',
    dockBg: isGlass ? 'rgba(22, 26, 38, 0.90)' : '#161A26',
    overlay: 'rgba(0, 0, 0, 0.75)',
    hairline: 'rgba(255, 255, 255, 0.10)',
    ink: '#FFFFFF',
    healthGood: '#30D158',
    healthMid: '#FF9F0A',
    healthBad: '#FF453A',
    railInk: '#FFFFFF',
    stripBg: isGlass ? 'rgba(18, 22, 32, 0.85)' : '#121620',
    isGlass,
  };
}

/**
 * Hook réactif fournissant les tokens d'apparence Admin mis à jour en temps réel
 * dès que la préférence d'apparence Liquid Glass ou le système change.
 */
export function useAdminTokens(): AdminThemeTokens {
  const { isEffectiveGlass, intensity } = useAppearance();
  return resolveAdminTokens(isEffectiveGlass, intensity);
}

export const ADMIN_TOKENS: AdminThemeTokens = resolveAdminTokens(true);

