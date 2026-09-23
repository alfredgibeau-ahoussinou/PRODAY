import { Platform, AccessibilityInfo, type ViewStyle } from 'react-native';

/**
 * Configuration et détection des capacités de Liquid Glass — Palette Electric Athletic Apple iOS.
 * Progressive enhancement :
 * - Mode Glass : Deep Midnight Slate translucide, backdrop-filter blur Apple, bordure spéculaire, lueur Electric Mint (#00F0A8).
 * - Mode Opaque : Deep Slate solide (#0F172A / #16213A), bordure nette (#25334D) et fort contraste.
 */

export interface LiquidGlassTokens {
  mode: 'glass' | 'opaque';
  bg: string;
  bgElevated: string;
  bgActive: string;
  border: string;
  borderActive: string;
  specularTop: string;
  accent: string;
  accentSecondary: string;
  blurStyle?: Record<string, unknown>;
  shadow: ViewStyle;
}

export type LiquidGlassIntensity = 'subtle' | 'regular' | 'intense';

export const LIQUID_GLASS_INTENSITIES: Record<LiquidGlassIntensity, LiquidGlassTokens> = {
  subtle: {
    mode: 'glass',
    bg: 'rgba(15, 23, 42, 0.88)',
    bgElevated: 'rgba(22, 33, 58, 0.92)',
    bgActive: 'rgba(16, 46, 54, 0.94)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderActive: '#00F0A8',
    specularTop: 'rgba(255, 255, 255, 0.16)',
    accent: '#00F0A8',
    accentSecondary: '#38BDF8',
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
    bg: 'rgba(15, 23, 42, 0.76)',
    bgElevated: 'rgba(22, 33, 58, 0.85)',
    bgActive: 'rgba(16, 46, 54, 0.90)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderActive: '#00F0A8',
    specularTop: 'rgba(255, 255, 255, 0.22)',
    accent: '#00F0A8',
    accentSecondary: '#38BDF8',
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
    bg: 'rgba(15, 23, 42, 0.62)',
    bgElevated: 'rgba(22, 33, 58, 0.72)',
    bgActive: 'rgba(16, 46, 54, 0.80)',
    border: 'rgba(255, 255, 255, 0.22)',
    borderActive: '#00F0A8',
    specularTop: 'rgba(255, 255, 255, 0.32)',
    accent: '#00F0A8',
    accentSecondary: '#38BDF8',
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

export const OPAQUE_TOKENS: LiquidGlassTokens = {
  mode: 'opaque',
  bg: '#0F172A',
  bgElevated: '#16213A',
  bgActive: '#132C35',
  border: '#25334D',
  borderActive: '#00F0A8',
  specularTop: '#334366',
  accent: '#00F0A8',
  accentSecondary: '#38BDF8',
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
};

export const LIQUID_GLASS_TOKENS: {
  glass: LiquidGlassTokens;
  opaque: LiquidGlassTokens;
} = {
  glass: LIQUID_GLASS_INTENSITIES.regular,
  opaque: OPAQUE_TOKENS,
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
): LiquidGlassTokens {
  if (forceOpaque || isTransparencyReduced) {
    return OPAQUE_TOKENS;
  }
  return LIQUID_GLASS_INTENSITIES[intensity] ?? LIQUID_GLASS_INTENSITIES.regular;
}
