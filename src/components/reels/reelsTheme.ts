import { Easing } from 'react-native-reanimated';
import { fontFamily } from '../../theme/typography';

/**
 * ProDay Reels — skin « Floodlight editorial ».
 *
 * Une seule scène quasi-noire réchauffée, un accent ambre de projecteur de stade
 * (jamais de cyan), une typographie de une de magazine sportif et des légendes
 * traitées comme des sous-titres de diffusion. Tous les éléments Reels (rail,
 * bloc créateur, coque du fil, état vide, feuilles) consomment ces tokens afin
 * que l'ensemble se lise comme un même produit — et non plus l'ancien skin
 * « noir + pilules cyan ».
 */
export const reelsTheme = {
  color: {
    /** Encres — noir de scène pur pour la vidéo, noirs réchauffés pour le chrome/feuilles. */
    stage: '#000000',
    ink: '#0B0908',
    surface: '#141110',
    surfaceRaised: '#1E1A16',

    /** Ambre projecteur — l'unique accent. */
    amber: '#FFB627',
    amberBright: '#FFD37A',
    amberDim: '#B87E23',
    amberSoft: 'rgba(255, 182, 39, 0.14)',
    amberLine: 'rgba(255, 182, 39, 0.40)',
    onAmber: '#160F02',

    /** Braise chaude — un « j'aime » actif, distinct de l'ambre sans virer au rouge générique. */
    ember: '#FF7A4D',

    /** Textes chauds sur vidéo et sur feuilles. */
    text: '#F5F0E6',
    textDim: 'rgba(245, 240, 230, 0.66)',
    textFaint: 'rgba(245, 240, 230, 0.40)',

    /** Filets fins réchauffés. */
    hairline: 'rgba(245, 240, 230, 0.12)',
    hairlineStrong: 'rgba(245, 240, 230, 0.22)',

    /** Voiles — noirs légèrement réchauffés pour lier la vidéo au chrome. */
    scrimTop: 'rgba(8, 6, 4, 0.55)',
    scrimSoft: 'rgba(6, 5, 3, 0.30)',
    scrimStrong: 'rgba(5, 4, 2, 0.90)',
    backdrop: 'rgba(4, 3, 2, 0.68)',
  },

  /** Échelle d'espacement plus intentionnelle que les tokens globaux. */
  space: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 30,
    xxl: 44,
  },

  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    avatar: 12,
    pill: 999,
  },

  /** Hiérarchie typographique éditoriale (Syne en une, Inter en corps). */
  type: {
    /** Bandeau de marque en capitales très espacées. */
    masthead: {
      fontFamily: fontFamily.displayBold,
      fontSize: 15,
      letterSpacing: 4,
    },
    /** Sur-titre / méta en capitales — @handle · source, labels de section. */
    kicker: {
      fontFamily: fontFamily.bold,
      fontSize: 10.5,
      letterSpacing: 2.2,
    },
    /** Nom du créateur / titres de feuille. */
    name: {
      fontFamily: fontFamily.displayBold,
      fontSize: 19,
      letterSpacing: -0.4,
    },
    /** Légende façon sous-titre de diffusion. */
    caption: {
      fontFamily: fontFamily.regular,
      fontSize: 15.5,
      lineHeight: 23,
    },
    /** Compteurs du rail. */
    count: {
      fontFamily: fontFamily.bold,
      fontSize: 12,
      letterSpacing: 0.4,
    },
    /** Grand titre éditorial (état vide / invité). */
    display: {
      fontFamily: fontFamily.displayBold,
      fontSize: 38,
      letterSpacing: -1.2,
      lineHeight: 40,
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

/** Atmosphère desktop/tablette — noir réchauffé avec halo de projecteur ambre. */
export const REEL_STAGE_ATMOSPHERE = ['#0A0806', '#000000'] as const;
export const REEL_STAGE_GLOW = ['rgba(255, 182, 39, 0.13)', 'transparent'] as const;
