import type { ProductLineId } from '../models/ProductLine';
import { isProProductLine } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { isMedicalPractitionerRole } from '../content/medicalExperience';
import { FLASH_CYAN, colors } from './designTokens';
import {
  hommeColorOverrides,
  proColorOverrides,
  type AppColors,
} from './universeTheme';
import { womanColorOverrides } from './prodayWomanTheme';
import { amateurColorOverrides } from './prodayAmateurTheme';
import { supporterColorOverrides } from './prodaySupporterTheme';
import { santeColorOverrides } from './prodaySanteTheme';
import type { PlayerSegment } from '../utils/playerSegment';
import {
  amateurFemaleOverrides,
  amateurMinorOverrides,
  proPlayerFemaleOverrides,
  proPlayerMaleOverrides,
} from './playerSegmentTheme';

export type PoleTabBarLayout = 'pill' | 'dock';

type PolePalette = {
  accent: string;
  brand: string;
  ink: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
  surface: string;
  background: string;
  textMuted: string;
  brandSoft: string;
  surfaceMuted?: string;
  accentLight?: string;
};

export type PoleTabBarChrome = {
  layout: PoleTabBarLayout;
  flatLayout: boolean;
  /** Style Instagram : barre flush, icônes, sans pilule ni bandeau. */
  cleanStyle: boolean;
  accent: string;
  activeIcon: string;
  inactiveIcon: string;
  barBackground: string;
  barBorderColor: string;
  rootBackground: string;
  centerButtonIdle: string;
  centerButtonBorder: string;
  centerButtonBorderWidth: number;
  centerButtonLift: number;
  centerButtonSize: number;
  barBorderRadius: number;
  barBorderWidth: number;
  topAccentColor: string;
  topAccentHeight: number;
  barShadow: boolean;
  badgeColor: string;
  overflowKicker: string;
};

/** Dock FLASH sombre partagé */
const FLASH_DOCK_BG = 'rgba(8, 8, 8, 0.92)';
const FLASH_DOCK_BORDER = 'rgba(255, 255, 255, 0.1)';
const FLASH_INACTIVE = '#A3A3A3';

function makeChrome(
  palette: PolePalette,
  config: {
    overflowKicker: string;
    layout: PoleTabBarLayout;
    flatLayout?: boolean;
    cleanStyle?: boolean;
    accent?: string;
    activeIcon?: string;
    inactiveIcon?: string;
    barBackground?: string;
    barBorderColor?: string;
    topAccentColor?: string;
    topAccentHeight?: number;
    centerButtonIdle?: string;
    centerButtonLift?: number;
    centerButtonSize?: number;
    badgeColor?: string;
    barBorderRadius?: number;
    barShadow?: boolean;
  },
): PoleTabBarChrome {
  const flat = config.flatLayout ?? false;
  const clean = config.cleanStyle ?? flat;
  const accent = config.accent ?? palette.accent;
  return {
    layout: config.layout,
    flatLayout: flat,
    cleanStyle: clean,
    accent,
    activeIcon: config.activeIcon ?? (clean ? '#FAFAFA' : accent),
    inactiveIcon: config.inactiveIcon ?? (clean ? '#737373' : FLASH_INACTIVE),
    barBackground: config.barBackground ?? (clean ? '#000000' : FLASH_DOCK_BG),
    barBorderColor: config.barBorderColor ?? (clean ? 'rgba(255,255,255,0.12)' : FLASH_DOCK_BORDER),
    rootBackground: clean ? '#000000' : palette.background || '#000000',
    centerButtonIdle: config.centerButtonIdle ?? accent,
    centerButtonBorder: palette.accentSoft,
    centerButtonBorderWidth: flat ? 0 : 3,
    centerButtonLift: config.centerButtonLift ?? (flat ? 0 : -14),
    centerButtonSize: config.centerButtonSize ?? (flat ? 0 : 56),
    barBorderRadius: config.barBorderRadius ?? (clean ? 0 : config.layout === 'dock' ? 18 : 22),
    barBorderWidth: clean ? StyleSheetHairline : 1,
    topAccentColor: config.topAccentColor ?? accent,
    topAccentHeight: config.topAccentHeight ?? (clean ? 0 : flat ? 2 : 3),
    barShadow: config.barShadow ?? !clean,
    badgeColor: config.badgeColor ?? accent,
    overflowKicker: config.overflowKicker,
  };
}

/** hairline without importing StyleSheet into theme — numeric  StyleSheet.hairlineWidth ≈ 1/pixel ratio; use 0.5 */
const StyleSheetHairline = 0.5;

const HOMME_PALETTE: PolePalette = {
  accent: hommeColorOverrides.accent ?? '#4ADE80',
  brand: hommeColorOverrides.brand ?? '#4ADE80',
  ink: colors.ink,
  accentSoft: hommeColorOverrides.accentSoft,
  border: colors.border,
  borderStrong: hommeColorOverrides.borderStrong,
  surface: colors.surface,
  background: colors.background,
  textMuted: colors.textMuted,
  brandSoft: hommeColorOverrides.brandSoft,
};

const WOMAN_PALETTE: PolePalette = {
  accent: womanColorOverrides.accent,
  brand: womanColorOverrides.brand,
  ink: womanColorOverrides.ink,
  accentSoft: womanColorOverrides.accentSoft,
  border: womanColorOverrides.border,
  borderStrong: womanColorOverrides.borderStrong,
  surface: womanColorOverrides.surface,
  background: womanColorOverrides.background,
  textMuted: womanColorOverrides.textMuted,
  brandSoft: womanColorOverrides.brandSoft,
};

const AMATEUR_PALETTE: PolePalette = {
  ...amateurColorOverrides,
};

const SUPPORTER_PALETTE: PolePalette = {
  ...supporterColorOverrides,
};

const SANTE_PALETTE: PolePalette = {
  ...santeColorOverrides,
};

const PRO_PALETTE: PolePalette = {
  ...proColorOverrides,
};

const PRO_PLAYER_MALE_PALETTE: PolePalette = {
  ...PRO_PALETTE,
  accent: proPlayerMaleOverrides.accent,
  accentSoft: proPlayerMaleOverrides.accentSoft,
  border: proPlayerMaleOverrides.border,
  borderStrong: proPlayerMaleOverrides.borderStrong,
  brandSoft: proPlayerMaleOverrides.brandSoft,
  background: proPlayerMaleOverrides.background,
};

const PRO_PLAYER_FEMALE_PALETTE: PolePalette = {
  ...PRO_PALETTE,
  accent: proPlayerFemaleOverrides.accent,
  accentSoft: proPlayerFemaleOverrides.accentSoft,
  border: proPlayerFemaleOverrides.border,
  borderStrong: proPlayerFemaleOverrides.borderStrong,
  brand: proPlayerFemaleOverrides.brand,
  brandSoft: proPlayerFemaleOverrides.brandSoft,
  ink: proPlayerFemaleOverrides.ink,
  background: proPlayerFemaleOverrides.background,
};

const AMATEUR_FEMALE_PALETTE: PolePalette = {
  ...AMATEUR_PALETTE,
  ...amateurFemaleOverrides,
};

const AMATEUR_MINOR_PALETTE: PolePalette = {
  ...AMATEUR_PALETTE,
  ...amateurMinorOverrides,
};

const CHROME_BY_LINE: Record<ProductLineId, PoleTabBarChrome> = {
  homme: makeChrome(HOMME_PALETTE, {
    layout: 'pill',
    overflowKicker: 'PRO DAY MAN',
    accent: HOMME_PALETTE.accent,
    centerButtonIdle: HOMME_PALETTE.accent,
    topAccentColor: HOMME_PALETTE.accent,
  }),
  woman: makeChrome(WOMAN_PALETTE, {
    layout: 'pill',
    overflowKicker: 'PRO DAY WOMAN',
    centerButtonIdle: WOMAN_PALETTE.accent,
    centerButtonLift: -18,
    centerButtonSize: 58,
    topAccentColor: WOMAN_PALETTE.accent,
  }),
  amateur: makeChrome(AMATEUR_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Plus',
  }),
  supporter: makeChrome(SUPPORTER_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Tribune',
  }),
  sante: makeChrome(SANTE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Cabinet',
  }),
  pro: makeChrome(PRO_PALETTE, {
    layout: 'dock',
    flatLayout: false,
    cleanStyle: false,
    overflowKicker: 'Pro',
    centerButtonLift: -12,
    centerButtonSize: 54,
    topAccentColor: PRO_PALETTE.accent,
  }),
  pro_player: makeChrome(PRO_PLAYER_MALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Plus',
    accent: PRO_PLAYER_MALE_PALETTE.accent,
  }),
  pro_club: makeChrome(PRO_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Club',
    accent: '#38BDF8',
    activeIcon: '#FAFAFA',
  }),
  pro_staff: makeChrome(PRO_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Staff',
    accent: '#818CF8',
    activeIcon: '#FAFAFA',
  }),
  sponsor: makeChrome(
    {
      accent: '#D4AF37',
      brand: '#92700C',
      ink: '#FAFAF9',
      accentSoft: 'rgba(212, 175, 55, 0.12)',
      border: 'rgba(212, 175, 55, 0.22)',
      borderStrong: 'rgba(212, 175, 55, 0.4)',
      surface: '#0c0a06',
      background: '#070605',
      textMuted: '#A8A29E',
      brandSoft: 'rgba(212, 175, 55, 0.1)',
      surfaceMuted: '#14110a',
      accentLight: '#F5D76E',
    },
    {
      layout: 'dock',
      flatLayout: true,
      cleanStyle: true,
      overflowKicker: 'Sponsor',
      accent: '#D4AF37',
      activeIcon: '#FAFAFA',
    },
  ),
  parent: makeChrome(AMATEUR_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Famille',
    accent: '#0F766E',
  }),
};

const CHROME_BY_SEGMENT: Partial<Record<string, PoleTabBarChrome>> = {
  pro_player_male: makeChrome(PRO_PLAYER_MALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Plus',
    accent: PRO_PLAYER_MALE_PALETTE.accent,
  }),
  pro_player_female: makeChrome(PRO_PLAYER_FEMALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Plus',
    accent: PRO_PLAYER_FEMALE_PALETTE.accent,
  }),
  amateur_male: makeChrome(AMATEUR_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Plus',
  }),
  amateur_female: makeChrome(AMATEUR_FEMALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Plus',
    accent: AMATEUR_FEMALE_PALETTE.accent,
  }),
  amateur_minor: makeChrome(AMATEUR_MINOR_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    cleanStyle: true,
    overflowKicker: 'Plus',
    accent: AMATEUR_MINOR_PALETTE.accent,
  }),
};

export function getPoleTabBarChrome(
  productLine: ProductLineId,
  role?: UserRole | null,
  segment?: PlayerSegment | null,
): PoleTabBarChrome {
  let line = productLine;
  if (isProProductLine(productLine) && role === 'player') line = 'pro_player';
  else if (isProProductLine(productLine) && role === 'club') line = 'pro_club';
  else if (
    isProProductLine(productLine) &&
    role &&
    ['coach', 'agent', 'recruiter', 'organizer'].includes(role)
  ) {
    line = 'pro_staff';
  }

  const base = CHROME_BY_LINE[line] ?? CHROME_BY_LINE.homme;

  if (segment && role === 'player' && (line === 'pro_player' || line === 'amateur')) {
    const segmentKey = `${line}_${segment}`;
    const segmentChrome = CHROME_BY_SEGMENT[segmentKey];
    if (segmentChrome) return segmentChrome;
  }

  if (isMedicalPractitionerRole(role)) {
    // Même accent clair que le pôle Santé — MEDICAL_THEME.primary (#0F766E)
    // est trop sombre sur le dock FLASH noir.
    return {
      ...CHROME_BY_LINE.sante,
      overflowKicker: 'Santé',
    };
  }
  return base;
}

export function resolveTabBarAccent(
  productLine: ProductLineId,
  role: UserRole | null | undefined,
  appColors: AppColors,
  segment?: PlayerSegment | null,
): string {
  if (isMedicalPractitionerRole(role)) return santeColorOverrides.accent;
  return getPoleTabBarChrome(productLine, role, segment).accent ?? appColors.accent ?? FLASH_CYAN;
}
