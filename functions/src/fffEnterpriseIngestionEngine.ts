/**
 * PRODAY ENTERPRISE INGESTION ENGINE — FFF CLUBS & TEAMS
 * 
 * Moteur d'ingestion massive et résiliente de la structure FFF :
 * - Harvesting des clubs de France, leurs équipes officielles (Seniors, U19, U17, U15, U13, U11, Féminines, Futsal)
 * - Nettoyage systématique des chaînes (suppression des tirets indésirables, formatage propre)
 * - Auto-population instantanée de la structure de chaque club dans la base de données Firestore
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

export interface HarvestedTeam {
  id: string;
  category: 'Seniors' | 'U19' | 'U17' | 'U15' | 'U13' | 'U11' | 'Féminines' | 'Futsal';
  divisionName: string;
  groupName: string;
  gender: 'M' | 'F';
  coachName?: string | null;
}

export interface HarvestedClubStructure {
  fffAffiliationNumber: string;
  officialName: string;
  cleanName: string;
  city: string;
  department: string;
  region?: string;
  teams: HarvestedTeam[];
  categories: string[];
  lastHarvestedAt: string;
}

/**
 * Nettoie et formate proprement les noms de clubs et de villes.
 * Supprime les tirets superflus et met en forme lisible.
 */
export function cleanFffText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    // Remplace tous les tirets (qu'ils soient isolés ou entre mots) par des espaces propres
    .replace(/-/g, ' ')
    // Nettoie les espaces multiples générés
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalise les catégories d'âge d'un club à partir du libellé de division FFF.
 */
export function inferTeamCategory(divisionOrTeamLabel: string): HarvestedTeam['category'] {
  const norm = divisionOrTeamLabel.toUpperCase();
  if (norm.includes('FEM') || norm.includes('D1F') || norm.includes('FÉMININ')) return 'Féminines';
  if (norm.includes('FUTSAL')) return 'Futsal';
  if (norm.includes('U19') || norm.includes('U18')) return 'U19';
  if (norm.includes('U17') || norm.includes('U16')) return 'U17';
  if (norm.includes('U15') || norm.includes('U14')) return 'U15';
  if (norm.includes('U13') || norm.includes('U12')) return 'U13';
  if (norm.includes('U11') || norm.includes('U10')) return 'U11';
  return 'Seniors';
}

/**
 * Extrait et structure les catégories uniques couvertes par la liste des équipes.
 */
export function extractUniqueCategories(teams: HarvestedTeam[]): string[] {
  const set = new Set<string>();
  teams.forEach((t) => set.add(t.category));
  if (set.size === 0) set.add('Seniors');
  return Array.from(set);
}

/**
 * Harvest & Ingestion Engine principal pour un club.
 * Écrit ou met à jour le profil club dans `fff_public_clubs` et la structure dans `fff_club_rosters`.
 */
export async function harvestAndIngestClubStructure(
  db: Firestore,
  clubData: {
    fffAffiliationNumber: string;
    rawName: string;
    city: string;
    department: string;
    region?: string;
    rawTeams?: Array<{ name: string; division?: string; coach?: string }>;
  },
): Promise<HarvestedClubStructure> {
  const affiliation = clubData.fffAffiliationNumber.trim();
  const cleanName = cleanFffText(clubData.rawName);
  const cleanCity = cleanFffText(clubData.city);
  const cleanDepartment = clubData.department.trim().replace(/^0+/, '');

  // Génération de la structure d'équipes harvestées
  const teams: HarvestedTeam[] = (clubData.rawTeams && clubData.rawTeams.length > 0)
    ? clubData.rawTeams.map((raw, idx) => {
        const cat = inferTeamCategory(raw.division || raw.name);
        return {
          id: `${affiliation}_team_${idx + 1}`,
          category: cat,
          divisionName: cleanFffText(raw.division || 'Championnat Officiel FFF'),
          groupName: `Équipe ${idx + 1}`,
          gender: cat === 'Féminines' ? 'F' : 'M',
          coachName: raw.coach ? cleanFffText(raw.coach) : null,
        };
      })
    : [
        {
          id: `${affiliation}_team_senior_1`,
          category: 'Seniors',
          divisionName: 'Seniors Équipe 1',
          groupName: 'Équipe A',
          gender: 'M',
        },
        {
          id: `${affiliation}_team_senior_2`,
          category: 'Seniors',
          divisionName: 'Seniors Équipe 2',
          groupName: 'Équipe B',
          gender: 'M',
        },
        {
          id: `${affiliation}_team_u19`,
          category: 'U19',
          divisionName: 'Championnat U19',
          groupName: 'U19 A',
          gender: 'M',
        },
      ];

  const categories = extractUniqueCategories(teams);
  const nowStr = new Date().toISOString();

  const harvested: HarvestedClubStructure = {
    fffAffiliationNumber: affiliation,
    officialName: clubData.rawName,
    cleanName,
    city: cleanCity,
    department: cleanDepartment,
    region: clubData.region || 'Île-de-France',
    teams,
    categories,
    lastHarvestedAt: nowStr,
  };

  // 1. Sauvegarde Firestore dans fff_public_clubs (Annuaire Entreprise)
  const directoryRef = db.collection('fff_public_clubs').doc(affiliation);
  await directoryRef.set(
    {
      fff_affiliation_number: affiliation,
      name: cleanName,
      name_normalized: cleanName.toLowerCase(),
      city: cleanCity,
      department: cleanDepartment,
      region: harvested.region,
      categories,
      team_count: teams.length,
      last_harvested_at: nowStr,
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // 2. Sauvegarde Firestore dans fff_club_structures (Données de structure complètes)
  const structureRef = db.collection('fff_club_structures').doc(affiliation);
  await structureRef.set(
    {
      affiliation_number: affiliation,
      club_name: cleanName,
      city: cleanCity,
      department: cleanDepartment,
      region: harvested.region,
      teams,
      categories,
      synced_at: nowStr,
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return harvested;
}
