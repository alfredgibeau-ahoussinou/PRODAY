/**
 * Métadonnées des championnats FFF couverts par ProDay.
 *
 * Remplace les anciens CERTIFIED_NATIONAL_STANDINGS / CERTIFIED_IDF_STANDINGS
 * (classements figés 2024/2025). Aujourd'hui on ne stocke plus les tableaux de
 * points côté serveur : le sync quotidien (fffStandingsSync) écrit les vraies
 * données live dans Firestore `fff_league_standings/{leagueId}` et le client
 * les lit en priorité. Ce fichier ne sert qu'à fournir un fallback honnête
 * (shell vide pour la saison en cours) quand aucune donnée live n'est disponible.
 */

export interface CertifiedLeagueMeta {
  id: string;
  name: string;
  category: 'national' | 'regional' | 'district' | 'jeunes' | 'feminines';
  region?: string;
  districtCode?: string;
  /** Label de la division sans indication de saison (ex. "Championnat de France"). */
  divisionLabelBase: string;
}

/**
 * Métadonnées de tous les championnats suivis.
 * Les 4 nationaux (L1, L2, N1, D1F) sont sync via API-Football.
 * Les 10 IDF/régionaux/district sont sync via DOFA (si DOFA_COMPET_IDS configuré).
 */
export const CERTIFIED_LEAGUE_META: Record<string, CertifiedLeagueMeta> = {
  // --- Nationales (API-Football) ---
  ligue1: {
    id: 'ligue1',
    name: "Ligue 1 McDonald's",
    category: 'national',
    divisionLabelBase: 'Championnat de France',
  },
  ligue2: {
    id: 'ligue2',
    name: 'Ligue 2 BKT',
    category: 'national',
    divisionLabelBase: 'Championnat de France',
  },
  national1: {
    id: 'national1',
    name: 'National 1 FFF',
    category: 'national',
    divisionLabelBase: 'Championnat de France National',
  },
  national2_c: {
    id: 'national2_c',
    name: 'National 2 · Poule C',
    category: 'national',
    divisionLabelBase: 'Quatrième Division FFF',
  },
  d1_fem: {
    id: 'd1_fem',
    name: 'Arkema Première Ligue (D1 Féminine)',
    category: 'feminines',
    divisionLabelBase: 'Élite Féminine',
  },
  u19_nat_a: {
    id: 'u19_nat_a',
    name: 'Championnat National U19 · Poule A',
    category: 'jeunes',
    divisionLabelBase: 'Élite U19 National',
  },

  // --- Régionaux / Districts IDF (DOFA) ---
  r1_idf_a: {
    id: 'r1_idf_a',
    name: 'Régional 1 Île-de-France · Poule A',
    category: 'regional',
    region: 'Île-de-France',
    divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule A)',
  },
  r1_idf_b: {
    id: 'r1_idf_b',
    name: 'Régional 1 Île-de-France · Poule B',
    category: 'regional',
    region: 'Île-de-France',
    divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule B)',
  },
  r2_idf: {
    id: 'r2_idf',
    name: 'Régional 2 Île-de-France · Poule B',
    category: 'regional',
    region: 'Île-de-France',
    divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R2 (Poule B)',
  },
  d1_d92: {
    id: 'd1_d92',
    name: 'Départemental 1 · District 92 (Hauts-de-Seine)',
    category: 'district',
    districtCode: '92',
    region: 'Île-de-France',
    divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D1 (Poule Unique)',
  },
  d2_d92: {
    id: 'd2_d92',
    name: 'Départemental 2 · District 92 (Hauts-de-Seine)',
    category: 'district',
    districtCode: '92',
    region: 'Île-de-France',
    divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D2 (Poule A)',
  },
  d1_d93: {
    id: 'd1_d93',
    name: 'Départemental 1 · District 93 (Seine-Saint-Denis)',
    category: 'district',
    districtCode: '93',
    region: 'Île-de-France',
    divisionLabelBase: 'District de Seine-Saint-Denis FFF · Seniors D1 (Poule Unique)',
  },
  d1_d75: {
    id: 'd1_d75',
    name: 'Départemental 1 · District 75 (Paris)',
    category: 'district',
    districtCode: '75',
    region: 'Île-de-France',
    divisionLabelBase: 'District de Paris FFF · Seniors D1 (Poule Unique)',
  },
  d1_d94: {
    id: 'd1_d94',
    name: 'Départemental 1 · District 94 (Val-de-Marne)',
    category: 'district',
    districtCode: '94',
    region: 'Île-de-France',
    divisionLabelBase: 'District du Val-de-Marne FFF · Seniors D1',
  },
  d1_d78: {
    id: 'd1_d78',
    name: 'Départemental 1 · District 78 (Yvelines)',
    category: 'district',
    districtCode: '78',
    region: 'Île-de-France',
    divisionLabelBase: 'District des Yvelines FFF · Seniors D1',
  },
  d1_d91: {
    id: 'd1_d91',
    name: 'Départemental 1 · District 91 (Essonne)',
    category: 'district',
    districtCode: '91',
    region: 'Île-de-France',
    divisionLabelBase: 'District de l\'Essonne FFF · Seniors D1',
  },
  d1_d95: {
    id: 'd1_d95',
    name: 'Départemental 1 · District 95 (Val-d\'Oise)',
    category: 'district',
    districtCode: '95',
    region: 'Île-de-France',
    divisionLabelBase: 'District du Val-d\'Oise FFF · Seniors D1',
  },
  d1_d77: {
    id: 'd1_d77',
    name: 'Départemental 1 · District 77 (Seine-et-Marne)',
    category: 'district',
    districtCode: '77',
    region: 'Île-de-France',
    divisionLabelBase: 'District de Seine-et-Marne FFF · Seniors D1',
  },
  d1_d69: {
    id: 'd1_d69',
    name: 'Départemental 1 · District 69 (Rhône & Lyon)',
    category: 'district',
    districtCode: '69',
    region: 'Auvergne-Rhône-Alpes',
    divisionLabelBase: 'District du Rhône FFF · Seniors D1',
  },
  d1_d13: {
    id: 'd1_d13',
    name: 'Départemental 1 · District 13 (Bouches-du-Rhône & Marseille)',
    category: 'district',
    districtCode: '13',
    region: 'PACA',
    divisionLabelBase: 'District des Bouches-du-Rhône FFF · Seniors D1',
  },
  d1_d59: {
    id: 'd1_d59',
    name: 'Départemental 1 · District 59 (Nord & Lille)',
    category: 'district',
    districtCode: '59',
    region: 'Hauts-de-France',
    divisionLabelBase: 'District du Nord FFF · Seniors D1',
  },
  d1_d33: {
    id: 'd1_d33',
    name: 'Départemental 1 · District 33 (Gironde & Bordeaux)',
    category: 'district',
    districtCode: '33',
    region: 'Nouvelle-Aquitaine',
    divisionLabelBase: 'District de Gironde FFF · Seniors D1',
  },
  d1_d31: {
    id: 'd1_d31',
    name: 'Départemental 1 · District 31 (Haute-Garonne & Toulouse)',
    category: 'district',
    districtCode: '31',
    region: 'Occitanie',
    divisionLabelBase: 'District de Haute-Garonne FFF · Seniors D1',
  },
  d1_d44: {
    id: 'd1_d44',
    name: 'Départemental 1 · District 44 (Loire-Atlantique & Nantes)',
    category: 'district',
    districtCode: '44',
    region: 'Pays de la Loire',
    divisionLabelBase: 'District de Loire-Atlantique FFF · Seniors D1',
  },
  d1_d35: {
    id: 'd1_d35',
    name: 'Départemental 1 · District 35 (Ille-et-Vilaine & Rennes)',
    category: 'district',
    districtCode: '35',
    region: 'Bretagne',
    divisionLabelBase: 'District d\'Ille-et-Vilaine FFF · Seniors D1',
  },
  d1_d06: {
    id: 'd1_d06',
    name: 'Départemental 1 · District 06 (Côte d\'Azur & Nice)',
    category: 'district',
    districtCode: '06',
    region: 'PACA',
    divisionLabelBase: 'District de la Côte d\'Azur FFF · Seniors D1',
  },
  d1_d67: {
    id: 'd1_d67',
    name: 'Départemental 1 · District 67 (Alsace & Strasbourg)',
    category: 'district',
    districtCode: '67',
    region: 'Grand Est',
    divisionLabelBase: 'District d\'Alsace FFF · Seniors D1',
  },
};

/**
 * Retourne un shell vide pour le championnat demandé, avec la saison en cours.
 * Jamais de données figées 2024/2025 : si aucune donnée live n'est disponible
 * dans Firestore, le document a `standings: []` et `source: 'empty'`.
 */
export function certifiedFallback(
  leagueId: string,
  season: string,
): { id: string; name: string; category: string; divisionLabel: string; season: string; standings: []; source: string } | null {
  const meta = CERTIFIED_LEAGUE_META[leagueId];
  if (!meta) return null;
  return {
    id: leagueId,
    name: meta.name,
    category: meta.category,
    divisionLabel: `${season} · ${meta.divisionLabelBase}`,
    season,
    standings: [],
    source: 'empty',
  };
}

/** Liste des IDs de championnats couverts (dérivée de CERTIFIED_LEAGUE_META). */
export function certifiedLeagueIds(): string[] {
  return Object.keys(CERTIFIED_LEAGUE_META);
}
