import {
  buildClubSearchHaystack,
  buildClubSearchPrefixes,
  normalizeClubSearchText,
  pickDirectorySearchPrefix,
  scorePublicClubMatch,
} from '../utils/publicClubSearch';
import {
  directoryPayloadFromOfficial,
  officialFffClubFromDirectory,
} from '../utils/publicClubDirectoryMap';
import type { OfficialFffClub } from '../services/fffOfficialRegistry.service';
import type { PublicClubDirectoryEntry } from '../models/PublicClubDirectory';

describe('publicClubSearch', () => {
  it('normalise accents et tirets', () => {
    expect(normalizeClubSearchText('Le Mée-sur-Seine')).toBe('le mee sur seine');
  });

  it('score « US Melun » vs « Melun FC »', () => {
    const hay = buildClubSearchHaystack({
      name: 'Football Club de Melun',
      city: 'Melun',
      postalCode: '77000',
      department: '77',
      fffNumber: '123456',
    });
    const name = normalizeClubSearchText('Football Club de Melun');
    expect(scorePublicClubMatch('Melun', hay, name)).toBeGreaterThanOrEqual(70);
    expect(scorePublicClubMatch('US Melun', hay, name)).toBeGreaterThanOrEqual(35);
  });

  it('génère des préfixes indexables sans PII', () => {
    const prefixes = buildClubSearchPrefixes(['Melun FC', '77000', '77', '550001']);
    expect(prefixes).toEqual(expect.arrayContaining(['me', 'mel', '77', '770', '55']));
  });

  it('pickDirectorySearchPrefix privilégie CP ou token nom', () => {
    expect(pickDirectorySearchPrefix('77000')).toBe('77000');
    expect(pickDirectorySearchPrefix('Melun')).toBe('melu');
  });
});

describe('publicClubDirectory mapping', () => {
  const sample: OfficialFffClub = {
    id: 'dofa_1',
    dofaId: '1',
    name: 'US Melun',
    fffNumber: '550001',
    city: 'Melun',
    postalCode: '77000',
    department: '77',
    region: 'IDF',
    league: 'District 77',
    categories: [],
    logoUrl: 'https://cdn.example/melun.png',
    source: 'fff_dofa',
  };

  it('payload directory sans champs perso', () => {
    const payload = directoryPayloadFromOfficial(sample);
    expect(payload).not.toBeNull();
    expect(payload!.fff_affiliation_number).toBe('550001');
    expect(payload!.claim_status).toBe('unclaimed');
    expect(payload!.logo_url).toBe('https://cdn.example/melun.png');
    expect(payload).not.toHaveProperty('members');
    expect(payload).not.toHaveProperty('claimed_by_uid');
  });

  it('round-trip OfficialFffClub ↔ directory conserve logo_url', () => {
    const payload = directoryPayloadFromOfficial(sample)!;
    const entry: PublicClubDirectoryEntry = { ...payload };
    const back = officialFffClubFromDirectory(entry);
    expect(back.fffNumber).toBe('550001');
    expect(back.name).toBe('US Melun');
    expect(back.city).toBe('Melun');
    expect(back.logoUrl).toBe('https://cdn.example/melun.png');
    expect(back.source).toBe('fff_dofa');
  });
});
