/**
 * PRODAY — Registre des Partenaires & Codes d'Affiliation Instantanés
 * 
 * Permet aux clubs partenaires (Tremplin Foot, US Val-de-Fontenay, US Rungis, Villeneuve Academy)
 * et à leurs coachs/éducateurs de rejoindre ou créer leur espace à la vitesse de l'éclair
 * sans friction ni recherche fastidieuse, grâce à des codes uniques dédiés.
 */

import type { OfficialFffClub } from './fffOfficialRegistry.service';

export interface ClubAffiliationCodeConfig {
  /** Code structure / club officiel (revendication & gestion du club) */
  clubCode: string;
  /** Code coach officiel (attribué par le club aux éducateurs & entraîneurs) */
  coachCode: string;
  /** Codes alternatifs acceptés (ex: numéro d'affiliation FFF direct ou variations minuscules/majuscules) */
  aliases: string[];
  /** Nom officiel du club */
  clubName: string;
  /** Ville */
  city: string;
  /** Département */
  department: string;
  /** Code postal */
  postalCode: string;
  /** Numéro d'affiliation FFF officiel certifié */
  fffNumber: string;
  /** Identifiant ligue FFF ProDay */
  fffLeagueId?: string;
  /** Libellé division */
  divisionLabel?: string;
  /** URL ou chemin du blason */
  logoUrl?: string;
  /** Catégories pré-configurées du club pour sélection éclair */
  defaultCategories: string[];
  /** Badges / label de partenariat */
  partnershipBadge: string;
  /** Rôle de validation automatique pour les coachs qui détiennent ce code */
  coachAutoValidate: boolean;
}

export interface ResolvedClubAffiliation {
  club: ClubAffiliationCodeConfig;
  matchedType: 'coach' | 'club';
  codeUsed: string;
}

export const OFFICIAL_PARTNER_CLUBS: ClubAffiliationCodeConfig[] = [
  {
    clubCode: 'TF-CLUB-2026',
    coachCode: 'TF-COACH-7842',
    aliases: ['TREMPLIN-91', 'TREMPLIN', 'TREMPLIN-FOOT', '551586', 'TF91'],
    clubName: 'Tremplin Foot Corbeil-Essonnes',
    city: 'Corbeil-Essonnes',
    department: '91',
    postalCode: '91100',
    fffNumber: '551586',
    fffLeagueId: 'd1_d91',
    divisionLabel: "District de l'Essonne FFF",
    logoUrl: '/branding/partners/tremplin-foot.png',
    defaultCategories: [
      'U14 Régional',
      'U15 Régional',
      'U16 Régional',
      'U17 D1',
      'U18 D1',
      'Seniors D1',
      'École de Foot U10-U13',
    ],
    partnershipBadge: 'Club Partenaire Officiel ProDay',
    coachAutoValidate: true,
  },
  {
    clubCode: 'VF-CLUB-2026',
    coachCode: 'VF-COACH-9134',
    aliases: [
      'FONTENAY-94',
      'VAL-DE-FONTENAY',
      'VALDEFONTENAY',
      'US-VAL-DE-FONTENAY',
      'USVALDEFONTENAY',
      'US-FONTENAY',
      'USFONTENAY',
      'FONTENAY',
      '535208',
      '523873',
      'USVF',
      'USVF-94',
      'VDF94',
      'VF94',
    ],
    clubName: 'US Val-de-Fontenay',
    city: 'Fontenay-sous-Bois',
    department: '94',
    postalCode: '94120',
    fffNumber: '535208',
    fffLeagueId: 'd1_d94',
    divisionLabel: 'District du Val-de-Marne FFF',
    logoUrl: '/branding/partners/val-de-fontenay.png',
    defaultCategories: [
      'U14 D1',
      'U15 D1',
      'U16 D1',
      'U17 D1',
      'U18 D1',
      'Seniors D1',
      'Seniors D2',
      'Vétérans',
    ],
    partnershipBadge: 'Club Formateur Partenaire ProDay',
    coachAutoValidate: true,
  },
  {
    clubCode: 'RU-CLUB-2026',
    coachCode: 'RU-COACH-5521',
    aliases: ['RUNGIS-94', 'US-RUNGIS', 'USRUNGIS', '507502', 'USR94'],
    clubName: 'US Rungis',
    city: 'Rungis',
    department: '94',
    postalCode: '94150',
    fffNumber: '507502',
    fffLeagueId: 'd1_d94',
    divisionLabel: 'District du Val-de-Marne FFF',
    logoUrl: '/branding/partners/us-rungis.png',
    defaultCategories: [
      'U14 Régional',
      'U15 D1',
      'U16 D1',
      'U17 Régional',
      'U18 D1',
      'Seniors R2',
      'Seniors R3',
      'Seniors D1',
      'Féminines Seniors',
    ],
    partnershipBadge: 'Club Partenaire Officiel ProDay',
    coachAutoValidate: true,
  },
  {
    clubCode: 'VA-CLUB-2026',
    coachCode: 'VA-COACH-4281',
    aliases: ['VILLENEUVE-92', 'VILLENEUVE', 'VILLENEUVE-ACADEMY', '548920', 'VAFC'],
    clubName: 'Villeneuve Academy',
    city: 'Villeneuve-la-Garenne',
    department: '92',
    postalCode: '92390',
    fffNumber: '548920',
    fffLeagueId: 'd1_d92',
    divisionLabel: 'District des Hauts-de-Seine FFF',
    logoUrl: '/branding/partners/villeneuve-academy.png',
    defaultCategories: [
      'Académie U13',
      'Académie U15',
      'Académie U17',
      'Formation Spécifique',
    ],
    partnershipBadge: 'Académie Partenaire Football ProDay',
    coachAutoValidate: true,
  },
  {
    clubCode: 'LM-CLUB-2026',
    coachCode: 'LM-COACH-7726',
    aliases: [
      'LE-MEE-77',
      'LE-MEE',
      'LEMEE',
      'LE-MEE-SUR-SEINE',
      'LEMEE-SUR-SEINE',
      'LMSF',
      'LMSF-77',
      '525582',
      'LM77',
      'MEE-77',
      'LEMEE-FOOT',
    ],
    clubName: 'Le Mée Sports Football',
    city: 'Le Mée-sur-Seine',
    department: '77',
    postalCode: '77350',
    fffNumber: '525582',
    fffLeagueId: 'd1_d77',
    divisionLabel: 'District de Seine-et-Marne FFF',
    logoUrl: '/branding/partners/le-mee-sports.png',
    defaultCategories: [
      'U14 Régional',
      'U15 Régional',
      'U16 Régional',
      'U17 D1',
      'U18 D1',
      'Seniors R1',
      'Seniors R2',
      'Seniors D1',
      'École de Foot U10-U13',
    ],
    partnershipBadge: 'Club Partenaire Officiel ProDay',
    coachAutoValidate: true,
  },
  {
    clubCode: 'USO-CLUB-2026',
    coachCode: 'USO-COACH-5101',
    aliases: [
      'ORMESSON-94',
      'ORMESSON',
      'US-ORMESSON',
      'USORMESSON',
      'US-ORMESSON-FOOTBALL',
      'USORMESSONFOOTBALL',
      'USO',
      'USO-94',
      'USOF',
      '510193',
      'BETA-ORMESSON',
      'CLUB-ORMESSON',
    ],
    clubName: 'US Ormesson Football',
    city: 'Ormesson-sur-Marne',
    department: '94',
    postalCode: '94490',
    fffNumber: '510193',
    fffLeagueId: 'd2_d94_b',
    divisionLabel: 'District du Val-de-Marne FFF (D2)',
    logoUrl: '/branding/partners/us-ormesson.png',
    defaultCategories: [
      'U14 D1',
      'U15 D1',
      'U16 D1',
      'U17 D1',
      'U18 D1',
      'Seniors D1',
      'Seniors D2',
      'Vétérans',
    ],
    partnershipBadge: 'Club Bêta-Testeur Officiel ProDay',
    coachAutoValidate: true,
  },
];

/**
 * Normalise un code saisi par l'utilisateur (majuscules, suppression espaces et tirets optionnels).
 */
export function normalizeClubCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}

/**
 * Recherche et résout un code club ou coach avec distinction de rôle.
 */
export function resolvePartnerAffiliation(
  codeOrAlias: string,
  expectedRole?: 'coach' | 'club' | 'player' | 'parent',
): ResolvedClubAffiliation | null {
  const norm = normalizeClubCode(codeOrAlias);
  if (!norm) return null;

  for (const club of OFFICIAL_PARTNER_CLUBS) {
    // 1. Match code coach dédié (ex: TF-COACH-7842)
    if (normalizeClubCode(club.coachCode) === norm) {
      if (expectedRole && expectedRole !== 'coach') {
        // Le code coach est strictement réservé au rôle coach
        return null;
      }
      return { club, matchedType: 'coach', codeUsed: club.coachCode };
    }

    // 2. Match code club / structure dédié (ex: TF-CLUB-2026)
    if (normalizeClubCode(club.clubCode) === norm) {
      return { club, matchedType: 'club', codeUsed: club.clubCode };
    }

    // 3. Match alias historique / N° FFF
    const matchingAlias = club.aliases.some((alias) => normalizeClubCode(alias) === norm);
    if (matchingAlias) {
      return { club, matchedType: expectedRole === 'coach' ? 'coach' : 'club', codeUsed: norm };
    }
  }

  return null;
}

/**
 * Recherche et résout la configuration officielle d'un club partenaire par code unique ou alias.
 */
export function resolvePartnerClubByCode(
  codeOrAlias: string,
  expectedRole?: 'coach' | 'club' | 'player' | 'parent',
): ClubAffiliationCodeConfig | null {
  const res = resolvePartnerAffiliation(codeOrAlias, expectedRole);
  return res ? res.club : null;
}

/**
 * Convertit la configuration partenaire en objet OfficialFffClub compatible avec l'inscription.
 */
export function partnerClubToOfficialClub(cfg: ClubAffiliationCodeConfig): OfficialFffClub {
  return {
    id: `fff_${cfg.fffNumber}`,
    name: cfg.clubName,
    fffNumber: cfg.fffNumber,
    city: cfg.city,
    postalCode: cfg.postalCode,
    department: cfg.department,
    region: 'Île-de-France',
    league: cfg.divisionLabel || 'Ligue de Paris Île-de-France',
    categories: cfg.defaultCategories,
    logoUrl: cfg.logoUrl,
    source: 'fff_dofa',
  };
}

export const partnerClubsService = {
  /**
   * Résout un code unique de club ou retourne null si non reconnu.
   */
  resolveCode(code: string, expectedRole?: 'coach' | 'club' | 'player' | 'parent'): ClubAffiliationCodeConfig | null {
    return resolvePartnerClubByCode(code, expectedRole);
  },

  /**
   * Résout en détail le code avec le rôle associé (club ou coach).
   */
  resolveAffiliation(
    code: string,
    expectedRole?: 'coach' | 'club' | 'player' | 'parent',
  ): ResolvedClubAffiliation | null {
    return resolvePartnerAffiliation(code, expectedRole);
  },

  /**
   * Obtient tous les clubs partenaires répertoriés.
   */
  listPartners(): ClubAffiliationCodeConfig[] {
    return OFFICIAL_PARTNER_CLUBS;
  },

  /**
   * Vérifie si un numéro d'affiliation correspond à un club partenaire ProDay.
   */
  getByFffNumber(fffNumber: string): ClubAffiliationCodeConfig | null {
    const clean = fffNumber.trim();
    if (!clean) return null;
    return OFFICIAL_PARTNER_CLUBS.find((c) => c.fffNumber === clean) ?? null;
  },
};
