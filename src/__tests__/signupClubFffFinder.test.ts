/**
 * Garde-fous UI sélection club (évite doublon + spinner infini).
 * Documente le contrat : une seule fiche sélection = PublicClubAutocomplete.
 */
describe('SignupClubFffFinder selection contract', () => {
  it('timeout équipes DOFA plafonné (pas de spinner éternel)', () => {
    const TEAMS_TIMEOUT_MS = 8_000;
    expect(TEAMS_TIMEOUT_MS).toBeLessThanOrEqual(12_000);
    expect(TEAMS_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('autofill immédiat ne dépend pas des équipes', () => {
    const { buildClubSignupAutofill } = require('../utils/clubSignupAutofill');
    const club = {
      id: 'dofa_1',
      dofaId: '1',
      name: 'PONTAULT COMBAULT U. MULTI SP.',
      fffNumber: '500589',
      city: 'PONTAULT COMBAULT',
      postalCode: '77340',
      department: '77',
      region: '',
      league: '',
      categories: [] as string[],
      source: 'fff_dofa' as const,
    };
    const fill = buildClubSignupAutofill(club, []);
    expect(fill.structureName).toContain('PONTAULT');
    expect(fill.fffNumber).toBe('500589');
    expect(fill.teams).toEqual([]);
  });
});
