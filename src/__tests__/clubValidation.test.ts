import { validateClubInput } from '../utils/clubValidation';

describe('clubValidation', () => {
  it('valide un club', () => {
    const out = validateClubInput({
      name: 'FC Test',
      city: 'Lyon',
      categories: ['Seniors', 'U19'],
    });
    expect(out.name).toBe('FC Test');
    expect(out.categories).toHaveLength(2);
  });

  it('refuse sans catégorie', () => {
    expect(() =>
      validateClubInput({
        name: 'FC Test',
        city: 'Lyon',
        categories: [],
      }),
    ).toThrow(/catégorie/);
  });
});
