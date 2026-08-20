import type { ExternalTeamHit } from '../services/externalScores.types';
import {
  normalizeTeamKey,
  worldTeamFollowIdFromApiId,
  worldTeamFollowIdFromName,
} from '../utils/supporterWorldFollows';

export type PopularClubEntry = {
  name: string;
  apiTeamId?: number;
  country?: string;
  aliases?: string[];
  /** Affiché dans la rangée « clubs populaires » sans saisie. */
  featured?: boolean;
};

/** ~50 grands clubs — recherche offline, compatible `worldFollowTargetForTeam`. */
export const SUPPORTER_POPULAR_CLUBS: PopularClubEntry[] = [
  { name: 'Paris Saint-Germain', apiTeamId: 85, country: 'France', aliases: ['PSG', 'Paris SG', 'Paris'], featured: true },
  { name: 'Olympique de Marseille', apiTeamId: 81, country: 'France', aliases: ['OM', 'Marseille'], featured: true },
  { name: 'Olympique Lyonnais', apiTeamId: 80, country: 'France', aliases: ['OL', 'Lyon'], featured: true },
  { name: 'AS Monaco', apiTeamId: 91, country: 'France', aliases: ['Monaco'], featured: true },
  { name: 'LOSC Lille', apiTeamId: 79, country: 'France', aliases: ['Lille', 'LOSC'] },
  { name: 'OGC Nice', apiTeamId: 84, country: 'France', aliases: ['Nice'] },
  { name: 'RC Lens', apiTeamId: 116, country: 'France', aliases: ['Lens'] },
  { name: 'Stade Rennais', apiTeamId: 94, country: 'France', aliases: ['Rennes'] },
  { name: 'RC Strasbourg', apiTeamId: 95, country: 'France', aliases: ['Strasbourg'] },
  { name: 'Toulouse FC', apiTeamId: 96, country: 'France', aliases: ['Toulouse'] },
  { name: 'Real Madrid', apiTeamId: 541, country: 'Espagne', aliases: ['Real', 'Madrid'], featured: true },
  { name: 'FC Barcelone', apiTeamId: 529, country: 'Espagne', aliases: ['Barça', 'Barcelona', 'Barcelone'], featured: true },
  { name: 'Atlético Madrid', apiTeamId: 530, country: 'Espagne', aliases: ['Atletico', 'Atlético'] },
  { name: 'Sevilla FC', apiTeamId: 536, country: 'Espagne', aliases: ['Sevilla', 'Séville'] },
  { name: 'Real Sociedad', apiTeamId: 548, country: 'Espagne', aliases: ['Sociedad'] },
  { name: 'Athletic Club', apiTeamId: 531, country: 'Espagne', aliases: ['Athletic Bilbao', 'Bilbao'] },
  { name: 'Villarreal CF', apiTeamId: 533, country: 'Espagne', aliases: ['Villarreal'] },
  { name: 'Manchester United', apiTeamId: 33, country: 'Angleterre', aliases: ['Man U', 'Man United', 'Man Utd'], featured: true },
  { name: 'Manchester City', apiTeamId: 50, country: 'Angleterre', aliases: ['Man City', 'City'] },
  { name: 'Liverpool FC', apiTeamId: 40, country: 'Angleterre', aliases: ['Liverpool'], featured: true },
  { name: 'Chelsea FC', apiTeamId: 49, country: 'Angleterre', aliases: ['Chelsea'] },
  { name: 'Arsenal FC', apiTeamId: 42, country: 'Angleterre', aliases: ['Arsenal'] },
  { name: 'Tottenham Hotspur', apiTeamId: 47, country: 'Angleterre', aliases: ['Tottenham', 'Spurs'] },
  { name: 'Newcastle United', apiTeamId: 34, country: 'Angleterre', aliases: ['Newcastle'] },
  { name: 'Aston Villa', apiTeamId: 66, country: 'Angleterre', aliases: ['Villa'] },
  { name: 'West Ham United', apiTeamId: 48, country: 'Angleterre', aliases: ['West Ham'] },
  { name: 'FC Bayern Munich', apiTeamId: 157, country: 'Allemagne', aliases: ['Bayern', 'Bayern Munich'], featured: true },
  { name: 'Borussia Dortmund', apiTeamId: 165, country: 'Allemagne', aliases: ['Dortmund', 'BVB'], featured: true },
  { name: 'RB Leipzig', apiTeamId: 173, country: 'Allemagne', aliases: ['Leipzig'] },
  { name: 'Bayer Leverkusen', apiTeamId: 168, country: 'Allemagne', aliases: ['Leverkusen'] },
  { name: 'Eintracht Frankfurt', apiTeamId: 169, country: 'Allemagne', aliases: ['Frankfurt'] },
  { name: 'Juventus FC', apiTeamId: 496, country: 'Italie', aliases: ['Juve', 'Juventus'], featured: true },
  { name: 'Inter Milan', apiTeamId: 505, country: 'Italie', aliases: ['Inter', 'Internazionale'], featured: true },
  { name: 'AC Milan', apiTeamId: 489, country: 'Italie', aliases: ['Milan', 'Milano'], featured: true },
  { name: 'SSC Napoli', apiTeamId: 492, country: 'Italie', aliases: ['Napoli', 'Naples'] },
  { name: 'AS Roma', apiTeamId: 497, country: 'Italie', aliases: ['Roma'] },
  { name: 'SS Lazio', apiTeamId: 487, country: 'Italie', aliases: ['Lazio'] },
  { name: 'Ajax Amsterdam', apiTeamId: 194, country: 'Pays-Bas', aliases: ['Ajax'] },
  { name: 'PSV Eindhoven', apiTeamId: 197, country: 'Pays-Bas', aliases: ['PSV'] },
  { name: 'Feyenoord', apiTeamId: 209, country: 'Pays-Bas', aliases: [] },
  { name: 'SL Benfica', apiTeamId: 211, country: 'Portugal', aliases: ['Benfica'] },
  { name: 'FC Porto', apiTeamId: 212, country: 'Portugal', aliases: ['Porto'] },
  { name: 'Sporting CP', apiTeamId: 228, country: 'Portugal', aliases: ['Sporting', 'Sporting Lisbonne'] },
  { name: 'Celtic FC', apiTeamId: 247, country: 'Écosse', aliases: ['Celtic'] },
  { name: 'Rangers FC', apiTeamId: 257, country: 'Écosse', aliases: ['Rangers'] },
  { name: 'Galatasaray SK', apiTeamId: 645, country: 'Turquie', aliases: ['Galatasaray', 'Gala'] },
  { name: 'Fenerbahçe SK', apiTeamId: 611, country: 'Turquie', aliases: ['Fenerbahce', 'Fener'] },
  { name: 'Club Brugge KV', apiTeamId: 569, country: 'Belgique', aliases: ['Brugge', 'Club Brugge'] },
  { name: 'Red Bull Salzburg', apiTeamId: 571, country: 'Autriche', aliases: ['Salzburg'] },
  { name: 'Olympiacos FC', apiTeamId: 553, country: 'Grèce', aliases: ['Olympiacos'] },
  { name: 'Boca Juniors', apiTeamId: 451, country: 'Argentine', aliases: ['Boca'] },
  { name: 'River Plate', apiTeamId: 435, country: 'Argentine', aliases: ['River'] },
  { name: 'CR Flamengo', apiTeamId: 127, country: 'Brésil', aliases: ['Flamengo'] },
  { name: 'SE Palmeiras', apiTeamId: 121, country: 'Brésil', aliases: ['Palmeiras'] },
  { name: 'Inter Miami CF', apiTeamId: 9568, country: 'États-Unis', aliases: ['Inter Miami', 'Miami'] },
  { name: 'Al Nassr FC', apiTeamId: 2939, country: 'Arabie saoudite', aliases: ['Al Nassr', 'Nassr'] },
  { name: 'Al Hilal SFC', apiTeamId: 2932, country: 'Arabie saoudite', aliases: ['Al Hilal', 'Hilal'] },
];

function clubToHit(club: PopularClubEntry): ExternalTeamHit {
  const id =
    club.apiTeamId != null
      ? worldTeamFollowIdFromApiId(club.apiTeamId)
      : worldTeamFollowIdFromName(club.name);
  return {
    id,
    apiTeamId: club.apiTeamId,
    name: club.name,
    country: club.country,
  };
}

function entrySearchKeys(club: PopularClubEntry): string[] {
  const keys = [club.name, ...(club.aliases ?? [])].map(normalizeTeamKey);
  return keys.filter(Boolean);
}

function queryMatchesEntry(query: string, club: PopularClubEntry): boolean {
  const q = normalizeTeamKey(query);
  if (q.length < 2) return false;
  return entrySearchKeys(club).some(
    (key) => key.includes(q) || q.includes(key) || key.split(' ').some((word) => word.startsWith(q)),
  );
}

/** Clubs populaires affichés sans saisie (chips accueil / recherche). */
export function getFeaturedPopularClubs(limit = 12): ExternalTeamHit[] {
  const featured = SUPPORTER_POPULAR_CLUBS.filter((c) => c.featured);
  return featured.slice(0, limit).map(clubToHit);
}

/** Résout l’id API-Football d’un nom d’équipe (mock / alias). */
export function resolvePopularClubApiIdByName(name: string): number | undefined {
  const key = normalizeTeamKey(name);
  for (const club of SUPPORTER_POPULAR_CLUBS) {
    if (club.apiTeamId == null) continue;
    const keys = [club.name, ...(club.aliases ?? [])].map(normalizeTeamKey);
    if (keys.includes(key)) return club.apiTeamId;
  }
  return undefined;
}

/** Recherche locale sur la liste curatée — fonctionne offline / sans clé API. */
export function searchCuratedPopularClubs(query: string, limit = 12): ExternalTeamHit[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const hits: ExternalTeamHit[] = [];
  const seen = new Set<string>();
  for (const club of SUPPORTER_POPULAR_CLUBS) {
    if (!queryMatchesEntry(q, club)) continue;
    const hit = clubToHit(club);
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    hits.push(hit);
    if (hits.length >= limit) break;
  }
  return hits;
}

/** Fusionne des hits API / mock avec la liste curatée (curated en premier). */
export function mergeTeamSearchHits(
  curated: ExternalTeamHit[],
  extra: ExternalTeamHit[],
  limit = 12,
): ExternalTeamHit[] {
  const seen = new Set<string>();
  const merged: ExternalTeamHit[] = [];
  for (const hit of [...curated, ...extra]) {
    const key = hit.id || normalizeTeamKey(hit.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
    if (merged.length >= limit) break;
  }
  return merged;
}
