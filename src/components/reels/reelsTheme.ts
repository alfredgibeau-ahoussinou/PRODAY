import { Easing } from 'react-native-reanimated';
import { fontFamily } from '../../theme/typography';

/**
 * ProDay Reels — skin « Night glass ».
 *
 * Direction premium immersive: scène noire profonde, accents glaciaux cyan,
 * surfaces verre fumé, hiérarchie type nette et aérée.
 */
export const reelsTheme = {
  color: {
    /** Base sombre premium */
    stage: '#000000',
    ink: '#070B12',
    surface: '#101722',
    surfaceRaised: '#182232',

    /** Accent ProDay froid */
    amber: '#45E6FF',
    amberBright: '#8CF1FF',
    amberDim: '#2CA4B8',
    amberSoft: 'rgba(69, 230, 255, 0.16)',
    amberLine: 'rgba(69, 230, 255, 0.42)',
    onAmber: '#00141A',

    /** Like actif */
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

  /** Échelle d'espacement plus intentionnelle que les tokens globaux. */
  space: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 34,
    xxl: 48,
  },

  radius: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 24,
    avatar: 14,
    pill: 999,
  },

  /** Hiérarchie premium (Syne + Inter) */
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

  motion: {
    reveal: 460,
    easing: Easing.out(Easing.cubic),
  },
} as const;

/** Voile bas de scène — sombre et réchauffé, sans carte ni barre. */
export const REEL_BOTTOM_SCRIM = [
  'transparent',
  reelsTheme.color.scrimSoft,
  reelsTheme.color.scrimStrong,
] as const;

/** Voile haut — garde le bandeau lisible sur vidéo claire. */
export const REEL_TOP_SCRIM = [reelsTheme.color.scrimTop, 'transparent'] as const;

/** Atmosphère desktop/tablette */
export const REEL_STAGE_ATMOSPHERE = ['#060A12', '#000000'] as const;
export const REEL_STAGE_GLOW = ['rgba(69, 230, 255, 0.16)', 'transparent'] as const;
