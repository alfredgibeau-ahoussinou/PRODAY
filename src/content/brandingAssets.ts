/**
 * Assets logo ProDay — uniquement des fichiers présents dans assets/branding/.
 */
export const PRODAY_OFFICIAL_LOGO = require('../../assets/branding/logo-proday-official.png');

/** Ratio largeur / hauteur du logo officiel (1024×961). */
export const PRODAY_OFFICIAL_LOGO_ASPECT = 1024 / 961;

/** Logo principal ProDay — marque générique (pas les pictos pôle). */
export const BRANDING_LOGOS = {
  official: PRODAY_OFFICIAL_LOGO,
  light: PRODAY_OFFICIAL_LOGO,
  dark: PRODAY_OFFICIAL_LOGO,
  transparent: PRODAY_OFFICIAL_LOGO,
  transparentDark: PRODAY_OFFICIAL_LOGO,
  authDark: PRODAY_OFFICIAL_LOGO,
  mark: require('../../assets/branding/logo-mark-transparent.png'),
} as const;

/**
 * Pro Day for Women — picto P rose (mark).
 * Le mot-symbole est composé en natif via `WomanLogo`.
 */
export const WOMAN_BRANDING_LOGOS = {
  picto: require('../../assets/branding/logo-woman-picto.png'),
  mark: require('../../assets/branding/logo-woman-mark-transparent.png'),
  /** @deprecated Utiliser picto + WomanLogo — conservé pour compat. */
  light: require('../../assets/branding/logo-woman-picto.png'),
  dark: require('../../assets/branding/logo-woman-picto.png'),
  transparent: require('../../assets/branding/logo-woman-picto.png'),
  transparentDark: require('../../assets/branding/logo-woman-picto.png'),
  authDark: require('../../assets/branding/logo-woman-picto.png'),
} as const;

/** Pro Day Man — picto P anthracite. Libellé via `ManLogo`. */
export const MAN_BRANDING_LOGOS = {
  picto: require('../../assets/branding/logo-man-picto.png'),
  mark: require('../../assets/branding/logo-man-mark-transparent.png'),
} as const;

/** @deprecated Utiliser MAN_BRANDING_LOGOS */
export const HOMME_BRANDING_LOGOS = MAN_BRANDING_LOGOS;

/** Pro Day Pro — picto P bleu vif. Libellé via `ProLogo`. */
export const PRO_BRANDING_LOGOS = {
  picto: require('../../assets/branding/logo-pro-picto.png'),
  mark: require('../../assets/branding/logo-pro-mark-transparent.png'),
} as const;

/** Pro Day Santé — picto P teal. Libellé via `SanteLogo`. */
export const SANTE_BRANDING_LOGOS = {
  picto: require('../../assets/branding/logo-sante-picto.png'),
  mark: require('../../assets/branding/logo-sante-mark-transparent.png'),
} as const;

/** Pro Day Amateur — picto P orange. Libellé via `AmateurLogo`. */
export const AMATEUR_BRANDING_LOGOS = {
  picto: require('../../assets/branding/logo-amateur-picto.png'),
  mark: require('../../assets/branding/logo-amateur-mark-transparent.png'),
} as const;

/** Pro Day Supporter — picto P violet. Libellé via `SupporterLogo`. */
export const SUPPORTER_BRANDING_LOGOS = {
  picto: require('../../assets/branding/logo-supporter-picto.png'),
  mark: require('../../assets/branding/logo-supporter-mark-transparent.png'),
} as const;

/** Pro Day Sponsor — picto P or (#D4AF37). Libellé via `SponsorLogo`. */
export const SPONSOR_BRANDING_LOGOS = {
  picto: require('../../assets/branding/logo-sponsor-picto.png'),
  mark: require('../../assets/branding/logo-sponsor-mark-transparent.png'),
} as const;

export type BrandingLogoKey = keyof typeof BRANDING_LOGOS;
