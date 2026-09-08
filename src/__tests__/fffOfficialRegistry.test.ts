import {
  fffOfficialRegistryService,
  extractDofaMembers,
  mapDofaClubToOfficial,
  buildSearchQueryVariants,
  FffOfficialRegistryError,
} from '../services/fffOfficialRegistry.service';

describe('fffOfficialRegistryService (sources FFF réelles uniquement)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('génère des variantes de recherche (accents, tirets, Le Mée)', () => {
    const variants = buildSearchQueryVariants('Le Mée-sur-Seine');
    expect(variants.some((v) => /mee/i.test(v))).toBe(true);
    expect(variants.some((v) => /seine/i.test(v))).toBe(true);
  });

  it('extrait les membres hydra d’une réponse DOFA', () => {
    const members = extractDofaMembers({
      'hydra:member': [
        {
          cl_no: 22065,
          name: 'MELUN F.C.',
          affiliation_number: 542557,
          location: 'MELUN',
          postal_code: '77000',
        },
      ],
      'hydra:totalItems': 1,
    });
    expect(members).toHaveLength(1);
  });

  it('mappe un club DOFA moderne (name / affiliation_number / location)', () => {
    const club = mapDofaClubToOfficial({
      cl_no: 22065,
      name: 'MELUN F.C.',
      affiliation_number: 542557,
      location: 'MELUN',
      postal_code: '77000',
      department_code: 77,
      district: { name: 'DISTRICT SEINE ET MARNE' },
    });
    expect(club).not.toBeNull();
    expect(club?.name).toBe('MELUN F.C.');
    expect(club?.fffNumber).toBe('542557');
    expect(club?.city).toBe('MELUN');
    expect(club?.postalCode).toBe('77000');
    expect(club?.department).toBe('77');
    expect(club?.league).toBe('DISTRICT SEINE ET MARNE');
    expect(club?.source).toBe('fff_dofa');
    expect(club?.id).toBe('dofa_22065');
  });

  it('refuse une recherche trop courte (pas de dump / seed)', async () => {
    global.fetch = jest.fn();
    const results = await fffOfficialRegistryService.searchOfficialClubs('m');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('recherche Melun via geo.gouv → cl_cp DOFA (pas filter= ignoré)', async () => {
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('geo.api.gouv.fr')) {
        return {
          ok: true,
          headers: { get: () => 'application/json' },
          text: async () =>
            JSON.stringify([
              {
                nom: 'Melun',
                codesPostaux: ['77000'],
                departement: { code: '77' },
                population: 40000,
              },
            ]),
        };
      }
      if (u.includes('cl_cp=77000')) {
        return {
          ok: true,
          headers: { get: () => 'application/json' },
          text: async () =>
            JSON.stringify([
              {
                cl_no: 22065,
                name: 'MELUN F.C.',
                affiliation_number: 542557,
                location: 'MELUN',
                postal_code: '77000',
                department_code: 77,
                district: { name: 'DISTRICT SEINE ET MARNE' },
              },
              {
                cl_no: 154321,
                name: 'MELUN FUTSAL',
                affiliation_number: 552935,
                location: 'MELUN',
                postal_code: '77000',
                department_code: 77,
              },
            ]),
        };
      }
      return {
        ok: true,
        headers: { get: () => 'application/json' },
        text: async () => '[]',
      };
    });

    const results = await fffOfficialRegistryService.searchOfficialClubs('Melun');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((c) => c.name === 'MELUN F.C.')).toBe(true);
    expect(results.some((c) => c.fffNumber === '542557')).toBe(true);
    const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('geo.api.gouv.fr'))).toBe(true);
    expect(urls.some((u) => u.includes('cl_cp=77000'))).toBe(true);
    expect(urls.some((u) => u.includes('filter=Melun'))).toBe(false);
  });

  it('recherche Le Mée-sur-Seine via code postal 77350', async () => {
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('geo.api.gouv.fr')) {
        return {
          ok: true,
          headers: { get: () => 'application/json' },
          text: async () =>
            JSON.stringify([
              {
                nom: 'Le Mée-sur-Seine',
                codesPostaux: ['77350'],
                departement: { code: '77' },
                population: 20000,
              },
            ]),
        };
      }
      if (u.includes('cl_cp=77350')) {
        return {
          ok: true,
          headers: { get: () => 'application/json' },
          text: async () =>
            JSON.stringify([
              {
                cl_no: 10279,
                name: 'LE MEE S. SECTION F.',
                affiliation_number: 525582,
                location: 'LE MEE SUR SEINE',
                postal_code: '77350',
                department_code: 77,
              },
            ]),
        };
      }
      return {
        ok: true,
        headers: { get: () => 'application/json' },
        text: async () => '[]',
      };
    });

    const results = await fffOfficialRegistryService.searchOfficialClubs('Le mee sur seine');
    expect(results.some((c) => /MEE/i.test(c.name))).toBe(true);
    expect(results[0].city).toMatch(/MEE/i);
  });

  it('recherche par n° d’affiliation via cl_cod', async () => {
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('cl_cod=542557')) {
        return {
          ok: true,
          headers: { get: () => 'application/json' },
          text: async () =>
            JSON.stringify([
              {
                cl_no: 22065,
                name: 'MELUN F.C.',
                affiliation_number: 542557,
                location: 'MELUN',
                postal_code: '77000',
              },
            ]),
        };
      }
      return {
        ok: true,
        headers: { get: () => 'application/json' },
        text: async () => '[]',
      };
    });

    const results = await fffOfficialRegistryService.searchOfficialClubs('542557');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('MELUN F.C.');
  });

  it('propage une erreur honnête si DOFA est indisponible (pas de fallback inventé)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => 'application/json' },
      text: async () => '',
    });

    await expect(fffOfficialRegistryService.searchOfficialClubs('77000')).rejects.toBeInstanceOf(
      FffOfficialRegistryError
    );
  });

  it('charge les catégories depuis /equipes DOFA (category_label)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      text: async () =>
        JSON.stringify([
          {
            category_label: 'U19 - U18 Libre',
            engagements: [{ competition: { name: 'U18 R2' } }],
          },
          { category_label: 'Seniors', engagements: [{ competition: { name: 'R2' } }] },
        ]),
    });

    const cats = await fffOfficialRegistryService.getCategoriesForClub({
      id: 'dofa_22065',
      dofaId: '22065',
      name: 'MELUN F.C.',
      fffNumber: '542557',
      city: 'MELUN',
      postalCode: '77000',
      department: '77',
      region: '',
      league: 'FFF',
      categories: [],
      source: 'fff_dofa',
    });

    expect(cats.length).toBeGreaterThanOrEqual(1);
    expect(cats.some((c) => /U18 R2|U19|Seniors|R2/i.test(c))).toBe(true);
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
  });
});
