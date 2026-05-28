/** Assets logo ProDay — variantes avec fond transparent (détourage IA + traitement). */
export const BRANDING_LOGOS = {
  /** Fond blanc — usage legacy / export */
  light: require('../../assets/branding/logo-light.png'),
  /** Fond sombre plein — usage legacy */
  dark: require('../../assets/branding/logo-dark.png'),
  /** Transparent — hero sur photo / fond sombre */
  transparent: require('../../assets/branding/logo-transparent-hero.png'),
  /** Transparent — cartes et fonds clairs */
  transparentDark: require('../../assets/branding/logo-transparent-dark.png'),
  /** Picto seul — filigrane discret */
  mark: require('../../assets/branding/logo-mark-transparent.png'),
} as const;

export type BrandingLogoKey = keyof typeof BRANDING_LOGOS;
