import { fontFamily } from '../../theme/typography';
import { spacing as globalSpacing, radius as globalRadius } from '../../theme/designTokens';

/**
 * ProDay Reels — skin « Night glass ».
 * Spacing / radius aliasent les tokens globaux (+ pas aéré via xxl).
 */
export const reelsTheme = {
  color: {
    stage: '#000000',
    ink: '#070B12',
    surface: '#101722',
    surfaceRaised: '#182232',

    /** Accent glacial (FLASH-adjacent) — anciennement mal nommé « amber » */
    cyan: '#45E6FF',
    cyanSoft: 'rgba(69, 230, 255, 0.16)',
    cyanLine: 'rgba(69, 230, 255, 0.42)',
    onCyan: '#00141A',
    /** @deprecated alias → cyan */
    amber: '#45E6FF',
    amberSoft: 'rgba(69, 230, 255, 0.16)',
    amberLine: 'rgba(69, 230, 255, 0.42)',
    onAmber: '#00141A',

    ember: '#FF4F7A',

    text: '#F3F8FF',
    textDim: 'rgba(243, 248, 255, 0.68)',
    textFaint: 'rgba(243, 248, 255, 0.42)',

    hairline: 'rgba(243, 248, 255, 0.12)',
    hairlineStrong: 'rgba(243, 248, 255, 0.24)',

    scrimTop: 'rgba(4, 8, 14, 0.56)',
    scrimSoft: 'rgba(4, 8, 14, 0.28)',
    scrimStrong: 'rgba(3, 6, 12, 0.9)',
    backdrop: 'rgba(2, 4, 8, 0.7)',
  },

  space: {
    xxs: globalSpacing.xs,
    xs: globalSpacing.sm,
    sm: globalSpacing.md,
    md: globalSpacing.lg + 2, // 18 — lecture immersive
    lg: globalSpacing.xl,
    xl: globalSpacing.xxl + 2, // 34
    xxl: 48,
  },

  radius: {
    sm: globalRadius.sm + 2, // 12
    md: globalRadius.md + 2, // 16
    lg: globalRadius.xl, // 24 — sheets
    avatar: globalRadius.md,
  },

  type: {
    masthead: {
      fontFamily: fontFamily.displayBold,
      fontSize: 16,
      letterSpacing: 3,
    },
    kicker: {
      fontFamily: fontFamily.bold,
      fontSize: 11,
      letterSpacing: 2,
    },
    name: {
      fontFamily: fontFamily.displayBold,
      fontSize: 20,
      letterSpacing: -0.4,
    },
    caption: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 22,
    },
    count: {
      fontFamily: fontFamily.bold,
      fontSize: 12,
      letterSpacing: 0.4,
    },
    display: {
      fontFamily: fontFamily.displayBold,
      fontSize: 40,
      letterSpacing: -1,
      lineHeight: 42,
    },
  },
} as const;

export const REEL_BOTTOM_SCRIM = [
  'transparent',
  reelsTheme.color.scrimSoft,
  reelsTheme.color.scrimStrong,
] as const;

export const REEL_TOP_SCRIM = [reelsTheme.color.scrimTop, 'transparent'] as const;

export const REEL_STAGE_ATMOSPHERE = ['#060A12', '#000000'] as const;
export const REEL_STAGE_GLOW = ['rgba(69, 230, 255, 0.16)', 'transparent'] as const;
