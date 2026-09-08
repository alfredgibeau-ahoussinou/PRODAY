import {
  fffOfficialRegistryService,
  extractDofaMembers,
  mapDofaClubToOfficial,
  FffOfficialRegistryError,
} from '../services/fffOfficialRegistry.service';

describe('fffOfficialRegistryService (sources FFF réelles uniquement)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('extrait les membres hydra d’une réponse DOFA', () => {
    const members = extractDofaMembers({
      'hydra:member': [
        { cl_no: 21217, cl_name: 'MONTROUGE FC 92', cl_code: '548221', cl_city: 'Montrouge', cl_zip: '92120' },
        { cl_no: 100, cl_nom: 'JS SURESNES', cl_cod: 500744, cl_loca: 'Suresnes', cl_cp: '92150' },
      ],
      'hydra:totalItems': 2,
    });
    expect(members).toHaveLength(2);
  });

  it('mappe un club DOFA sans inventer de n° d’affiliation', () => {
    const club = mapDofaClubToOfficial({
      cl_no: 21217,
      cl_name: 'MONTROUGE FC 92',
      cl_code: '548221',
      cl_city: 'Montrouge',
      cl_zip: '92120',
    });
    expect(club).not.toBeNull();
    expect(club?.name).toBe('MONTROUGE FC 92');
    expect(club?.fffNumber).toBe('548221');
    expect(club?.city).toBe('Montrouge');
    expect(club?.department).toBe('92');
    expect(club?.source).toBe('fff_dofa');
    expect(club?.id).toBe('dofa_21217');
  });

  it('refuse une recherche trop courte (pas de dump / seed)', async () => {
    global.fetch = jest.fn();
    const results = await fffOfficialRegistryService.searchOfficialClubs('m');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('recherche des clubs via l’API DOFA FFF (réponse live mockée)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        'hydra:member': [
          {
            cl_no: 999,
            cl_name: 'JS SURESNES',
            cl_code: '500744',
            cl_city: 'Suresnes',
            cl_zip: '92150',
          },
        ],
      }),
    });

    const results = await fffOfficialRegistryService.searchOfficialClubs('Suresnes');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('JS SURESNES');
    expect(results[0].fffNumber).toBe('500744');
    expect(results[0].source).toBe('fff_dofa');
    expect(String(global.fetch).length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalled();
    const calledUrl = String((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(calledUrl).toContain('/clubs.json?filter=Suresnes');
  });

  it('propage une erreur honnête si DOFA est indisponible (pas de fallback inventé)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(fffOfficialRegistryService.searchOfficialClubs('Paris')).rejects.toBeInstanceOf(
      FffOfficialRegistryError
    );
  });

  it('charge les catégories depuis /equipes DOFA sans liste bidon', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        'hydra:member': [
          { name: 'Seniors D1' },
          { short_name: 'U17 R1' },
          { name: 'Seniors D1' },
        ],
      }),
    });

    const cats = await fffOfficialRegistryService.getCategoriesForClub({
      id: 'dofa_1',
      dofaId: '1',
      name: 'Test FC',
      fffNumber: '123',
      city: 'Paris',
      postalCode: '75000',
      department: '75',
      region: 'Île-de-France',
      league: 'FFF',
      categories: [],
      source: 'fff_dofa',
    });

    expect(cats).toEqual(['Seniors D1', 'U17 R1']);
  });

  it('retourne un roster vide sans inventer de licenciés', async () => {
    const roster = await fffOfficialRegistryService.getRosterForTeam('dofa_unknown', 'Seniors D1', {
      name: 'Club Inexistant XYZ',
      city: 'Nowhere',
      fffNumber: '',
    });
    expect(roster).toEqual([]);
  });

  it('n’expose plus addCustomClub ni liste seed OFFICIAL_FFF_CLUBS', () => {
    const svc = fffOfficialRegistryService as Record<string, unknown>;
    expect(svc.addCustomClub).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../services/fffOfficialRegistry.service');
    expect(mod.OFFICIAL_FFF_CLUBS).toBeUndefined();
    expect(mod.DEFAULT_OFFICIAL_CATEGORIES).toBeUndefined();
  });
});
