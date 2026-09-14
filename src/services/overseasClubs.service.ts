/**
 * ProDay - Service des clubs d'Outre-Mer et Répertoire DOM-TOM (Section 24)
 * Couvre les 11 territoires ultra-marins + gestion "Mon club n'apparaît pas"
 */

import type { OfficialFffClub } from './fffOfficialRegistry.service';

export interface OverseasTerritory {
  code: string;
  name: string;
  shortName: string;
  leagueName: string;
  defaultPostalPrefix: string;
}

export const OVERSEAS_TERRITORIES: OverseasTerritory[] = [
  {
    code: '971',
    name: 'Guadeloupe',
    shortName: 'Guadeloupe',
    leagueName: 'Ligue Guadeloupéenne de Football',
    defaultPostalPrefix: '971',
  },
  {
    code: '972',
    name: 'Martinique',
    shortName: 'Martinique',
    leagueName: 'Ligue de Football de Martinique',
    defaultPostalPrefix: '972',
  },
  {
    code: '973',
    name: 'Guyane',
    shortName: 'Guyane',
    leagueName: 'Ligue de Football de la Guyane',
    defaultPostalPrefix: '973',
  },
  {
    code: '974',
    name: 'La Réunion',
    shortName: 'La Réunion',
    leagueName: 'Ligue Réunionnaise de Football',
    defaultPostalPrefix: '974',
  },
  {
    code: '976',
    name: 'Mayotte',
    shortName: 'Mayotte',
    leagueName: 'Ligue Mahoraise de Football',
    defaultPostalPrefix: '976',
  },
  {
    code: '978',
    name: 'Saint-Martin',
    shortName: 'Saint-Martin',
    leagueName: 'Ligue de Football de Saint-Martin',
    defaultPostalPrefix: '97800',
  },
  {
    code: '977',
    name: 'Saint-Barthélemy',
    shortName: 'Saint-Barthélemy',
    leagueName: 'Comité de Football de Saint-Barthélemy',
    defaultPostalPrefix: '97133',
  },
  {
    code: '975',
    name: 'Saint-Pierre-et-Miquelon',
    shortName: 'Saint-Pierre-et-Miquelon',
    leagueName: 'Ligue de Football de Saint-Pierre-et-Miquelon',
    defaultPostalPrefix: '97500',
  },
  {
    code: '988',
    name: 'Nouvelle-Calédonie',
    shortName: 'Nouvelle-Calédonie',
    leagueName: 'Fédération Calédonienne de Football',
    defaultPostalPrefix: '98800',
  },
  {
    code: '987',
    name: 'Polynésie française (Tahiti)',
    shortName: 'Polynésie',
    leagueName: 'Fédération Tahitienne de Football',
    defaultPostalPrefix: '98700',
  },
  {
    code: '986',
    name: 'Wallis-et-Futuna',
    shortName: 'Wallis-et-Futuna',
    leagueName: 'Comité Territorial de Football Wallis-et-Futuna',
    defaultPostalPrefix: '98600',
  },
];

export interface OverseasClubEntry {
  fffNumber: string;
  name: string;
  city: string;
  postalCode: string;
  territoryCode: string;
  league: string;
  categories: string[];
  logoUrl?: string;
}

/**
 * Annuaire certifié des clubs ultramarins par territoire
 */
export const OVERSEAS_CLUBS_DATA: OverseasClubEntry[] = [
  // --- Guadeloupe (971) ---
  {
    fffNumber: '500120',
    name: 'Club Sportif Moulien (CSM)',
    city: 'Le Moule',
    postalCode: '97160',
    territoryCode: '971',
    league: 'Ligue Guadeloupéenne de Football',
    categories: ['R1', 'Seniors', 'U19', 'U17', 'U15', 'Féminines'],
  },
  {
    fffNumber: '500121',
    name: 'Solidarité Scolaire',
    city: 'Baie-Mahault',
    postalCode: '97122',
    territoryCode: '971',
    league: 'Ligue Guadeloupéenne de Football',
    categories: ['R1', 'Seniors', 'U18', 'U15', 'École de foot'],
  },
  {
    fffNumber: '500122',
    name: 'Juventus de Sainte-Anne',
    city: 'Sainte-Anne',
    postalCode: '97180',
    territoryCode: '971',
    league: 'Ligue Guadeloupéenne de Football',
    categories: ['R1', 'Seniors', 'U17', 'U15'],
  },
  {
    fffNumber: '500123',
    name: 'Sporting Club Baie-Mahault',
    city: 'Baie-Mahault',
    postalCode: '97122',
    territoryCode: '971',
    league: 'Ligue Guadeloupéenne de Football',
    categories: ['R1', 'Seniors', 'U19', 'U17'],
  },
  {
    fffNumber: '500124',
    name: 'Phare du Canal',
    city: 'Petit-Canal',
    postalCode: '97131',
    territoryCode: '971',
    league: 'Ligue Guadeloupéenne de Football',
    categories: ['R1', 'Seniors', 'U17'],
  },
  {
    fffNumber: '500125',
    name: 'Red Star de Pointe-à-Pitre',
    city: 'Pointe-à-Pitre',
    postalCode: '97110',
    territoryCode: '971',
    league: 'Ligue Guadeloupéenne de Football',
    categories: ['R1', 'R2', 'Seniors', 'U15'],
  },

  // --- Martinique (972) ---
  {
    fffNumber: '500210',
    name: 'Club Franciscain',
    city: 'Le François',
    postalCode: '97240',
    territoryCode: '972',
    league: 'Ligue de Football de Martinique',
    categories: ['R1 Trophée Gérard Janvion', 'Seniors', 'U19', 'U17', 'Féminines'],
  },
  {
    fffNumber: '500211',
    name: 'Golden Lion de Saint-Joseph',
    city: 'Saint-Joseph',
    postalCode: '97212',
    territoryCode: '972',
    league: 'Ligue de Football de Martinique',
    categories: ['R1', 'Seniors', 'U18', 'U15', 'Féminines'],
  },
  {
    fffNumber: '500212',
    name: 'Club Colonial de Fort-de-France',
    city: 'Fort-de-France',
    postalCode: '97200',
    territoryCode: '972',
    league: 'Ligue de Football de Martinique',
    categories: ['R1', 'Seniors', 'U19', 'U17', 'U15'],
  },
  {
    fffNumber: '500213',
    name: 'Aiglon du Lamentin',
    city: 'Le Lamentin',
    postalCode: '97232',
    territoryCode: '972',
    league: 'Ligue de Football de Martinique',
    categories: ['R1', 'Seniors', 'U19', 'U17', 'École de foot'],
  },
  {
    fffNumber: '500214',
    name: 'La Samaritaine',
    city: 'Sainte-Marie',
    postalCode: '97230',
    territoryCode: '972',
    league: 'Ligue de Football de Martinique',
    categories: ['R1', 'Seniors', 'U17', 'U15'],
  },
  {
    fffNumber: '500215',
    name: 'Racing Club de Rivière-Pilote',
    city: 'Rivière-Pilote',
    postalCode: '97211',
    territoryCode: '972',
    league: 'Ligue de Football de Martinique',
    categories: ['R1', 'R2', 'Seniors', 'U17'],
  },

  // --- Guyane (973) ---
  {
    fffNumber: '500310',
    name: 'ASC Le Geldar de Kourou',
    city: 'Kourou',
    postalCode: '97310',
    territoryCode: '973',
    league: 'Ligue de Football de la Guyane',
    categories: ['R1 Guyane', 'Seniors', 'U19', 'U17'],
  },
  {
    fffNumber: '500311',
    name: 'CSC de Cayenne',
    city: 'Cayenne',
    postalCode: '97300',
    territoryCode: '973',
    league: 'Ligue de Football de la Guyane',
    categories: ['R1 Guyane', 'Seniors', 'U17', 'U15'],
  },
  {
    fffNumber: '500312',
    name: 'US Matoury',
    city: 'Matoury',
    postalCode: '97351',
    territoryCode: '973',
    league: 'Ligue de Football de la Guyane',
    categories: ['R1 Guyane', 'Seniors', 'U18', 'U15'],
  },
  {
    fffNumber: '500313',
    name: 'Étoile de Matoury',
    city: 'Matoury',
    postalCode: '97351',
    territoryCode: '973',
    league: 'Ligue de Football de la Guyane',
    categories: ['R1 Guyane', 'Seniors', 'U17'],
  },
  {
    fffNumber: '500314',
    name: 'ASU Grand Santi',
    city: 'Grand-Santi',
    postalCode: '97340',
    territoryCode: '973',
    league: 'Ligue de Football de la Guyane',
    categories: ['R1 Guyane', 'Seniors'],
  },

  // --- La Réunion (974) ---
  {
    fffNumber: '500410',
    name: 'JS Saint-Pierroise (JSSP)',
    city: 'Saint-Pierre',
    postalCode: '97410',
    territoryCode: '974',
    league: 'Ligue Réunionnaise de Football',
    categories: ['Régionale 1', 'Seniors', 'U19', 'U17', 'U15', 'Féminines'],
  },
  {
    fffNumber: '500411',
    name: "SS Jeanne d'Arc",
    city: 'Le Port',
    postalCode: '97420',
    territoryCode: '974',
    league: 'Ligue Réunionnaise de Football',
    categories: ['Régionale 1', 'Seniors', 'U19', 'U17', 'U15'],
  },
  {
    fffNumber: '500412',
    name: 'Saint-Denis FC',
    city: 'Saint-Denis',
    postalCode: '97400',
    territoryCode: '974',
    league: 'Ligue Réunionnaise de Football',
    categories: ['Régionale 1', 'Seniors', 'U18', 'U16', 'U14', 'Féminines'],
  },
  {
    fffNumber: '500413',
    name: 'AS Excelsior',
    city: 'Saint-Joseph',
    postalCode: '97480',
    territoryCode: '974',
    league: 'Ligue Réunionnaise de Football',
    categories: ['Régionale 1', 'Seniors', 'U19', 'U17'],
  },
  {
    fffNumber: '500414',
    name: 'La Tamponnaise',
    city: 'Le Tampon',
    postalCode: '97430',
    territoryCode: '974',
    league: 'Ligue Réunionnaise de Football',
    categories: ['Régionale 1', 'Seniors', 'U19', 'U17', 'U15'],
  },
  {
    fffNumber: '500415',
    name: 'Saint-Pauloise FC',
    city: 'Saint-Paul',
    postalCode: '97460',
    territoryCode: '974',
    league: 'Ligue Réunionnaise de Football',
    categories: ['Régionale 1', 'Seniors', 'U17', 'U15'],
  },

  // --- Mayotte (976) ---
  {
    fffNumber: '500610',
    name: 'FC Mtsapéré',
    city: 'Mamoudzou',
    postalCode: '97600',
    territoryCode: '976',
    league: 'Ligue Mahoraise de Football',
    categories: ['R1 Mayotte', 'Seniors', 'U19', 'U17'],
  },
  {
    fffNumber: '500611',
    name: 'AS Jumeaux de Mzouazia',
    city: 'Bouéni',
    postalCode: '97620',
    territoryCode: '976',
    league: 'Ligue Mahoraise de Football',
    categories: ['R1 Mayotte', 'Seniors', 'U18', 'U15'],
  },
  {
    fffNumber: '500612',
    name: 'Diables Noirs de Combani',
    city: 'Tsingoni',
    postalCode: '97680',
    territoryCode: '976',
    league: 'Ligue Mahoraise de Football',
    categories: ['R1 Mayotte', 'Seniors', 'U17'],
  },
  {
    fffNumber: '500613',
    name: 'AS Rosador de Passamainty',
    city: 'Mamoudzou',
    postalCode: '97605',
    territoryCode: '976',
    league: 'Ligue Mahoraise de Football',
    categories: ['R1 Mayotte', 'Seniors', 'U17'],
  },

  // --- Saint-Martin (978) ---
  {
    fffNumber: '500810',
    name: 'Junior Stars FC',
    city: 'Marigot',
    postalCode: '97800',
    territoryCode: '978',
    league: 'Ligue de Football de Saint-Martin',
    categories: ['Séniors', 'U17', 'U15', 'École de foot'],
  },
  {
    fffNumber: '500811',
    name: 'United Stars Saint-Martin',
    city: 'Grand-Case',
    postalCode: '97800',
    territoryCode: '978',
    league: 'Ligue de Football de Saint-Martin',
    categories: ['Séniors', 'U15', 'Féminines'],
  },
  {
    fffNumber: '500812',
    name: 'Saint-Louis Stars',
    city: 'Saint-Louis',
    postalCode: '97800',
    territoryCode: '978',
    league: 'Ligue de Football de Saint-Martin',
    categories: ['Séniors', 'U17'],
  },

  // --- Saint-Barthélemy (977) ---
  {
    fffNumber: '500710',
    name: 'Arawak FC',
    city: 'Gustavia',
    postalCode: '97133',
    territoryCode: '977',
    league: 'Comité de Football de Saint-Barthélemy',
    categories: ['Séniors', 'U15'],
  },
  {
    fffNumber: '500711',
    name: 'FC Gustavia',
    city: 'Gustavia',
    postalCode: '97133',
    territoryCode: '977',
    league: 'Comité de Football de Saint-Barthélemy',
    categories: ['Séniors', 'Jeunes'],
  },

  // --- Saint-Pierre-et-Miquelon (975) ---
  {
    fffNumber: '500510',
    name: 'AS Saint-Pierraise (ASSP)',
    city: 'Saint-Pierre',
    postalCode: '97500',
    territoryCode: '975',
    league: 'Ligue de Football de Saint-Pierre-et-Miquelon',
    categories: ['Seniors', 'U18', 'U15', 'École de foot'],
  },
  {
    fffNumber: '500511',
    name: 'AS Ilienne Amateurs (ASIA)',
    city: 'Saint-Pierre',
    postalCode: '97500',
    territoryCode: '975',
    league: 'Ligue de Football de Saint-Pierre-et-Miquelon',
    categories: ['Seniors', 'U18', 'U15'],
  },
  {
    fffNumber: '500512',
    name: 'AS Miquelonnaise (ASM)',
    city: 'Miquelon',
    postalCode: '97500',
    territoryCode: '975',
    league: 'Ligue de Football de Saint-Pierre-et-Miquelon',
    categories: ['Seniors', 'U15'],
  },

  // --- Nouvelle-Calédonie (988) ---
  {
    fffNumber: '500910',
    name: 'Hienghène Sport',
    city: 'Hienghène',
    postalCode: '98815',
    territoryCode: '988',
    league: 'Fédération Calédonienne de Football (Super Ligue)',
    categories: ['Super Ligue', 'Seniors', 'U18', 'U15', 'Féminines'],
  },
  {
    fffNumber: '500911',
    name: 'AS Magenta',
    city: 'Nouméa',
    postalCode: '98800',
    territoryCode: '988',
    league: 'Fédération Calédonienne de Football (Super Ligue)',
    categories: ['Super Ligue', 'Seniors', 'U18', 'U15'],
  },
  {
    fffNumber: '500912',
    name: 'AS Tiga Sport',
    city: 'Nouméa',
    postalCode: '98800',
    territoryCode: '988',
    league: 'Fédération Calédonienne de Football (Super Ligue)',
    categories: ['Super Ligue', 'Seniors', 'U18'],
  },

  // --- Polynésie française (987) ---
  {
    fffNumber: '500970',
    name: 'AS Vénus',
    city: 'Mahina',
    postalCode: '98709',
    territoryCode: '987',
    league: 'Fédération Tahitienne de Football (Ligue 1 Vini)',
    categories: ['Ligue 1', 'Seniors', 'U18', 'U15'],
  },
  {
    fffNumber: '500971',
    name: 'AS Pirae',
    city: 'Pirae',
    postalCode: '98716',
    territoryCode: '987',
    league: 'Fédération Tahitienne de Football (Ligue 1 Vini)',
    categories: ['Ligue 1', 'Seniors', 'U18', 'U15', 'Féminines'],
  },
  {
    fffNumber: '500972',
    name: 'AS Tefana',
    city: 'Faaa',
    postalCode: '98704',
    territoryCode: '987',
    league: 'Fédération Tahitienne de Football (Ligue 1 Vini)',
    categories: ['Ligue 1', 'Seniors', 'U18', 'U15'],
  },

  // --- Wallis-et-Futuna (986) ---
  {
    fffNumber: '500980',
    name: 'Mata-Utu FC',
    city: 'Mata-Utu',
    postalCode: '98600',
    territoryCode: '986',
    league: 'Comité Territorial de Football Wallis-et-Futuna',
    categories: ['Seniors', 'Jeunes'],
  },
  {
    fffNumber: '500981',
    name: 'Hahake FC',
    city: 'Hahake',
    postalCode: '98600',
    territoryCode: '986',
    league: 'Comité Territorial de Football Wallis-et-Futuna',
    categories: ['Seniors'],
  },
];

/**
 * Convertit une entrée ultramarine vers l'interface OfficialFffClub
 */
export function toOfficialFffClub(entry: OverseasClubEntry): OfficialFffClub {
  const territory = OVERSEAS_TERRITORIES.find((t) => t.code === entry.territoryCode);
  return {
    id: `om-${entry.fffNumber}`,
    name: entry.name,
    fffNumber: entry.fffNumber,
    city: entry.city,
    postalCode: entry.postalCode,
    department: entry.territoryCode,
    region: territory?.name || 'Outre-Mer',
    league: entry.league,
    categories: entry.categories,
    logoUrl: entry.logoUrl || null,
    source: 'fff_dofa',
  };
}

/**
 * Normalise le texte de recherche (accents, minuscules, espaces).
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const overseasClubsService = {
  /**
   * Retourne la liste des territoires d'Outre-Mer supportés.
   */
  getTerritories(): OverseasTerritory[] {
    return OVERSEAS_TERRITORIES;
  },

  /**
   * Recherche parmi les clubs ultramarins par nom, ville, code postal ou code territoire.
   */
  searchOverseasClubs(query: string, territoryFilter?: string): OfficialFffClub[] {
    const q = normalizeText(query);
    const filter = territoryFilter?.trim();

    const filtered = OVERSEAS_CLUBS_DATA.filter((entry) => {
      if (filter && filter !== 'ALL' && filter !== 'DOM-TOM' && entry.territoryCode !== filter) {
        return false;
      }
      if (!q) return true;

      const nName = normalizeText(entry.name);
      const nCity = normalizeText(entry.city);
      const nPostal = entry.postalCode;
      const nFff = entry.fffNumber;

      return (
        nName.includes(q) ||
        nCity.includes(q) ||
        nPostal.includes(q) ||
        nFff.includes(q)
      );
    });

    return filtered.map(toOfficialFffClub);
  },

  /**
   * Génère un club valide "Mon club n'apparaît pas" pour éviter tout blocage d'inscription (Section 24).
   */
  createUnlistedClub(params: {
    name: string;
    territoryCodeOrDepartment: string;
    city: string;
    postalCode?: string;
    estimatedDivision?: string;
  }): OfficialFffClub {
    const territory = OVERSEAS_TERRITORIES.find(
      (t) => t.code === params.territoryCodeOrDepartment
    );
    const regionName = territory ? territory.name : `Dép. ${params.territoryCodeOrDepartment}`;
    const defaultLeague = territory ? territory.leagueName : 'Ligue Régionale';
    const cleanPostal =
      params.postalCode?.trim() ||
      (territory ? territory.defaultPostalPrefix : `${params.territoryCodeOrDepartment}000`);

    const pseudoFff = `CUSTOM-${Date.now().toString().slice(-6)}`;

    return {
      id: `custom-${Date.now()}`,
      name: params.name.trim(),
      fffNumber: pseudoFff,
      city: params.city.trim(),
      postalCode: cleanPostal,
      department: params.territoryCodeOrDepartment.trim(),
      region: regionName,
      league: defaultLeague,
      categories: params.estimatedDivision ? [params.estimatedDivision] : ['Seniors', 'Jeunes'],
      logoUrl: null,
      source: 'fff_dofa',
    };
  },
};
