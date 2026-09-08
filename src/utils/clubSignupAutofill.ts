import type { OfficialFffClub } from '../services/fffOfficialRegistry.service';

/** Champs signup préremplis depuis un club DOFA — uniquement ce que la FFF connaît. */
export type ClubSignupAutofill = {
  structureName: string;
  city: string;
  department: string;
  postalCode: string;
  fffNumber: string;
  league: string;
  region: string;
  /** Équipes engagées DOFA (info, pas sélection joueur). */
  teams: string[];
};

/**
 * Mappe un club officiel FFF/DOFA vers les champs structure ProDay.
 * Les champs absents chez DOFA restent vides (jamais inventés).
 */
export function buildClubSignupAutofill(
  club: OfficialFffClub,
  teamsFromDofa: string[] = []
): ClubSignupAutofill {
  return {
    structureName: club.name?.trim() || '',
    city: club.city?.trim() || '',
    department: club.department?.trim() || '',
    postalCode: club.postalCode?.trim() || '',
    fffNumber: club.fffNumber?.trim() || '',
    league: club.league?.trim() || '',
    region: club.region?.trim() || '',
    teams: teamsFromDofa.length > 0 ? teamsFromDofa : [...(club.categories ?? [])],
  };
}

/** Résumé lisible pour l’UI club (après sélection). */
export function formatClubAutofillSummary(fill: ClubSignupAutofill): string[] {
  const lines: string[] = [];
  if (fill.structureName) lines.push(fill.structureName);
  if (fill.fffNumber) lines.push(`N° affiliation FFF ${fill.fffNumber}`);
  const place = [fill.city, fill.postalCode, fill.department ? `dept ${fill.department}` : '']
    .filter(Boolean)
    .join(' · ');
  if (place) lines.push(place);
  if (fill.league) lines.push(fill.league);
  if (fill.region && fill.region !== fill.league) lines.push(fill.region);
  if (fill.teams.length > 0) {
    lines.push(
      `${fill.teams.length} équipe${fill.teams.length > 1 ? 's' : ''} engagée${fill.teams.length > 1 ? 's' : ''} FFF`
    );
  }
  return lines;
}
