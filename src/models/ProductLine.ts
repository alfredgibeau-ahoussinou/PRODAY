/** Ligne produit — pôles carousel + legacy homme/woman/pro. */
export type ProductLineId =
  | 'homme'
  | 'woman'
  | 'amateur'
  | 'supporter'
  | 'sante'
  /** @deprecated Stockage legacy — migré vers pro_player | pro_club | pro_staff */
  | 'pro'
  | 'pro_player'
  | 'pro_club'
  | 'pro_staff';

export type ProductLineExperienceAlias = ProductLineId;

/** @deprecated Alias stockage — migré vers homme */
export type LegacyProductLineId = 'standard';

export const PRODUCT_LINE_STORAGE_KEY = 'proday_product_line';
export const WOMAN_SPACE_ACTIVE_KEY = 'proday_woman_space_active';

export const PRODAY_HOMME_BRAND = {
  name: 'Pro Day Man',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Man',
  tagline: 'CONNECTER • PROGRESSER • RÉUSSIR',
  shortTagline: 'Le foot masculin amateur, par Pro Day',
  entryCta: 'For men',
} as const;

/** Alias lisible — même ligne produit que homme */
export const PRODAY_MAN_BRAND = PRODAY_HOMME_BRAND;

export const PRODAY_WOMAN_BRAND = {
  name: 'Pro Day for Women',
  logoLine1: 'Pro Day',
  logoLine2Lead: 'For ',
  logoLine2Accent: 'Women',
  tagline: 'JOUER • BRILLER • GRANDIR',
  shortTagline: 'Le foot au féminin, par ProDay',
  entryCta: 'For women',
} as const;

export const PRODAY_AMATEUR_BRAND = {
  name: 'Pro Day Amateur',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Amateur',
  tagline: 'JOUER • ENCADRER • PARTAGER',
  shortTagline: 'Joueurs et coachs amateur — Mercato local, matchs et effectif',
  entryCta: 'Espace Amateur',
} as const;

export const PRODAY_SUPPORTER_BRAND = {
  name: 'Pro Day Supporter',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Supporter',
  tagline: 'SUIVRE • VIBRER • PARTAGER',
  shortTagline: 'Fans et communauté — matchs, réels et fil en direct',
  entryCta: 'Espace Supporter',
} as const;

export const PRODAY_PRO_BRAND = {
  name: 'Pro Day Pro',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Pro',
  tagline: 'EXPERTISE • RÉSEAU • PERFORMANCE',
  shortTagline: 'Coach, agent et staff — l’écosystème pro du foot',
  entryCta: 'Espace Pro',
} as const;

export const PRODAY_PRO_PLAYER_BRAND = {
  name: 'Pro Day Pro Joueur',
  logoLine1: 'Pro Day',
  logoLine2Lead: 'Pro ',
  logoLine2Accent: 'Joueur',
  tagline: 'CARRIÈRE • OPPORTUNITÉS • PERFORMANCE',
  shortTagline: 'Joueur professionnel — carrière, portfolio et groupe',
  entryCta: 'Espace Pro Joueur',
} as const;

export const PRODAY_PRO_CLUB_BRAND = {
  name: 'Pro Day Pro Club',
  logoLine1: 'Pro Day',
  logoLine2Lead: 'Pro ',
  logoLine2Accent: 'Club',
  tagline: 'STRUCTURE • RECRUTEMENT • CALENDRIER',
  shortTagline: 'Club et structure — équipes, recrutement et communication',
  entryCta: 'Espace Club',
} as const;

export const PRODAY_PRO_STAFF_BRAND = {
  name: 'Pro Day Pro Staff',
  logoLine1: 'Pro Day',
  logoLine2Lead: 'Pro ',
  logoLine2Accent: 'Staff',
  tagline: 'MANDATS • SCOUTING • ENCADREMENT',
  shortTagline: 'Coach, agent, recruteur et organisateur',
  entryCta: 'Espace Staff',
} as const;

export const PRODAY_SPONSOR_BRAND = {
  name: 'Pro Day Sponsor',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Sponsor',
  tagline: 'VISIBILITÉ • MESURE • IMPACT',
  shortTagline: 'Marques et sponsors — campagnes géo, ROI et vitrine vérifiée',
  entryCta: 'Espace Sponsor',
} as const;

export const PRODAY_SANTE_BRAND = {
  name: 'Pro Day Santé',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Santé',
  tagline: 'SOIGNER • ACCOMPAGNER • PERFORMER',
  shortTagline: 'Kiné, médecin et staff médical — l’écosystème santé du foot',
  entryCta: 'Espace Santé',
} as const;

/** @deprecated Utiliser PRODAY_WOMAN_BRAND */
export const PRODAY_GIRL_BRAND = PRODAY_WOMAN_BRAND;

export function isWomanProductLine(line: ProductLineId): boolean {
  return line === 'woman';
}

export function isHommeProductLine(line: ProductLineId): boolean {
  return line === 'homme';
}

export function isAmateurProductLine(line: ProductLineId): boolean {
  return line === 'amateur';
}

export function isSupporterProductLine(line: ProductLineId): boolean {
  return line === 'supporter';
}

export function isProProductLine(line: ProductLineId): boolean {
  return (
    line === 'pro' ||
    line === 'pro_player' ||
    line === 'pro_club' ||
    line === 'pro_staff'
  );
}

/**
 * Préparation split Pro (phase light) :
 * - pro_club : structure club
 * - pro_staff : coach/agent/recruiter/organizer
 * - pro_player : réservé future extension
 */
export type ProProductSegment = 'pro_club' | 'pro_staff' | 'pro_player';

export function resolveProProductSegmentFromRole(
  role: string | null | undefined
): ProProductSegment {
  if (role === 'club') return 'pro_club';
  if (role === 'coach' || role === 'agent' || role === 'recruiter' || role === 'organizer') {
    return 'pro_staff';
  }
  return 'pro_player';
}

export function isSanteProductLine(line: ProductLineId): boolean {
  return line === 'sante';
}

/** @deprecated */
export function isGirlProductLine(line: ProductLineId): boolean {
  return isWomanProductLine(line);
}

export function normalizeStoredProductLine(stored: string | null): ProductLineId | null {
  if (stored === 'woman' || stored === 'girl') return 'woman';
  if (stored === 'pro_player') return 'pro_player';
  if (stored === 'pro_club') return 'pro_club';
  if (stored === 'pro_staff') return 'pro_staff';
  if (stored === 'pro') return 'pro';
  if (stored === 'amateur') return 'amateur';
  if (stored === 'supporter') return 'supporter';
  if (stored === 'sante' || stored === 'health') return 'sante';
  if (stored === 'homme' || stored === 'standard') return 'homme';
  return null;
}

export function brandForProductLine(line: ProductLineId) {
  if (line === 'woman') return PRODAY_WOMAN_BRAND;
  if (line === 'pro_player') return PRODAY_PRO_PLAYER_BRAND;
  if (line === 'pro_club') return PRODAY_PRO_CLUB_BRAND;
  if (line === 'pro_staff') return PRODAY_PRO_STAFF_BRAND;
  if (line === 'pro') return PRODAY_PRO_BRAND;
  if (line === 'amateur') return PRODAY_AMATEUR_BRAND;
  if (line === 'supporter') return PRODAY_SUPPORTER_BRAND;
  if (line === 'sante') return PRODAY_SANTE_BRAND;
  return PRODAY_HOMME_BRAND;
}

/** Étend un Record partiel pro avec pro_player, pro_club, pro_staff (valeur `pro`). */
export function withProFamilyRecord<T>(
  map: Record<string, T> & { pro: T },
): Record<ProductLineId, T> {
  const { pro } = map;
  return {
    ...map,
    pro_player: pro,
    pro_club: pro,
    pro_staff: pro,
  } as Record<ProductLineId, T>;
}
