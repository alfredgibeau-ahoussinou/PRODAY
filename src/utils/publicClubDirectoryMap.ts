import type { OfficialFffClub } from '../services/fffOfficialRegistry.service';
import type {
  PublicClubClaimStatus,
  PublicClubDirectoryEntry,
  PublicClubDirectorySource,
} from '../models/PublicClubDirectory';
import {
  buildClubSearchHaystack,
  buildClubSearchPrefixes,
  normalizeClubSearchText,
} from './publicClubSearch';

export function officialFffClubFromDirectory(
  entry: PublicClubDirectoryEntry,
): OfficialFffClub {
  return {
    id: entry.dofa_id ? `dofa_${entry.dofa_id}` : `fff_${entry.fff_affiliation_number}`,
    dofaId: entry.dofa_id,
    name: entry.name,
    fffNumber: entry.fff_affiliation_number,
    city: entry.city,
    postalCode: entry.postal_code,
    department: entry.department,
    region: entry.region ?? '',
    league: entry.league ?? '',
    categories: [],
    logoUrl: entry.logo_url?.trim() || null,
    source: 'fff_dofa',
  };
}

export function directoryPayloadFromOfficial(
  club: OfficialFffClub,
  extras?: {
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    claim_status?: PublicClubClaimStatus;
    proday_club_id?: string | null;
    source?: PublicClubDirectorySource;
  },
): Omit<PublicClubDirectoryEntry, 'created_at' | 'updated_at'> | null {
  const fff = club.fffNumber?.trim();
  if (!fff) return null;
  const name = club.name?.trim() || '';
  if (!name) return null;
  const city = club.city?.trim() || '';
  const postal = club.postalCode?.trim() || '';
  const department = club.department?.trim() || '';
  const logo =
    extras?.logo_url?.trim() ||
    club.logoUrl?.trim() ||
    null;
  return {
    fff_affiliation_number: fff,
    dofa_id: club.dofaId,
    name,
    name_normalized: normalizeClubSearchText(name),
    city,
    city_normalized: normalizeClubSearchText(city),
    postal_code: postal,
    department,
    region: club.region || undefined,
    league: club.league || undefined,
    logo_url: logo,
    primary_color: extras?.primary_color ?? null,
    secondary_color: extras?.secondary_color ?? null,
    search_prefixes: buildClubSearchPrefixes([name, city, postal, department, fff]),
    search_haystack: buildClubSearchHaystack({
      name,
      city,
      postalCode: postal,
      department,
      fffNumber: fff,
      league: club.league,
    }),
    claim_status: extras?.claim_status ?? 'unclaimed',
    proday_club_id: extras?.proday_club_id ?? null,
    source: extras?.source ?? 'fff_dofa',
  };
}
