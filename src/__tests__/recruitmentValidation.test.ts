import {
  validateCoverLetter,
  validateRecruitmentPostInput,
  MIN_COVER_LETTER,
  MAX_COVER_LETTER,
} from '../utils/recruitmentValidation';

describe('recruitmentValidation', () => {
  it('valide une lettre de motivation', () => {
    const letter = 'a'.repeat(MIN_COVER_LETTER);
    expect(validateCoverLetter(letter)).toBe(letter);
  });

  it('refuse une lettre trop courte', () => {
    expect(() => validateCoverLetter('court')).toThrow(/trop courte/);
  });

  it('refuse une lettre trop longue', () => {
    expect(() => validateCoverLetter('a'.repeat(MAX_COVER_LETTER + 1))).toThrow(/trop longue/);
  });

  it('valide les champs annonce', () => {
    const out = validateRecruitmentPostInput({
      title: 'Recherche ailier',
      position: 'Ailier',
      category: 'Seniors',
      level: 'R1',
      city: 'Lyon',
      description: 'Description courte',
    });
    expect(out.city).toBe('Lyon');
  });
});
