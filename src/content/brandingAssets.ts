/**
 * Assets logo ProDay — identité officielle (P + ballon, planche brand).
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
  lockupHorizontalWhite: require('../../assets/branding/proday-lockup-horizontal-white.png'),
  lockupHorizontalBlack: require('../../assets/branding/proday-lockup-horizontal-black.png'),
  appIcon: require('../../assets/branding/proday-app-icon.png'),
  splash: require('../../assets/branding/proday-splash.png'),
  notification: require('../../assets/branding/proday-notification-icon.png'),
  polePlayer: require('../../assets/branding/proday-symbol-pole-player.png'),
  poleCoach: require('../../assets/branding/proday-symbol-pole-coach.png'),
  poleClub: require('../../assets/branding/proday-symbol-pole-club.png'),
  poleParent: require('../../assets/branding/proday-symbol-pole-parent.png'),
  poleSponsor: require('../../assets/branding/proday-symbol-pole-sponsor.png'),
  poleEvents: require('../../assets/branding/proday-symbol-pole-events.png'),
  polePresident: require('../../assets/branding/proday-symbol-pole-president.png'),
  poleSupporter: require('../../assets/branding/proday-symbol-pole-supporter.png'),
  poleAdmin: require('../../assets/branding/proday-symbol-pole-admin.png'),
} as const;

/** Symbole teinté par variante brand (master = blanc/noir selon tone). */
export function poleSymbolAsset(
  variant: keyof typeof PRODAY_POLE_SYMBOL_MAP,
  tone: 'white' | 'black' = 'white',
): number {
  if (variant === 'master') {
    return tone === 'black'
      ? PRODAY_BRAND_ASSETS.symbolBlack
      : PRODAY_BRAND_ASSETS.symbolWhite;
  }
  const asset = PRODAY_POLE_SYMBOL_MAP[variant];
  if (asset) return asset;
  return tone === 'black' ? PRODAY_BRAND_ASSETS.symbolBlack : PRODAY_BRAND_ASSETS.symbolWhite;
}

const PRODAY_POLE_SYMBOL_MAP = {
  master: PRODAY_BRAND_ASSETS.symbolWhite,
  player: PRODAY_BRAND_ASSETS.polePlayer,
  joueur: PRODAY_BRAND_ASSETS.polePlayer,
  coach: PRODAY_BRAND_ASSETS.poleCoach,
  club: PRODAY_BRAND_ASSETS.poleClub,
  president: PRODAY_BRAND_ASSETS.polePresident,
  parent: PRODAY_BRAND_ASSETS.poleParent,
  supporter: PRODAY_BRAND_ASSETS.poleSupporter,
  sponsor: PRODAY_BRAND_ASSETS.poleSponsor,
  admin: PRODAY_BRAND_ASSETS.poleAdmin,
  events: PRODAY_BRAND_ASSETS.poleEvents,
  evenements: PRODAY_BRAND_ASSETS.poleEvents,
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
const MASTER_MARK = PRODAY_BRAND_ASSETS.symbolMark;

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
