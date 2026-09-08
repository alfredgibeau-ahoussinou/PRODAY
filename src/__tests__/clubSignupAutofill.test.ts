import {
  buildClubSignupAutofill,
  formatClubAutofillSummary,
} from '../utils/clubSignupAutofill';
import { buildSignupSteps } from '../screens/signup/signupFlowConfig';

describe('club signup autofill', () => {
  const melun = {
    id: 'dofa_123',
    dofaId: '123',
    name: 'MELUN FC',
    fffNumber: '542557',
    city: 'Melun',
    postalCode: '77000',
    department: '77',
    region: 'Île-de-France',
    league: 'District Seine-et-Marne',
    categories: [] as string[],
    source: 'fff_dofa' as const,
  };

  it('préremplit nom, n° FFF, ville et lieu depuis DOFA sans inventer', () => {
    const fill = buildClubSignupAutofill(melun, ['Seniors R2', 'U17 R1']);
    expect(fill.structureName).toBe('MELUN FC');
    expect(fill.fffNumber).toBe('542557');
    expect(fill.city).toBe('Melun');
    expect(fill.postalCode).toBe('77000');
    expect(fill.department).toBe('77');
    expect(fill.league).toBe('District Seine-et-Marne');
    expect(fill.teams).toEqual(['Seniors R2', 'U17 R1']);
  });

  it('laisse vides les champs absents chez DOFA', () => {
    const sparse = buildClubSignupAutofill({
      ...melun,
      city: '',
      postalCode: '',
      department: '',
      region: '',
      league: '',
      fffNumber: '',
    });
    expect(sparse.city).toBe('');
    expect(sparse.fffNumber).toBe('');
    expect(sparse.league).toBe('');
    expect(sparse.structureName).toBe('MELUN FC');
  });

  it('formate un résumé lisible pour la fiche auto', () => {
    const lines = formatClubAutofillSummary(buildClubSignupAutofill(melun, ['Seniors R2']));
    expect(lines[0]).toBe('MELUN FC');
    expect(lines.some((l) => l.includes('542557'))).toBe(true);
    expect(lines.some((l) => /équipe/i.test(l))).toBe(true);
  });

  it('parcours club : trouver le club FFF d’abord, puis compte admin', () => {
    expect(
      buildSignupSteps('staff', { role: 'club', parentalRequired: false })
    ).toEqual(['club_pro', 'account', 'security', 'launch']);
  });
});
