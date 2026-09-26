/**
 * PRODAY — Service de Rapprochement Équipe-Compétition & Validation d'Exactitude FFF
 * 
 * Garantit l'intégrité sportive et l'exactitude des classements affichés :
 * 1. Rapprochement multi-attributs (Club, affiliation FFF, équipe, désignation 1/2/réserve, catégorie d'âge, genre, saison, district/ligue, poule).
 * 2. Non-confusion stricte entre équipes premières et équipes réserves.
 * 3. Validation formelle des 7 règles d'intégrité avant acceptation d'un tableau officiel.
 * 4. Préservation stricte des positions officielles publiées (ne jamais recalculer par simple tri de points).
 * 5. Refus catégorique des données fictives ou substituées : état « Classement non encore vérifié » honnête (DATA-01).
 */

import type { Club } from '../models/Club';
import type { Team } from '../models/Team';
import type { LeagueStandingRow } from '../components/matchs/EliteLeagueStandings';
import type { FrenchLeagueData } from './frenchFootballStandings.service';

export type TeamDesignation = '1' | '2' | '3' | 'other';

export interface TeamMatchingContext {
  clubId?: string;
  clubName?: string;
  fffAffiliationNumber?: string;
  teamId?: string;
  teamName: string;
  category?: string;
  genderScope?: 'men' | 'women' | 'mixed' | 'unspecified';
  designation?: TeamDesignation;
  season: string;
  leagueId?: string;
  divisionLabel?: string;
  groupLabel?: string;
  districtCode?: string;
}

export interface TableValidationResult {
  isValid: boolean;
  matchedRow: LeagueStandingRow | null;
  errors: string[];
  warnings: string[];
}

export interface ResolvedTeamCompetition {
  clubName: string;
  fffAffiliationNumber?: string;
  teamName: string;
  category: string;
  genderScope: 'men' | 'women' | 'mixed';
  designation: TeamDesignation;
  season: string;
  leagueId: string | null;
  divisionLabel: string;
  groupLabel?: string;
  districtCode?: string;
  sourceUrl?: string;
  verificationStatus: 'verified' | 'unverified' | 'pending_selection';
  verificationReason?: string;
  lastSyncAt?: string;
}

/**
 * Normalise une chaîne pour comparaison robuste (casse, accents, espaces, tirets).
 */
export function normalizeSportName(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Détermine si le nom d'une équipe ou d'un club indique une équipe réserve ou première.
 */
export function extractTeamDesignation(teamName: string, category?: string): {
  baseName: string;
  designation: TeamDesignation;
} {
  const norm = normalizeSportName(teamName);
  const normCat = category ? normalizeSportName(category) : '';

  // Détection explicite 3 / C
  if (/\b(3|c|iii)\b/.test(norm) || /\b(equipe 3|seniors 3)\b/.test(norm)) {
    const base = norm.replace(/\b(3|c|iii|equipe 3|seniors 3)\b/g, '').trim();
    return { baseName: base, designation: '3' };
  }

  // Détection explicite 2 / B / Réserve
  if (
    /\b(2|b|ii|reserve|seniors 2|seniors b|equipe 2)\b/.test(norm) ||
    /\b(reserve|b)\b/.test(normCat)
  ) {
    const base = norm.replace(/\b(2|b|ii|reserve|seniors 2|seniors b|equipe 2)\b/g, '').trim();
    return { baseName: base, designation: '2' };
  }

  // Détection explicite 1 / A / Première
  if (/\b(1|a|i|premiere|seniors 1|seniors a|equipe 1)\b/.test(norm)) {
    const base = norm.replace(/\b(1|a|i|premiere|seniors 1|seniors a|equipe 1)\b/g, '').trim();
    return { baseName: base, designation: '1' };
  }

  return { baseName: norm, designation: '1' };
}

/**
 * Discrimination stricte entre équipe première et équipe réserve pour une ligne de classement.
 */
export function matchesTeamDesignation(rowName: string, expectedDesignation: TeamDesignation): boolean {
  const normRow = normalizeSportName(rowName);
  const isReserve3 = /\b(3|c|iii)\b/.test(normRow);
  const isReserve2 = !isReserve3 && /\b(2|b|ii|reserve)\b/.test(normRow);
  const isFirstTeam = !isReserve2 && !isReserve3;

  if (expectedDesignation === '3') return isReserve3;
  if (expectedDesignation === '2') return isReserve2;
  return isFirstTeam;
}

/**
 * Rapprochement précis du nom d'équipe dans un tableau FFF officiel.
 */
export function matchTeamInStandings(
  rows: LeagueStandingRow[],
  criteria: {
    teamName?: string;
    clubName?: string;
    designation?: TeamDesignation;
  },
): LeagueStandingRow | null {
  if (!rows || rows.length === 0) return null;
  const designation = criteria.designation ?? '1';

  const candidatesNames: string[] = [];
  if (criteria.teamName) candidatesNames.push(criteria.teamName);
  if (criteria.clubName) candidatesNames.push(criteria.clubName);

  for (const candidate of candidatesNames) {
    const { baseName } = extractTeamDesignation(candidate);
    const normBase = normalizeSportName(baseName);
    if (!normBase || normBase.length < 3) continue;

    for (const row of rows) {
      const normRow = normalizeSportName(row.name);
      // 1. L'équipe doit correspondre sur le nom de club
      const includesName = normRow.includes(normBase) || normBase.includes(normRow);
      if (!includesName) continue;

      // 2. L'équipe doit impérativement respecter la désignation (équipe 1 vs réserve)
      if (matchesTeamDesignation(row.name, designation)) {
        return row;
      }
    }
  }

  return null;
}

/**
 * Vérifie la compatibilité de catégorie d'âge et de genre entre une équipe et une compétition.
 */
export function checkSportingCompatibility(
  teamCategory: string | undefined,
  teamGender: 'men' | 'women' | 'mixed' | 'unspecified' | undefined,
  leagueName: string,
  divisionLabel: string,
): { compatible: boolean; reason?: string } {
  const normContext = normalizeSportName(`${leagueName} ${divisionLabel}`);
  const normCat = normalizeSportName(teamCategory || '');

  // 1. Contrôle du genre
  const isLeagueWomen = normContext.includes('feminin') || normContext.includes('feminine') || normContext.includes('feminines') || normContext.includes('d1 fem') || normContext.includes('d2 fem') || normContext.includes('arkema');
  if (teamGender === 'women' && !isLeagueWomen && !normContext.includes('mixte')) {
    return {
      compatible: false,
      reason: `Incompatibilité de genre : L'équipe est Féminine mais la compétition "${divisionLabel}" est un championnat Masculin.`,
    };
  }
  if (teamGender === 'men' && isLeagueWomen) {
    return {
      compatible: false,
      reason: `Incompatibilité de genre : L'équipe est Masculine mais la compétition "${divisionLabel}" est un championnat Féminin.`,
    };
  }

  // 2. Contrôle des Vétérans
  const isTeamVeterans = normCat.includes('veteran') || normCat.includes('ancien');
  const isLeagueVeterans = normContext.includes('veteran') || normContext.includes('ancien');
  if (isTeamVeterans && !isLeagueVeterans) {
    return {
      compatible: false,
      reason: `Incompatibilité de catégorie : L'équipe est Vétérans mais la compétition "${divisionLabel}" est réservée aux Seniors.`,
    };
  }
  if (!isTeamVeterans && isLeagueVeterans) {
    return {
      compatible: false,
      reason: `Incompatibilité de catégorie : L'équipe n'est pas Vétérans mais la compétition "${divisionLabel}" est un championnat Vétérans.`,
    };
  }

  // 3. Contrôle des catégories Jeunes (U19, U17, U15...)
  const youthMatch = normCat.match(/\bu(\d{2})\b/);
  if (youthMatch) {
    const age = youthMatch[1];
    const isMatchingYouthLeague = normContext.includes(`u${age}`) || normContext.includes(`u ${age}`);

    // Si la compétition est pour une autre tranche d'âge jeune (ex: U19 vs U17)
    const leagueYouthMatch = normContext.match(/\bu(\d{2})\b/);
    if (leagueYouthMatch && leagueYouthMatch[1] !== age) {
      return {
        compatible: false,
        reason: `Incompatibilité de catégorie : L'équipe est U${age} mais la compétition "${divisionLabel}" est un championnat U${leagueYouthMatch[1]}.`,
      };
    }

    const isSeniorLeague = normContext.includes('seniors') || normContext.includes('regional 1') || normContext.includes('regional 2') || normContext.includes('national 1') || normContext.includes('national 2') || normContext.includes('national 3');

    if (isSeniorLeague && !isMatchingYouthLeague) {
      return {
        compatible: false,
        reason: `Incompatibilité de catégorie : L'équipe est U${age} mais la compétition "${divisionLabel}" est un championnat Seniors.`,
      };
    }
  }

  return { compatible: true };
}

/**
 * Valide l'exactitude d'un tableau de classement FFF selon les 7 règles d'intégrité sportive.
 */
export function validateStandingsTable(
  table: FrenchLeagueData,
  expectedTeam: TeamMatchingContext,
): TableValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Règle 1 : Concordance de saison
  if (table.season && expectedTeam.season && table.season !== expectedTeam.season) {
    errors.push(`Divergence de saison : Tableau de la saison ${table.season} alors que l'équipe est sur ${expectedTeam.season}.`);
  }

  // Règle 2 : Concordance sportive (Catégorie d'âge & Genre)
  const compat = checkSportingCompatibility(
    expectedTeam.category,
    expectedTeam.genderScope,
    table.name,
    table.divisionLabel,
  );
  if (!compat.compatible && compat.reason) {
    errors.push(compat.reason);
  }

  // Règle 3 : Présence de lignes dans le groupe
  if (!table.standings || table.standings.length === 0) {
    errors.push('Le tableau de classement ne contient aucune ligne de données.');
    return { isValid: false, matchedRow: null, errors, warnings };
  }

  // Règle 4 : Discrimination stricte et présence de l'équipe exacte
  const designation = expectedTeam.designation ?? extractTeamDesignation(expectedTeam.teamName, expectedTeam.category).designation;
  const matchedRow = matchTeamInStandings(table.standings, {
    teamName: expectedTeam.teamName,
    clubName: expectedTeam.clubName,
    designation,
  });

  if (!matchedRow) {
    // Si l'équipe n'est pas trouvée dans la poule, c'est un mismatch d'affectation
    warnings.push(`L'équipe "${expectedTeam.teamName}" (${designation === '1' ? 'Équipe 1' : `Équipe ${designation}`}) n'apparaît pas dans la poule "${table.divisionLabel}".`);
  }

  // Règle 5 : Intégrité de la hiérarchie officielle (Rangs croissants sans doublon non justifié)
  let prevRank = 0;
  for (let i = 0; i < table.standings.length; i++) {
    const row = table.standings[i];
    if (typeof row.rank !== 'number' || row.rank < 1) {
      errors.push(`Ligne ${i + 1} (${row.name}) possède un rang officiel invalide (${row.rank}).`);
      break;
    }
    if (row.rank < prevRank) {
      errors.push(`Les positions officielles ne sont pas monotones (rang ${row.rank} après rang ${prevRank}).`);
      break;
    }
    prevRank = row.rank;
  }

  // Règle 6 : Cohérence des statistiques sportives de chaque club
  for (const row of table.standings) {
    const sumMatches = row.won + row.drawn + row.lost;
    if (row.played > 0 && sumMatches !== row.played) {
      warnings.push(`Statistiques de match divergentes pour ${row.name} (MJ: ${row.played} vs V+N+D: ${sumMatches}).`);
      break;
    }
    const computedDiff = row.goals_for - row.goals_against;
    if (row.goal_diff !== computedDiff) {
      warnings.push(`Différence de buts divergente pour ${row.name} (indiquée: ${row.goal_diff}, calculée: ${computedDiff}).`);
      break;
    }
  }

  // Règle 7 : Source et traçabilité
  if (!table.sourceUrl && !table.source) {
    warnings.push('Aucune URL de publication officielle ni identifiant source n\'est rattaché à ce tableau.');
  }

  const isValid = errors.length === 0;
  return { isValid, matchedRow, errors, warnings };
}

/**
 * Résout le contexte officiel complet d'une équipe pour le matching FFF.
 */
export function resolveTeamCompetition(
  team: Team,
  club: Club | null,
  targetSeason = '2026-2027',
): ResolvedTeamCompetition {
  const clubName = club?.name || 'Club';
  const fffAffiliationNumber = club?.fff_affiliation_number;
  const category = team.category || 'Seniors';
  const genderScope = team.gender_scope === 'unspecified' ? 'men' : team.gender_scope;
  const { designation } = extractTeamDesignation(team.name, category);
  const season = team.fff_season || targetSeason;

  // Si l'équipe a un identifiant officiel explicite
  if (team.fff_league_id) {
    const divisionLabel = team.fff_division_label || team.fff_league_id;
    // Vérification de compatibilité catégorie/genre
    const compat = checkSportingCompatibility(category, genderScope, divisionLabel, divisionLabel);
    if (!compat.compatible) {
      return {
        clubName,
        fffAffiliationNumber,
        teamName: team.name,
        category,
        genderScope,
        designation,
        season,
        leagueId: null,
        divisionLabel: 'Affectation officielle incompatible',
        districtCode: team.fff_district_code,
        verificationStatus: 'unverified',
        verificationReason: compat.reason,
      };
    }

    return {
      clubName,
      fffAffiliationNumber,
      teamName: team.name,
      category,
      genderScope,
      designation,
      season,
      leagueId: team.fff_league_id,
      divisionLabel,
      groupLabel: team.fff_group_label,
      districtCode: team.fff_district_code,
      verificationStatus: 'verified',
    };
  }

  // Pas de rattachement officiel confirmé
  return {
    clubName,
    fffAffiliationNumber,
    teamName: team.name,
    category,
    genderScope,
    designation,
    season,
    leagueId: null,
    divisionLabel: 'Classement non encore vérifié',
    verificationStatus: 'unverified',
    verificationReason: `Aucune compétition officielle FFF homologuée n'a été rattachée à cette équipe (${team.name} · ${category}).`,
  };
}

/**
 * Construit un objet FrenchLeagueData honnête d'attente de vérification (DATA-01).
 * Aucun classement ni buteur fictif n'est inventé.
 */
export function buildUnverifiedLeagueData(
  leagueId: string,
  divisionLabel: string,
  reason: string,
  season = '2026-2027',
): FrenchLeagueData {
  return {
    id: leagueId,
    name: divisionLabel,
    category: 'district',
    divisionLabel,
    season,
    standings: [],
    scorers: [],
    source: 'unverified',
    officialFffCertified: false,
    syncStatus: 'unavailable',
    syncHealth: 'unavailable',
    lastError: reason,
  };
}

export const standingsVerificationService = {
  normalizeSportName,
  extractTeamDesignation,
  matchesTeamDesignation,
  matchTeamInStandings,
  checkSportingCompatibility,
  validateStandingsTable,
  resolveTeamCompetition,
  buildUnverifiedLeagueData,
};
