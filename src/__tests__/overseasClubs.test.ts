import {
  overseasClubsService,
  OVERSEAS_TERRITORIES,
  toOfficialFffClub,
} from '../services/overseasClubs.service';

describe('overseasClubsService (Section 24 - Répertoire Outre-Mer 11 Territoires)', () => {
  it('couvre l’intégralité des 11 territoires ultramarins spécifiés', () => {
    const territories = overseasClubsService.getTerritories();
    expect(territories.length).toBe(11);

    const codes = territories.map((t) => t.code);
    expect(codes).toContain('971'); // Guadeloupe
    expect(codes).toContain('972'); // Martinique
    expect(codes).toContain('973'); // Guyane
    expect(codes).toContain('974'); // La Réunion
    expect(codes).toContain('976'); // Mayotte
    expect(codes).toContain('978'); // Saint-Martin
    expect(codes).toContain('977'); // Saint-Barthélemy
    expect(codes).toContain('975'); // Saint-Pierre-et-Miquelon
    expect(codes).toContain('988'); // Nouvelle-Calédonie
    expect(codes).toContain('987'); // Polynésie
    expect(codes).toContain('986'); // Wallis-et-Futuna
  });

  it('recherche des clubs de la Martinique (972)', () => {
    const clubs = overseasClubsService.searchOverseasClubs('', '972');
    expect(clubs.length).toBeGreaterThanOrEqual(4);

    const names = clubs.map((c) => c.name);
    expect(names).toContain('Club Franciscain');
    expect(names).toContain('Golden Lion de Saint-Joseph');
    expect(clubs.every((c) => c.department === '972')).toBe(true);
  });

  it('recherche des clubs de La Réunion (974)', () => {
    const clubs = overseasClubsService.searchOverseasClubs('', '974');
    expect(clubs.length).toBeGreaterThanOrEqual(4);

    const jssp = clubs.find((c) => c.name.includes('Saint-Pierroise'));
    expect(jssp).toBeDefined();
    expect(jssp?.city).toBe('Saint-Pierre');
    expect(jssp?.postalCode).toBe('97410');
  });

  it('recherche textuelle transverse sur les clubs d’outre-mer', () => {
    const results = overseasClubsService.searchOverseasClubs('Kourou');
    expect(results.length).toBeGreaterThanOrEqual(1);

    const geldar = results[0];
    expect(geldar.name).toContain('Geldar');
    expect(geldar.city).toBe('Kourou');
    expect(geldar.department).toBe('973');
  });

  it('génère un club non répertorié "Mon club n\'apparaît pas" sans bloquer l’inscription', () => {
    const unlisted = overseasClubsService.createUnlistedClub({
      name: 'AS Dragon de Sainte-Rose',
      territoryCodeOrDepartment: '971',
      city: 'Sainte-Rose',
      postalCode: '97115',
      estimatedDivision: 'Régionale 2',
    });

    expect(unlisted).toBeDefined();
    expect(unlisted.name).toBe('AS Dragon de Sainte-Rose');
    expect(unlisted.city).toBe('Sainte-Rose');
    expect(unlisted.postalCode).toBe('97115');
    expect(unlisted.department).toBe('971');
    expect(unlisted.region).toBe('Guadeloupe');
    expect(unlisted.categories).toContain('Régionale 2');
    expect(unlisted.source).toBe('fff_dofa');
    expect(unlisted.fffNumber).toMatch(/^CUSTOM-/);
  });
});
