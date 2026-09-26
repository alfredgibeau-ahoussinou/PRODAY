import { Platform, AccessibilityInfo, type ViewStyle } from 'react-native';

/**
 * Configuration et détection des capacités de Liquid Glass — Palette Electric Athletic Apple iOS.
 * Progressive enhancement :
 * - Mode Glass : Slate translucide, backdrop-filter blur Apple, bordure spéculaire, lueur Electric Mint (#00F0A8).
 * - Mode Opaque : Surfaces solides à fort contraste et bordures nettes, conformes aux exigences d'accessibilité.
 * - Support universel Dark & Light.
 */

export interface LiquidGlassTokens {
  mode: 'glass' | 'opaque';
  isLight: boolean;
  bg: string;
  bgElevated: string;
  bgActive: string;
  border: string;
  borderActive: string;
  specularTop: string;
  accent: string;
  accentSecondary: string;
  text: string;
  textMuted: string;
  textDim: string;
  blurStyle?: Record<string, unknown>;
  shadow: ViewStyle;
}

export type LiquidGlassIntensity = 'subtle' | 'regular' | 'intense';

// --- DARK PALETTE ---
export const LIQUID_GLASS_INTENSITIES_DARK: Record<LiquidGlassIntensity, LiquidGlassTokens> = {
  subtle: {
    mode: 'glass',
    isLight: false,
    bg: 'rgba(15, 23, 42, 0.88)',
    bgElevated: 'rgba(22, 33, 58, 0.92)',
    bgActive: 'rgba(16, 46, 54, 0.94)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderActive: '#00F0A8',
    specularTop: 'rgba(255, 255, 255, 0.16)',
    accent: '#00F0A8',
    accentSecondary: '#38BDF8',
    text: '#FFFFFF',
    textMuted: '#8B8B9A',
    textDim: 'rgba(139, 139, 154, 0.72)',
    blurStyle:
      Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          } as unknown as Record<string, unknown>)
        : undefined,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
      elevation: 6,
    },
  },
  regular: {
    mode: 'glass',
    isLight: false,
    bg: 'rgba(15, 23, 42, 0.76)',
    bgElevated: 'rgba(22, 33, 58, 0.85)',
    bgActive: 'rgba(16, 46, 54, 0.90)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderActive: '#00F0A8',
    specularTop: 'rgba(255, 255, 255, 0.22)',
    accent: '#00F0A8',
    accentSecondary: '#38BDF8',
    text: '#FFFFFF',
    textMuted: '#8B8B9A',
    textDim: 'rgba(139, 139, 154, 0.72)',
    blurStyle:
      Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          } as unknown as Record<string, unknown>)
        : undefined,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.42,
      shadowRadius: 28,
      elevation: 8,
    },
  },
  intense: {
    mode: 'glass',
    isLight: false,
    bg: 'rgba(15, 23, 42, 0.62)',
    bgElevated: 'rgba(22, 33, 58, 0.72)',
    bgActive: 'rgba(16, 46, 54, 0.80)',
    border: 'rgba(255, 255, 255, 0.22)',
    borderActive: '#00F0A8',
    specularTop: 'rgba(255, 255, 255, 0.32)',
    accent: '#00F0A8',
    accentSecondary: '#38BDF8',
    text: '#FFFFFF',
    textMuted: '#8B8B9A',
    textDim: 'rgba(139, 139, 154, 0.72)',
    blurStyle:
      Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(40px) saturate(220%)',
            WebkitBackdropFilter: 'blur(40px) saturate(220%)',
          } as unknown as Record<string, unknown>)
        : undefined,
    shadow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 36,
      elevation: 10,
    },
  },
};

export const OPAQUE_TOKENS_DARK: LiquidGlassTokens = {
  mode: 'opaque',
  isLight: false,
  bg: '#0F172A',
  bgElevated: '#16213A',
  bgActive: '#132C35',
  border: '#25334D',
  borderActive: '#00F0A8',
  specularTop: '#334366',
  accent: '#00F0A8',
  accentSecondary: '#38BDF8',
  text: '#FFFFFF',
  textMuted: '#8B8B9A',
  textDim: 'rgba(139, 139, 154, 0.72)',
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
};

// --- LIGHT PALETTE ---
export const LIQUID_GLASS_INTENSITIES_LIGHT: Record<LiquidGlassIntensity, LiquidGlassTokens> = {
  subtle: {
    mode: 'glass',
    isLight: true,
    bg: 'rgba(255, 255, 255, 0.88)',
    bgElevated: 'rgba(248, 250, 252, 0.94)',
    bgActive: 'rgba(240, 253, 250, 0.94)',
    border: 'rgba(0, 0, 0, 0.08)',
    borderActive: '#059669',
    specularTop: 'rgba(255, 255, 255, 0.95)',
    accent: '#059669',
    accentSecondary: '#0284C7',
    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    blurStyle:
      Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          } as unknown as Record<string, unknown>)
        : undefined,
    shadow: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
  },
  regular: {
    mode: 'glass',
    isLight: true,
    bg: 'rgba(255, 255, 255, 0.75)',
    bgElevated: 'rgba(248, 250, 252, 0.85)',
    bgActive: 'rgba(240, 253, 250, 0.88)',
    border: 'rgba(0, 0, 0, 0.10)',
    borderActive: '#059669',
    specularTop: 'rgba(255, 255, 255, 1.0)',
    accent: '#059669',
    accentSecondary: '#0284C7',
    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    blurStyle:
      Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          } as unknown as Record<string, unknown>)
        : undefined,
    shadow: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 22,
      elevation: 6,
    },
  },
  intense: {
    mode: 'glass',
    isLight: true,
    bg: 'rgba(255, 255, 255, 0.58)',
    bgElevated: 'rgba(248, 250, 252, 0.70)',
    bgActive: 'rgba(240, 253, 250, 0.75)',
    border: 'rgba(0, 0, 0, 0.14)',
    borderActive: '#059669',
    specularTop: 'rgba(255, 255, 255, 1.0)',
    accent: '#059669',
    accentSecondary: '#0284C7',
    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    blurStyle:
      Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(40px) saturate(220%)',
            WebkitBackdropFilter: 'blur(40px) saturate(220%)',
          } as unknown as Record<string, unknown>)
        : undefined,
    shadow: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 28,
      elevation: 8,
    },
  },
};

export const OPAQUE_TOKENS_LIGHT: LiquidGlassTokens = {
  mode: 'opaque',
  isLight: true,
  bg: '#F8FAFC',
  bgElevated: '#FFFFFF',
  bgActive: '#F0FDFA',
  border: '#E2E8F0',
  borderActive: '#059669',
  specularTop: '#FFFFFF',
  accent: '#059669',
  accentSecondary: '#0284C7',
  text: '#0F172A',
  textMuted: '#64748B',
  textDim: '#94A3B8',
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
};

// Aliases pour compatibilité
export const LIQUID_GLASS_INTENSITIES = LIQUID_GLASS_INTENSITIES_DARK;
export const OPAQUE_TOKENS = OPAQUE_TOKENS_DARK;
export const LIQUID_GLASS_TOKENS = {
  glass: LIQUID_GLASS_INTENSITIES_DARK.regular,
  opaque: OPAQUE_TOKENS_DARK,
};

let isTransparencyReduced = false;

if (typeof AccessibilityInfo?.isReduceTransparencyEnabled === 'function') {
  AccessibilityInfo.isReduceTransparencyEnabled()
    .then((reduced) => {
      isTransparencyReduced = Boolean(reduced);
    })
    .catch(() => {});

  if (typeof AccessibilityInfo?.addEventListener === 'function') {
    AccessibilityInfo.addEventListener('reduceTransparencyChanged', (reduced) => {
      isTransparencyReduced = Boolean(reduced);
    });
  }
}

export function getLiquidGlassTokens(
  forceOpaque = false,
  intensity: LiquidGlassIntensity = 'regular',
  isLight = false,
): LiquidGlassTokens {
  if (forceOpaque || isTransparencyReduced) {
    return isLight ? OPAQUE_TOKENS_LIGHT : OPAQUE_TOKENS_DARK;
  }
  const set = isLight ? LIQUID_GLASS_INTENSITIES_LIGHT : LIQUID_GLASS_INTENSITIES_DARK;
  return set[intensity] ?? set.regular;
}
