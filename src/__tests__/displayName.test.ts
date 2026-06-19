import { firstNameFromDisplayName } from '../utils/displayName';

describe('firstNameFromDisplayName', () => {
  it('extrait le prénom', () => {
    expect(firstNameFromDisplayName('Jean Dupont')).toBe('Jean');
    expect(firstNameFromDisplayName('marie-claire Martin')).toBe('Marie-claire');
  });

  it('gère les valeurs vides', () => {
    expect(firstNameFromDisplayName('')).toBe('');
    expect(firstNameFromDisplayName(null)).toBe('');
  });
});
