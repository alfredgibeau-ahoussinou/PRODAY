import {
  listHealthPrograms,
  pickMentalProgram,
  programProgress,
} from '../features/v3/engines/healthProgram.engine';

describe('healthProgram mental', () => {
  it('inclut le programme mental dans le catalogue', () => {
    const ids = listHealthPrograms().map((p) => p.id);
    expect(ids).toContain('mental');
  });

  it('programme mental. 7 jours', () => {
    const mental = pickMentalProgram();
    expect(mental.id).toBe('mental');
    expect(mental.days).toHaveLength(7);
    expect(mental.days[0].title).toBe('Respiration');
  });

  it('progression mental', () => {
    expect(programProgress([1, 2, 3])).toBe(43);
    expect(programProgress([1, 2, 3, 4, 5, 6, 7])).toBe(100);
  });
});
