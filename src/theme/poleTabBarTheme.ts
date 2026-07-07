import type { ProductLineId } from '../models/ProductLine';
import { isProProductLine } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { isMedicalPractitionerRole, MEDICAL_THEME } from '../content/medicalExperience';
import { colors } from './designTokens';
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

function makeChrome(
  palette: PolePalette,
  config: {
    overflowKicker: string;
    layout: PoleTabBarLayout;
    flatLayout?: boolean;
    accent?: string;
    activeIcon?: string;
    barBackground?: string;
    barBorderColor?: string;
    topAccentColor?: string;
    centerButtonIdle?: string;
    centerButtonLift?: number;
    centerButtonSize?: number;
    badgeColor?: string;
  },
): PoleTabBarChrome {
  const flat = config.flatLayout ?? false;
  const accent = config.accent ?? palette.accent;
  return {
    layout: config.layout,
    flatLayout: flat,
    accent,
    activeIcon: config.activeIcon ?? accent,
    inactiveIcon: palette.textMuted,
    barBackground: config.barBackground ?? palette.brandSoft,
    barBorderColor: config.barBorderColor ?? palette.border,
    rootBackground: palette.background,
    centerButtonIdle: config.centerButtonIdle ?? palette.ink,
    centerButtonBorder: palette.accentSoft,
    centerButtonBorderWidth: flat ? 0 : 3,
    centerButtonLift: config.centerButtonLift ?? (flat ? 0 : -14),
    centerButtonSize: config.centerButtonSize ?? (flat ? 0 : 56),
    barBorderRadius: config.layout === 'dock' ? 16 : 22,
    barBorderWidth: 1,
    topAccentColor: config.topAccentColor ?? palette.borderStrong,
    topAccentHeight: flat ? 2 : 3,
    barShadow: true,
    badgeColor: config.badgeColor ?? palette.brand,
    overflowKicker: config.overflowKicker,
  };
}

const HOMME_PALETTE: PolePalette = {
  accent: '#15803D',
  brand: colors.ink,
  ink: colors.ink,
  accentSoft: hommeColorOverrides.accentSoft,
  border: hommeColorOverrides.border,
  borderStrong: hommeColorOverrides.borderStrong,
  surface: '#FFFFFF',
  background: hommeColorOverrides.background,
  textMuted: '#64748B',
  brandSoft: '#FFFFFF',
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
    centerButtonIdle: colors.ink,
    barBackground: HOMME_PALETTE.surface,
  }),
  woman: makeChrome(WOMAN_PALETTE, {
    layout: 'pill',
    overflowKicker: 'PRO DAY WOMAN',
    centerButtonIdle: WOMAN_PALETTE.brand,
    centerButtonLift: -18,
    centerButtonSize: 58,
    barBackground: WOMAN_PALETTE.surface,
    topAccentColor: WOMAN_PALETTE.accent,
  }),
  amateur: makeChrome(AMATEUR_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO DAY AMATEUR',
    topAccentColor: AMATEUR_PALETTE.accent,
    barBorderColor: AMATEUR_PALETTE.borderStrong,
  }),
  supporter: makeChrome(SUPPORTER_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'TRIBUNE SUPPORTER',
    topAccentColor: SUPPORTER_PALETTE.accent,
    barBorderColor: SUPPORTER_PALETTE.borderStrong,
  }),
  sante: makeChrome(SANTE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO DAY SANTÉ',
    topAccentColor: SANTE_PALETTE.accentLight ?? SANTE_PALETTE.accent,
    barBorderColor: SANTE_PALETTE.borderStrong,
  }),
  pro: makeChrome(PRO_PALETTE, {
    layout: 'dock',
    flatLayout: false,
    overflowKicker: 'PRO DAY PRO',
    centerButtonLift: -12,
    centerButtonSize: 54,
    barBackground: PRO_PALETTE.surface,
    topAccentColor: PRO_PALETTE.accent,
  }),
  pro_player: makeChrome(PRO_PLAYER_MALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO JOUEUR',
    accent: PRO_PLAYER_MALE_PALETTE.accent,
    topAccentColor: '#3B82F6',
    barBackground: PRO_PLAYER_MALE_PALETTE.brandSoft,
    barBorderColor: '#BFDBFE',
  }),
  pro_club: makeChrome(PRO_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO CLUB',
    accent: '#1E3A8A',
    centerButtonIdle: '#1E3A8A',
    topAccentColor: '#1E3A8A',
    barBackground: '#EFF6FF',
    barBorderColor: '#93C5FD',
  }),
  pro_staff: makeChrome(PRO_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO STAFF',
    accent: '#1D4ED8',
    topAccentColor: '#2563EB',
    barBackground: PRO_PALETTE.surfaceMuted ?? PRO_PALETTE.brandSoft,
    barBorderColor: '#BFDBFE',
  }),
};

const CHROME_BY_SEGMENT: Partial<Record<string, PoleTabBarChrome>> = {
  pro_player_male: makeChrome(PRO_PLAYER_MALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO JOUEUR',
    accent: PRO_PLAYER_MALE_PALETTE.accent,
    topAccentColor: '#3B82F6',
    barBackground: PRO_PLAYER_MALE_PALETTE.brandSoft,
    barBorderColor: '#BFDBFE',
  }),
  pro_player_female: makeChrome(PRO_PLAYER_FEMALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO JOUEUSE',
    accent: PRO_PLAYER_FEMALE_PALETTE.accent,
    activeIcon: PRO_PLAYER_FEMALE_PALETTE.accent,
    centerButtonIdle: PRO_PLAYER_FEMALE_PALETTE.ink,
    topAccentColor: PRO_PLAYER_FEMALE_PALETTE.accent,
    barBackground: PRO_PLAYER_FEMALE_PALETTE.brandSoft,
    barBorderColor: PRO_PLAYER_FEMALE_PALETTE.border,
    badgeColor: PRO_PLAYER_FEMALE_PALETTE.brand,
  }),
  amateur_male: makeChrome(AMATEUR_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'PRO DAY AMATEUR',
    topAccentColor: AMATEUR_PALETTE.accent,
    barBorderColor: AMATEUR_PALETTE.borderStrong,
  }),
  amateur_female: makeChrome(AMATEUR_FEMALE_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'AMATEUR FÉMININ',
    accent: AMATEUR_FEMALE_PALETTE.accent,
    topAccentColor: AMATEUR_FEMALE_PALETTE.accent,
    barBackground: AMATEUR_FEMALE_PALETTE.brandSoft,
    barBorderColor: AMATEUR_FEMALE_PALETTE.borderStrong,
    badgeColor: AMATEUR_FEMALE_PALETTE.brand,
  }),
  amateur_minor: makeChrome(AMATEUR_MINOR_PALETTE, {
    layout: 'dock',
    flatLayout: true,
    overflowKicker: 'AMATEUR JEUNES',
    accent: AMATEUR_MINOR_PALETTE.accent,
    topAccentColor: AMATEUR_MINOR_PALETTE.accent,
    barBackground: AMATEUR_MINOR_PALETTE.brandSoft,
    barBorderColor: AMATEUR_MINOR_PALETTE.borderStrong,
    badgeColor: AMATEUR_MINOR_PALETTE.brand,
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
    return {
      ...CHROME_BY_LINE.sante,
      accent: MEDICAL_THEME.primary,
      activeIcon: MEDICAL_THEME.primary,
      centerButtonIdle: MEDICAL_THEME.primary,
      badgeColor: MEDICAL_THEME.primary,
      overflowKicker: 'CABINET SANTÉ',
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
  if (isMedicalPractitionerRole(role)) return MEDICAL_THEME.primary;
  return getPoleTabBarChrome(productLine, role, segment).accent ?? appColors.accent;
}
