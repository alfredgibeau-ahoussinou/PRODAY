/**
 * Identité officielle PRODAY — planche brand (P + ballon, or master).
 * Source de vérité couleurs marque (ne pas dupliquer les hex ailleurs).
 */

export const PRODAY_TAGLINE = 'CONNECTER. PROGRESSER. RÉVÉLER.';

export const PRODAY_MASTER = {
  /** Or / champagne — CTA master (pas bleu). */
  gold: '#C5A059',
  goldBright: '#E8B923',
  goldDeep: '#9A7B2F',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#A3A3A3',
  grayMuted: '#737373',
  surface: '#121218',
  surfaceAlt: '#0A0A0F',
} as const;

/** Accents officiels par pôle (planche brand). */
export const PRODAY_POLE_ACCENTS = {
  master: PRODAY_MASTER.gold,
  player: '#FFFFFF',
  joueur: '#FFFFFF',
  coach: '#C5A059',
  /**
   * Or de la charte de référence (captures du 15/09/2026) — **valeur mesurée au
   * pixel**, identique à l'octet dans les quatre captures fournies :
   * `rgb(248, 213, 72)` = `#F8D548`. Le contenu posé dessus est **noir**
   * (`#000000`, 20–29 % des pixels du FAB central) : un libellé blanc sur cet or
   * serait illisible (D-011).
   */
  club: '#F8D548',
  president: '#C5A059',
  parent: '#8CC63F',
  supporter: '#06B6D4',
  sponsor: '#92278F',
  admin: '#A3A3A3',
  events: '#F7941D',
  evenements: '#F7941D',
} as const;

export type ProDayBrandVariant = keyof typeof PRODAY_POLE_ACCENTS;

export const PRODAY_POLE_LABELS: Record<ProDayBrandVariant, string> = {
  master: '',
  player: 'JOUEUR',
  joueur: 'JOUEUR',
  coach: 'COACH',
  club: 'CLUB',
  president: 'PRÉSIDENT',
  parent: 'PARENT',
  supporter: 'SUPPORTER',
  sponsor: 'SPONSOR',
  admin: 'ADMIN',
  events: 'ÉVÉNEMENTS',
  evenements: 'ÉVÉNEMENTS',
};

export function poleAccent(variant: ProDayBrandVariant = 'master'): string {
  return PRODAY_POLE_ACCENTS[variant] ?? PRODAY_POLE_ACCENTS.master;
}

export function poleAccentSoft(variant: ProDayBrandVariant = 'master', alpha = 0.14): string {
  const hex = poleAccent(variant).replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function poleAccentMuted(variant: ProDayBrandVariant = 'master', alpha = 0.32): string {
  return poleAccentSoft(variant, alpha);
}

/** Encre sur fond accent pôle (CTA, chips). */
export function poleOnAccent(variant: ProDayBrandVariant = 'master'): string {
  switch (variant) {
    case 'player':
    case 'joueur':
    case 'coach':
    case 'parent':
    case 'master':
    case 'president':
    case 'events':
    case 'evenements':
      return PRODAY_MASTER.black;
    /**
     * Pôle Club : l'or `#F8D548` est **clair** — un libellé blanc dessus tombe
     * autour de 1,4:1 de contraste. La référence y pose du noir (mesuré : 20 à
     * 29 % des pixels du FAB central sont `#000000`), soit ~15:1. D-011.
     */
    case 'club':
      return PRODAY_MASTER.black;
    default:
      return PRODAY_MASTER.white;
  }
}

/** Mappe lignes produit / rôles app → variante brand. */
export function brandVariantForProductLine(
  line?: string | null,
  opts?: { sponsor?: boolean; role?: string | null },
): ProDayBrandVariant {
  if (opts?.sponsor || line === 'sponsor' || opts?.role === 'sponsor') return 'sponsor';
  if (line === 'parent' || opts?.role === 'parent') return 'parent';
  if (line === 'supporter') return 'supporter';
  if (line === 'pro_club' || opts?.role === 'club') return 'club';
  if (line === 'pro_staff' || line === 'pro' || opts?.role === 'coach') return 'coach';
  if (line === 'pro_player' || line === 'amateur' || line === 'homme' || line === 'woman') {
    return 'player';
  }
  if (opts?.role === 'admin') return 'admin';
  if (opts?.role === 'president') return 'president';
  if (line === 'sante') return 'master';
  return 'master';
}

/** Ratio symbole HD (white PNG — assets/branding/.generated-meta.json). */
export const PRODAY_SYMBOL_ASPECT = 566 / 518;

/** Ratio lockup empilé symbole (72 %) + wordmark natif. */
export const PRODAY_LOGO_MASTER_ASPECT = 1 / (0.72 / PRODAY_SYMBOL_ASPECT + 0.32);

/** Ratio lockup horizontal symbole (34 %) + PRODAY · POLE. */
export const PRODAY_LOGO_HORIZONTAL_ASPECT = 1 / (0.34 / PRODAY_SYMBOL_ASPECT);
