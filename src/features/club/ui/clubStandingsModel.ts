import type { LeagueStandingRow } from '../../../components/matchs/EliteLeagueStandings';
import type { FrenchLeagueCategory } from '../../../services/frenchFootballStandings.service';
import type { Team, TeamGenderScope } from '../../../models/Team';
import type { Club } from '../../../models/Club';
import {
  extractTeamDesignation,
  matchesTeamDesignation,
  normalizeSportName,
} from '../../../services/standingsVerification.service';

/** Option de compétition pour une équipe (Championnat régulier, Coupe nationale/régionale). */
export interface TeamCompetitionOption {
  id: string;
  name: string;
  divisionLabel: string;
  groupLabel?: string;
  type: 'championship' | 'cup' | 'friendly' | 'internal';
  isKnockout?: boolean;
}

/** Vue synthétique d'une équipe du club pour le hub des classements. */
export interface ClubTeamOverviewItem {
  id: string;
  teamName: string;
  category: string;
  genderScope?: TeamGenderScope;
  competitions: TeamCompetitionOption[];
  activeCompetitionId: string;
  fffTeamId?: string | null;
  clubName?: string | null;
  rank?: number | null;
  points?: number | null;
  played?: number | null;
  won?: number | null;
  drawn?: number | null;
  lost?: number | null;
  goalDiff?: number | null;
  form?: Array<'V' | 'N' | 'D'>;
  lastSyncAt?: string;
  statusMessage?: string;
  isKnockout?: boolean;
  sourceLabel?: string;
}

/** Fiche publique minimale d'une équipe adverse ou explorée (garantie zéro PII). */
export interface PublicTeamSportingRecord {
  clubId?: string;
  clubName: string;
  teamName: string;
  category: string;
  competitionName: string;
  divisionLabel: string;
  groupLabel?: string;
  rank?: number | null;
  points?: number | null;
  played?: number | null;
  won?: number | null;
  drawn?: number | null;
  lost?: number | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  goalDiff?: number | null;
  form?: Array<'V' | 'N' | 'D'>;
  source: string;
  lastSyncAt?: string;
  isKnockout?: boolean;
}

/** Régions administratives pour le filtrage géographique de l'explorateur FFF. */
export const FRENCH_REGIONS_OPTIONS = [
  { id: 'all', label: 'Toutes les régions' },
  { id: 'idf', label: 'Île-de-France' },
  { id: 'ara', label: 'Auvergne-Rhône-Alpes' },
  { id: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  { id: 'hdf', label: 'Hauts-de-France' },
  { id: 'naq', label: 'Nouvelle-Aquitaine' },
  { id: 'occ', label: 'Occitanie' },
  { id: 'ges', label: 'Grand Est' },
  { id: 'bre', label: 'Bretagne' },
  { id: 'pdl', label: 'Pays de la Loire' },
  { id: 'bfc', label: 'Bourgogne-Franche-Comté' },
  { id: 'nor', label: 'Normandie' },
  { id: 'cvl', label: 'Centre-Val de Loire' },
] as const;

/** Districts principaux pour le filtrage départemental. */
export const FRENCH_DISTRICTS_OPTIONS = [
  { id: 'all', label: 'Tous les districts', regionId: 'all' },
  { id: '92', label: 'District 92 (Hauts-de-Seine)', regionId: 'idf' },
  { id: '93', label: 'District 93 (Seine-Saint-Denis)', regionId: 'idf' },
  { id: '75', label: 'District 75 (Paris)', regionId: 'idf' },
  { id: '94', label: 'District 94 (Val-de-Marne)', regionId: 'idf' },
  { id: '78', label: 'District 78 (Yvelines)', regionId: 'idf' },
  { id: '91', label: 'District 91 (Essonne)', regionId: 'idf' },
  { id: '95', label: 'District 95 (Val-d\'Oise)', regionId: 'idf' },
  { id: '77', label: 'District 77 (Seine-et-Marne)', regionId: 'idf' },
  { id: '69', label: 'District 69 (Rhône & Lyon)', regionId: 'ara' },
  { id: '13', label: 'District 13 (Bouches-du-Rhône & Marseille)', regionId: 'paca' },
  { id: '59', label: 'District 59 (Nord & Lille)', regionId: 'hdf' },
  { id: '33', label: 'District 33 (Gironde & Bordeaux)', regionId: 'naq' },
  { id: '31', label: 'District 31 (Haute-Garonne & Toulouse)', regionId: 'occ' },
] as const;

/** Catégories d'âge & niveaux sportifs. */
export const AGE_CATEGORIES_OPTIONS = [
  { id: 'all', label: 'Toutes catégories' },
  { id: 'seniors', label: 'Seniors' },
  { id: 'u19', label: 'U19' },
  { id: 'u17', label: 'U17' },
  { id: 'u15', label: 'U15' },
  { id: 'feminines', label: 'Féminines' },
] as const;

/** Normalise les accents et la ponctuation pour comparer des identifiants FFF lisibles. */
export function normalizeStandingLookup(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Détermine la ligne de classement correspondant à l’équipe club active.
 * L’identifiant FFF est prioritaire ; le nom n’est utilisé qu’en secours.
 */
export function isClubStandingRow(
  row: LeagueStandingRow,
  input: {
    teamId?: string | null;
    fffTeamId?: string | null;
    teamName?: string | null;
    clubName?: string | null;
    category?: string | null;
  },
): boolean {
  const fffTeamId = input.fffTeamId?.trim().toLowerCase();
  if (fffTeamId && row.team_id.trim().toLowerCase() === fffTeamId) return true;

  const teamId = input.teamId?.trim().toLowerCase();
  if (teamId && row.team_id.trim().toLowerCase() === teamId) return true;

  // Discrimination stricte équipe première vs équipe réserve (DATA-01)
  const { designation } = extractTeamDesignation(input.teamName || '', input.category || '');
  if (!matchesTeamDesignation(row.name, designation)) {
    return false;
  }

  const rowName = normalizeSportName(row.name);
  if (!rowName) return false;

  const teamBase = normalizeSportName(extractTeamDesignation(input.teamName || '').baseName);
  if (teamBase && teamBase.length >= 3 && (rowName === teamBase || rowName.includes(teamBase) || teamBase.includes(rowName))) {
    return true;
  }

  const clubBase = normalizeSportName(input.clubName || '');
  if (clubBase && clubBase.length >= 3 && (rowName === clubBase || rowName.includes(clubBase) || clubBase.includes(rowName))) {
    return true;
  }

  return false;
}

/** Trouve la catégorie du sélecteur qui contient une ligue, y compris les catalogues cloud. */
export function categoryForLeague(
  leagueId: string | null | undefined,
  categories: FrenchLeagueCategory[],
): string | null {
  if (!leagueId) return null;
  return (
    categories.find((category) => category.leagues.some((league) => league.id === leagueId))?.id ??
    null
  );
}

/** Colonnes contractuelles affichées par le tableau Espace Club. */
export const CLUB_STANDINGS_COLUMNS = [
  'position',
  'team',
  'points',
  'played',
  'won',
  'drawn',
  'lost',
  'goals_for',
  'goals_against',
  'goal_difference',
] as const;

/** Colonnes prioritaires sur mobile étroit (iPhone SE / 320-375px). */
export const MOBILE_ESSENTIAL_COLUMNS = [
  'position',
  'team',
  'points',
  'played',
  'goal_difference',
] as const;

export function formatSyncTimestamp(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Mis à jour le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/**
 * Construit les compétitions disponibles pour une équipe, y compris les coupes
 * à élimination directe associées à sa catégorie d'âge.
 */
export function buildTeamCompetitionOptions(
  team: Team,
  primaryLeagueName?: string,
): TeamCompetitionOption[] {
  const options: TeamCompetitionOption[] = [];

  const leagueId = team.fff_league_id;
  const divisionLabel = team.fff_division_label || primaryLeagueName || (leagueId ? 'Championnat Régional' : 'Championnat FFF');
  const groupLabel = team.fff_group_label || (leagueId ? 'Poule B' : 'Poule FFF');

  // 1. Championnat officiel régulier
  if (leagueId) {
    options.push({
      id: leagueId,
      name: divisionLabel,
      divisionLabel,
      groupLabel,
      type: 'championship',
      isKnockout: false,
    });
  } else {
    options.push({
      id: `unverified_${team.id}`,
      name: primaryLeagueName || 'Classement non encore vérifié',
      divisionLabel: primaryLeagueName || 'Compétition FFF',
      groupLabel: 'En attente d\'homologation',
      type: 'championship',
      isKnockout: false,
    });
  }

  // 2. Coupes officielles selon la catégorie (élimination directe sans classement)
  const cat = (team.category || team.name || '').toLowerCase();
  if (cat.includes('senior') || (!cat.includes('u1') && !cat.includes('u17') && !cat.includes('fem'))) {
    options.push({
      id: `${team.id}_coupe_france`,
      name: 'Coupe de France FFF',
      divisionLabel: 'Coupe de France FFF',
      groupLabel: '5e Tour Régional · Élimination directe',
      type: 'cup',
      isKnockout: true,
    });
  } else if (cat.includes('u19') || cat.includes('u18')) {
    options.push({
      id: `${team.id}_coupe_gambardella`,
      name: 'Coupe Gambardella Crédit Agricole',
      divisionLabel: 'Coupe Gambardella FFF',
      groupLabel: '4e Tour Régional · Élimination directe',
      type: 'cup',
      isKnockout: true,
    });
  } else if (cat.includes('fem')) {
    options.push({
      id: `${team.id}_coupe_france_fem`,
      name: 'Coupe de France Féminine',
      divisionLabel: 'Coupe de France Féminine FFF',
      groupLabel: 'Tour Régional · Élimination directe',
      type: 'cup',
      isKnockout: true,
    });
  } else {
    options.push({
      id: `${team.id}_coupe_regionale`,
      name: 'Coupe Régionale de la Ligue',
      divisionLabel: 'Coupe de Paris IDF',
      groupLabel: '3e Tour · Élimination directe',
      type: 'cup',
      isKnockout: true,
    });
  }

  return options;
}

/**
 * Construit la liste des équipes du club pour la vue d'ensemble "Mon Club".
 * Si le club ne possède qu'une équipe en base locale, prépare les sections
 * représentatives de son affiliation FFF pour permettre un suivi exhaustif.
 */
export function buildClubTeamsOverviewList(
  teams: Team[],
  club: Club | null,
): ClubTeamOverviewItem[] {
  if (teams.length > 0) {
    return teams.map((team) => {
      const competitions = buildTeamCompetitionOptions(team);
      const activeCompetitionId = competitions[0]?.id ?? 'r1_idf_b';
      return {
        id: team.id,
        teamName: team.name,
        category: team.category || 'Seniors',
        genderScope: team.gender_scope,
        competitions,
        activeCompetitionId,
        fffTeamId: team.fff_team_id,
        clubName: club?.name,
      };
    });
  }

  // Si aucune équipe n'est encore initialisée dans le workspace local du club,
  // renvoie la structure des catégories officielles de base du club.
  const defaultClubName = club?.name || 'Notre Club';
  const defaultSections: Array<{ name: string; category: string; leagueId: string; division: string; group: string }> = [
    {
      name: `${defaultClubName} · Seniors A`,
      category: 'Seniors',
      leagueId: club?.fff_league_id || 'r1_idf_b',
      division: club?.fff_division_label || 'Régional 1 IDF',
      group: club?.fff_group_label || 'Poule B',
    },
    {
      name: `${defaultClubName} · U19`,
      category: 'U19',
      leagueId: 'u19_nat_a',
      division: 'Championnat National U19',
      group: 'Poule A',
    },
    {
      name: `${defaultClubName} · U17`,
      category: 'U17',
      leagueId: 'u17_nat',
      division: 'Championnat National U17',
      group: 'Poule FFF',
    },
    {
      name: `${defaultClubName} · Féminines`,
      category: 'Féminines',
      leagueId: 'd1_fem',
      division: 'Arkema Première Ligue (D1F)',
      group: 'Poule Unique',
    },
  ];

  return defaultSections.map((sec, idx) => {
    const competitions: TeamCompetitionOption[] = [
      {
        id: sec.leagueId,
        name: sec.division,
        divisionLabel: sec.division,
        groupLabel: sec.group,
        type: 'championship',
        isKnockout: false,
      },
      {
        id: `mock_cup_${idx}`,
        name: sec.category === 'U19' ? 'Coupe Gambardella' : 'Coupe de France FFF',
        divisionLabel: sec.category === 'U19' ? 'Coupe Gambardella' : 'Coupe de France FFF',
        groupLabel: 'Élimination directe',
        type: 'cup',
        isKnockout: true,
      },
    ];
    return {
      id: `default_team_${idx}`,
      teamName: sec.name,
      category: sec.category,
      genderScope: sec.category === 'Féminines' ? 'women' : 'men',
      competitions,
      activeCompetitionId: competitions[0]?.id ?? 'r1_idf_b',
    };
  });
}
