import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { isMedicalPractitionerRole } from '../content/medicalExperience';
import { MEDICAL_THEME } from '../content/medicalExperience';
import { colors } from './designTokens';
import {
  hommeColorOverrides,
  proColorOverrides,
  type AppColors,
} from './universeTheme';
import { womanColorOverrides } from './prodayWomanTheme';
import { santeColorOverrides } from './prodaySanteTheme';

export type PoleTabBarLayout = 'pill' | 'dock';

export type PoleTabBarChrome = {
  layout: PoleTabBarLayout;
  accent: string;
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

const HOMME_CHROME: PoleTabBarChrome = {
  layout: 'pill',
  accent: hommeColorOverrides.borderStrong,
  centerButtonIdle: colors.ink,
  centerButtonBorder: colors.surface,
  centerButtonBorderWidth: 3,
  centerButtonLift: -14,
  centerButtonSize: 56,
  barBorderRadius: 20,
  barBorderWidth: 1,
  topAccentColor: hommeColorOverrides.borderStrong,
  topAccentHeight: 3,
  barShadow: true,
  badgeColor: colors.ink,
  overflowKicker: 'PÔLE JOUEUR',
};

const WOMAN_CHROME: PoleTabBarChrome = {
  layout: 'pill',
  accent: womanColorOverrides.accent,
  centerButtonIdle: womanColorOverrides.brand,
  centerButtonBorder: womanColorOverrides.accentSoft,
  centerButtonBorderWidth: 3,
  centerButtonLift: -18,
  centerButtonSize: 58,
  barBorderRadius: 24,
  barBorderWidth: 1,
  topAccentColor: womanColorOverrides.accent,
  topAccentHeight: 3,
  barShadow: true,
  badgeColor: womanColorOverrides.brand,
  overflowKicker: 'PÔLE WOMAN',
};

const PRO_CHROME: PoleTabBarChrome = {
  layout: 'dock',
  accent: proColorOverrides.accent,
  centerButtonIdle: proColorOverrides.ink,
  centerButtonBorder: '#FFFFFF',
  centerButtonBorderWidth: 2,
  centerButtonLift: -12,
  centerButtonSize: 54,
  barBorderRadius: 12,
  barBorderWidth: 1,
  topAccentColor: proColorOverrides.accent,
  topAccentHeight: 2,
  barShadow: false,
  badgeColor: proColorOverrides.ink,
  overflowKicker: 'PÔLE PRO',
};

const SANTE_CHROME: PoleTabBarChrome = {
  layout: 'pill',
  accent: santeColorOverrides.accent,
  centerButtonIdle: santeColorOverrides.ink,
  centerButtonBorder: santeColorOverrides.accentSoft,
  centerButtonBorderWidth: 3,
  centerButtonLift: -14,
  centerButtonSize: 56,
  barBorderRadius: 22,
  barBorderWidth: 1,
  topAccentColor: santeColorOverrides.accentLight,
  topAccentHeight: 3,
  barShadow: true,
  badgeColor: santeColorOverrides.ink,
  overflowKicker: 'PÔLE SANTÉ',
};

const CHROME_BY_LINE: Record<ProductLineId, PoleTabBarChrome> = {
  homme: HOMME_CHROME,
  woman: WOMAN_CHROME,
  pro: PRO_CHROME,
  sante: SANTE_CHROME,
};

export function getPoleTabBarChrome(
  productLine: ProductLineId,
  role?: UserRole | null,
): PoleTabBarChrome {
  const base = CHROME_BY_LINE[productLine] ?? HOMME_CHROME;
  if (isMedicalPractitionerRole(role)) {
    return {
      ...base,
      accent: MEDICAL_THEME.primary,
      centerButtonIdle: MEDICAL_THEME.primary,
      badgeColor: MEDICAL_THEME.primary,
      overflowKicker: 'PRATICIEN · SANTÉ',
    };
  }
  return base;
}

export function resolveTabBarAccent(
  productLine: ProductLineId,
  role: UserRole | null | undefined,
  appColors: AppColors,
): string {
  if (isMedicalPractitionerRole(role)) return MEDICAL_THEME.primary;
  return getPoleTabBarChrome(productLine, role).accent ?? appColors.accent;
}
