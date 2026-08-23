/**
 * Assets logo ProDay — identité officielle (symbole unique + déclinaisons).
 * Les anciens pictos pôle pointent vers le même symbole (1 Master Brand).
 */
export const PRODAY_OFFICIAL_LOGO = require('../../assets/branding/logo-proday-official.png');

/** Ratio largeur / hauteur du logo officiel splash/icon pad. */
export const PRODAY_OFFICIAL_LOGO_ASPECT = 1;

export const PRODAY_BRAND_ASSETS = {
  symbolWhite: require('../../assets/branding/proday-symbol-white.png'),
  symbolBlack: require('../../assets/branding/proday-symbol-black.png'),
  symbolMark: require('../../assets/branding/proday-symbol-mark.png'),
  logoMasterWhite: require('../../assets/branding/proday-logo-master-white.png'),
  logoMasterBlack: require('../../assets/branding/proday-logo-master-black.png'),
  appIcon: require('../../assets/branding/proday-app-icon.png'),
  splash: require('../../assets/branding/proday-splash.png'),
  notification: require('../../assets/branding/proday-notification-icon.png'),
} as const;

/** Logo principal ProDay — marque générique. */
export const BRANDING_LOGOS = {
  official: PRODAY_OFFICIAL_LOGO,
  light: PRODAY_BRAND_ASSETS.logoMasterBlack,
  dark: PRODAY_BRAND_ASSETS.logoMasterWhite,
  transparent: PRODAY_BRAND_ASSETS.logoMasterWhite,
  transparentDark: PRODAY_BRAND_ASSETS.logoMasterBlack,
  authDark: PRODAY_BRAND_ASSETS.logoMasterWhite,
  mark: require('../../assets/branding/logo-mark-transparent.png'),
} as const;

/** Symbole unique (compat anciens imports picto pôle). */
const MASTER_SYMBOL = PRODAY_BRAND_ASSETS.symbolWhite;
const MASTER_MARK = require('../../assets/branding/logo-mark-transparent.png');

/**
 * Pro Day for Women — même symbole master (accent via tokens / ProDayLogo).
 */
export const WOMAN_BRANDING_LOGOS = {
  picto: MASTER_SYMBOL,
  mark: MASTER_MARK,
  light: MASTER_SYMBOL,
  dark: MASTER_SYMBOL,
  transparent: MASTER_SYMBOL,
  transparentDark: MASTER_SYMBOL,
  authDark: MASTER_SYMBOL,
} as const;

export const MAN_BRANDING_LOGOS = {
  picto: MASTER_SYMBOL,
  mark: MASTER_MARK,
} as const;

/** @deprecated Utiliser MAN_BRANDING_LOGOS */
export const HOMME_BRANDING_LOGOS = MAN_BRANDING_LOGOS;

export const PRO_BRANDING_LOGOS = {
  picto: MASTER_SYMBOL,
  mark: MASTER_MARK,
} as const;

export const SANTE_BRANDING_LOGOS = {
  picto: MASTER_SYMBOL,
  mark: MASTER_MARK,
} as const;

export const AMATEUR_BRANDING_LOGOS = {
  picto: MASTER_SYMBOL,
  mark: MASTER_MARK,
} as const;

export const SUPPORTER_BRANDING_LOGOS = {
  picto: MASTER_SYMBOL,
  mark: MASTER_MARK,
} as const;

export const SPONSOR_BRANDING_LOGOS = {
  picto: MASTER_SYMBOL,
  mark: MASTER_MARK,
} as const;

export type BrandingLogoKey = keyof typeof BRANDING_LOGOS;
