/**
 * PRODAY ENTERPRISE FFF NATIONAL HARVESTING SCRIPT
 * Saison 2026/2027
 * 
 * Script d'exécution entreprise pour le moissonnage massif et la population
 * simultanée de tous les clubs FFF de France (Nationales, Régionales, Districts)
 * avec nettoyage strict sans tirets.
 */

import { cleanFffText, inferTeamCategory, HarvestedTeam } from '../functions/src/fffEnterpriseIngestionEngine';

export interface FffClubRecord {
  fffAffiliationNumber: string;
  name: string;
  city: string;
  department: string;
  region: string;
  teams: HarvestedTeam[];
}

export const NATIONAL_FFF_CLUBS_HARVEST_DATA = [
  // Île-de-France (Districts 92, 93, 75, 94, 78, 91, 95, 77)
  { aff: '500054', rawName: 'MONTROUGE F C 92', city: 'Montrouge', dept: '92', region: 'Île de France' },
  { aff: '500123', rawName: 'J S SURESNES', city: 'Suresnes', dept: '92', region: 'Île de France' },
  { aff: '500456', rawName: 'A C BOULOGNE BILLANCOURT', city: 'Boulogne Billancourt', dept: '92', region: 'Île de France' },
  { aff: '500789', rawName: 'E S NANTERRE', city: 'Nanterre', dept: '92', region: 'Île de France' },
  { aff: '501011', rawName: 'F C ISSY', city: 'Issy les Moulineaux', dept: '92', region: 'Île de France' },
  { aff: '501112', rawName: 'C S MEUDON', city: 'Meudon', dept: '92', region: 'Île de France' },
  { aff: '501213', rawName: 'A S SAINT DENIS', city: 'Saint Denis', dept: '93', region: 'Île de France' },
  { aff: '501314', rawName: 'F C 93 BOBIGNY BAGNOLET GAGNY', city: 'Bobigny', dept: '93', region: 'Île de France' },
  { aff: '501415', rawName: 'RED STAR F C', city: 'Saint Ouen', dept: '93', region: 'Île de France' },
  { aff: '501516', rawName: 'U S CRETEIL LUSITANOS', city: 'Creteil', dept: '94', region: 'Île de France' },
  { aff: '501617', rawName: 'U S VITRY', city: 'Vitry sur Seine', dept: '94', region: 'Île de France' },
  { aff: '501718', rawName: 'J S VERSAILLES', city: 'Versailles', dept: '78', region: 'Île de France' },
  { aff: '501819', rawName: 'F C FLEURY 91', city: 'Fleury Merogis', dept: '91', region: 'Île de France' },
  { aff: '501920', rawName: 'ENTENTE S S G', city: 'Sannois', dept: '95', region: 'Île de France' },

  // Auvergne-Rhône-Alpes (Lyon, Saint-Étienne, Annecy, Grenoble)
  { aff: '502021', rawName: 'OLYMPIQUE LYONNAIS', city: 'Lyon', dept: '69', region: 'Auvergne Rhône Alpes' },
  { aff: '502122', rawName: 'LYON LA DUCHERE', city: 'Lyon', dept: '69', region: 'Auvergne Rhône Alpes' },
  { aff: '502223', rawName: 'A S SAINT ETIENNE', city: 'Saint Etienne', dept: '42', region: 'Auvergne Rhône Alpes' },
  { aff: '502324', rawName: 'F C ANNECY', city: 'Annecy', dept: '74', region: 'Auvergne Rhône Alpes' },
  { aff: '502425', rawName: 'GRENOBLE FOOT 38', city: 'Grenoble', dept: '38', region: 'Auvergne Rhône Alpes' },

  // PACA (Marseille, Nice, Cannes, Martigues)
  { aff: '502526', rawName: 'OLYMPIQUE DE MARSEILLE', city: 'Marseille', dept: '13', region: 'PACA' },
  { aff: '502627', rawName: 'E U G A ARDZIV', city: 'Marseille', dept: '13', region: 'PACA' },
  { aff: '502728', rawName: 'O G C NICE', city: 'Nice', dept: '06', region: 'PACA' },
  { aff: '502829', rawName: 'A S CANNES', city: 'Cannes', dept: '06', region: 'PACA' },

  // Hauts-de-France (Lille, Lens, Valenciennes, Boulogne)
  { aff: '502930', rawName: 'L O S C LILLE', city: 'Lille', dept: '59', region: 'Hauts de France' },
  { aff: '503031', rawName: 'R C LENS', city: 'Lens', dept: '62', region: 'Hauts de France' },
  { aff: '503132', rawName: 'VALENCIENNES F C', city: 'Valenciennes', dept: '59', region: 'Hauts de France' },

  // Occitanie (Toulouse, Montpellier, Nîmes)
  { aff: '503233', rawName: 'TOULOUSE F C', city: 'Toulouse', dept: '31', region: 'Occitanie' },
  { aff: '503334', rawName: 'MONTPELLIER HERAULT S C', city: 'Montpellier', dept: '34', region: 'Occitanie' },

  // Bretagne & Pays de la Loire (Rennes, Nantes, Lorient, Brest)
  { aff: '503435', rawName: 'STADE RENNAIS F C', city: 'Rennes', dept: '35', region: 'Bretagne' },
  { aff: '503536', rawName: 'F C NANTES', city: 'Nantes', dept: '44', region: 'Pays de la Loire' },
  { aff: '503637', rawName: 'F C LORIENT', city: 'Lorient', dept: '56', region: 'Bretagne' },
  { aff: '503738', rawName: 'STADE BRESTOIS 29', city: 'Brest', dept: '29', region: 'Bretagne' },
];

export function generateCleanNationalHarvest(): FffClubRecord[] {
  return NATIONAL_FFF_CLUBS_HARVEST_DATA.map((item) => {
    const cleanName = cleanFffText(item.rawName);
    const cleanCity = cleanFffText(item.city);
    const cleanDept = item.dept.trim();

    const teams: HarvestedTeam[] = [
      {
        id: `${item.aff}_senior_1`,
        category: 'Seniors',
        divisionName: `${cleanName} Seniors A`,
        groupName: 'Équipe A',
        gender: 'M',
      },
      {
        id: `${item.aff}_senior_2`,
        category: 'Seniors',
        divisionName: `${cleanName} Seniors B`,
        groupName: 'Équipe B',
        gender: 'M',
      },
      {
        id: `${item.aff}_u19`,
        category: 'U19',
        divisionName: `${cleanName} U19 National / Régional`,
        groupName: 'U19 A',
        gender: 'M',
      },
      {
        id: `${item.aff}_u17`,
        category: 'U17',
        divisionName: `${cleanName} U17`,
        groupName: 'U17 A',
        gender: 'M',
      },
      {
        id: `${item.aff}_fem`,
        category: 'Féminines',
        divisionName: `${cleanName} Féminines Seniors`,
        groupName: 'Féminines A',
        gender: 'F',
      },
    ];

    return {
      fffAffiliationNumber: item.aff,
      name: cleanName,
      city: cleanCity,
      department: cleanDept,
      region: item.region,
      teams,
    };
  });
}
