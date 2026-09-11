/** Ligne produit — pôles carousel + legacy homme/woman/pro. */
export type ProductLineId =
  | 'homme'
  | 'woman'
  | 'amateur'
  | 'supporter'
  | 'sante'
  | 'sponsor'
  /** Portail parent / tuteur — supervision d’un compte mineur lié. */
  | 'parent'
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
/** Parent connecté en visite temporaire sur le scaffold Supporter. */
export const PARENT_GUEST_SUPPORTER_KEY = 'proday_parent_guest_supporter';

export const PRODAY_HOMME_BRAND = {
  name: 'Pro Day Man',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Man',
  tagline: 'CONNECTER. PROGRESSER. RÉVÉLER.',
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
  name: 'Pro Day Joueur',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Joueur',
  tagline: 'CLUB • PROGRESSER • JOUER',
  shortTagline:
    'Les outils des clubs structurés, pour le football amateur et semi-pro',
  entryCta: 'Espace Joueur',
} as const;

export const PRODAY_JOUEUR_BRAND = PRODAY_AMATEUR_BRAND;

export const PRODAY_SUPPORTER_BRAND = {
  name: 'Pro Day Supporter',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Supporter',
  tagline: 'SUIVRE • VIBRER • PARTAGER',
  shortTagline: 'Fans et communauté. Matchs, réels et fil en direct',
  entryCta: 'Espace Supporter',
} as const;

export const PRODAY_PRO_BRAND = {
  name: 'Pro Day Coach',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Coach',
  tagline: 'TACTIQUE • EFFECTIF • PERFORMANCE',
  shortTagline: 'Pôle Coach. Tactique IA, IA et gestion d’équipes',
  entryCta: 'Espace Coach',
} as const;

export const PRODAY_PRO_PLAYER_BRAND = {
  name: 'Pro Day Joueur',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Joueur',
  tagline: 'CLUB • PROGRESSER • JOUER',
  shortTagline:
    'Profil, stats et progression — du district au haut niveau, sans changer d’app',
  entryCta: 'Espace Joueur',
} as const;

export const PRODAY_PRO_CLUB_BRAND = {
  name: 'Pro Day Club',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Club',
  tagline: 'STRUCTURE • ÉQUIPES • ÉCOSYSTÈME',
  shortTagline:
    'Cœur de ProDay. Équipes, licenciés, compétitions, covoiturage et permissions',
  entryCta: 'Espace Club',
} as const;

/** Branding carousel / chrome — même product_line `pro_club`, shell Président. */
export const PRODAY_PRESIDENT_BRAND = {
  name: 'Pro Day Président',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Président',
  tagline: 'DIRECTION • STRATÉGIE • PRESTIGE',
  shortTagline:
    'Cockpit exécutif du club. Pilotage, finances et décisions — lié au Pôle Club',
  entryCta: 'Espace Président',
} as const;

export const PRODAY_PRO_STAFF_BRAND = {
  name: 'Pro Day Coach',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Coach',
  tagline: 'TACTIQUE • CONVOCATIONS • IA',
  shortTagline:
    'Profil coach rattaché au club. Tactique IA, préparation match et effectif',
  entryCta: 'Espace Coach',
} as const;

/** Alias marketing — même ligne produit que pro_staff. */
export const PRODAY_COACH_BRAND = PRODAY_PRO_STAFF_BRAND;

export const PRODAY_SPONSOR_BRAND = {
  name: 'Pro Day Sponsor',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Sponsor',
  tagline: 'VISIBILITÉ • ROI • TERRAIN',
  shortTagline: 'Marques et sponsors. Campagnes géo, ROI et vitrine vérifiée',
  entryCta: 'Espace Sponsor',
} as const;

export const PRODAY_SANTE_BRAND = {
  name: 'Pro Day Santé',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Santé',
  tagline: 'SOIGNER • ACCOMPAGNER • PERFORMER',
  shortTagline:
    'Rôle médical intégré (pas un pôle). Annuaire, agenda et téléconsultation',
  entryCta: 'Espace Santé',
} as const;

export const PRODAY_PARENT_BRAND = {
  name: 'Pro Day Parent',
  logoLine1: 'Pro Day',
  logoLine2Lead: '',
  logoLine2Accent: 'Parent',
  tagline: 'SUPERVISER • PROTÉGER • ACCOMPAGNER',
  shortTagline: 'Pôle Parent. Profil, messages, agenda et trajets de votre enfant',
  entryCta: 'Espace Parent',
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

export function isSponsorProductLine(line: ProductLineId): boolean {
  return line === 'sponsor';
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
  if (role === 'coach' || role === 'agent' || role === 'recruiter') {
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
  if (stored === 'sponsor') return 'sponsor';
  if (stored === 'sante' || stored === 'health') return 'sante';
  if (stored === 'parent' || stored === 'famille') return 'parent';
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
  if (line === 'sponsor') return PRODAY_SPONSOR_BRAND;
  if (line === 'sante') return PRODAY_SANTE_BRAND;
  if (line === 'parent') return PRODAY_PARENT_BRAND;
  return PRODAY_HOMME_BRAND;
}

export function isParentProductLine(line: ProductLineId): boolean {
  return line === 'parent';
}

/** Étend un Record partiel pro avec pro_player, pro_club, pro_staff (+ sponsor / parent optionnels). */
export function withProFamilyRecord<T>(
  map: Record<string, T> & { pro: T; sponsor?: T; parent?: T },
): Record<ProductLineId, T> {
  const { pro, sponsor, parent } = map;
  return {
    ...map,
    pro_player: pro,
    pro_club: pro,
    pro_staff: pro,
    sponsor: sponsor ?? pro,
    parent: parent ?? map.amateur ?? map.supporter ?? pro,
  } as Record<ProductLineId, T>;
}
