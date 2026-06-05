/**
 * Assets logo ProDay — uniquement des fichiers présents dans assets/branding/.
 */
export const BRANDING_LOGOS = {
  light: require('../../assets/branding/logo-light.png'),
  dark: require('../../assets/branding/logo-dark.png'),
  transparent: require('../../assets/branding/logo-transparent-hero.png'),
  transparentDark: require('../../assets/branding/logo-transparent-dark.png'),
  authDark: require('../../assets/branding/logo-auth-dark.png'),
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

export type BrandingLogoKey = keyof typeof BRANDING_LOGOS;
