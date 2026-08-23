/**
 * Identité officielle PRODAY — 1 Master Brand + accents pôle.
 * Source de vérité couleurs marque (ne pas dupliquer les hex ailleurs).
 */

export const PRODAY_MASTER = {
  /** Bleu historique marque mère */
  blue: '#0054F0',
  blueBright: '#4C8BFF',
  blueDeep: '#001F6B',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#A3A3A3',
  grayMuted: '#737373',
  surface: '#141414',
  surfaceAlt: '#0A0A0A',
} as const;

/** Accents officiels par pôle (planche brand). */
export const PRODAY_POLE_ACCENTS = {
  master: PRODAY_MASTER.blue,
  player: '#1E3AFF',
  joueur: '#1E3AFF',
  coach: '#22C55E',
  club: '#7C3AED',
  president: '#FBBF24',
  parent: '#F97316',
  supporter: '#06B6D4',
  sponsor: '#EF4444',
  admin: '#A3A3A3',
  events: '#6366F1',
  evenements: '#6366F1',
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

/** Ratio symbole extrait (white PNG). */
export const PRODAY_SYMBOL_ASPECT = 369 / 259;

/** Ratio logo master symbole + wordmark. */
export const PRODAY_LOGO_MASTER_ASPECT = 637 / 375;
