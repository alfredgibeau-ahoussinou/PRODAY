import { parseFootclubsCsv, detectCsvDelimiter } from '../features/club/utils/footclubsCsvParser';

describe('Import Squad CSV', () => {
  it('détecte séparateur point-virgule FootClubs', () => {
    expect(detectCsvDelimiter('Licence;Nom;Prénom;Catégorie')).toBe(';');
  });

  it('parse un export FootClubs minimal', () => {
    const csv = [
      'Licence;Nom;Prénom;Catégorie;Email',
      '123456;Dupont;Alex;Seniors R1;alex@example.com',
      '789012;Martin;Léa;U17;lea@example.com',
    ].join('\n');
    const res = parseFootclubsCsv(csv);
    expect(res.success).toBe(true);
    expect(res.rows).toHaveLength(2);
    expect(res.rows[0]?.displayName).toContain('Dupont');
    expect(res.rows[0]?.category).toMatch(/Seniors/i);
    expect(res.rows[1]?.licenseNumber).toBe('789012');
  });

  it('signale une erreur si colonnes obligatoires absentes', () => {
    const res = parseFootclubsCsv('Foo;Bar\n1;2');
    expect(res.success).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
