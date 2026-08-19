import { fontFamily } from '../../theme/typography';
import { spacing as globalSpacing, radius as globalRadius } from '../../theme/designTokens';
import { JOUEUR_REELS } from '../../theme/joueurDesignSystem';

/**
 * ProDay Reels — skin FUT 18 Color Premium (dock sombre + or).
 * Spacing / radius aliasent les tokens globaux (+ pas aéré via xxl).
 */
export const reelsTheme = {
  color: {
    stage: JOUEUR_REELS.stage,
    ink: JOUEUR_REELS.stage,
    surface: 'rgba(10,16,28,0.92)',
    surfaceRaised: 'rgba(14,22,38,0.94)',

    cyan: JOUEUR_REELS.accent,
    cyanSoft: JOUEUR_REELS.accentSoft,
    cyanLine: JOUEUR_REELS.accentLine,
    onCyan: '#1A1408',
    /** @deprecated alias → accent or FUT18 */
    amber: JOUEUR_REELS.accent,
    amberSoft: JOUEUR_REELS.accentSoft,
    amberLine: JOUEUR_REELS.accentLine,
    onAmber: '#1A1408',

    ember: JOUEUR_REELS.ember,

    text: JOUEUR_REELS.text,
    textDim: JOUEUR_REELS.textDim,
    textFaint: 'rgba(243, 248, 255, 0.42)',

    hairline: JOUEUR_REELS.hairline,
    hairlineStrong: 'rgba(255,255,255,0.18)',

    scrimTop: JOUEUR_REELS.scrimTop,
    scrimSoft: 'rgba(4, 8, 14, 0.28)',
    scrimStrong: JOUEUR_REELS.scrimStrong,
    backdrop: JOUEUR_REELS.backdrop,
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

export const REEL_STAGE_ATMOSPHERE = JOUEUR_REELS.atmosphere;
export const REEL_STAGE_GLOW = JOUEUR_REELS.glow;
