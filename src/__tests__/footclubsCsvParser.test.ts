import {
  parseFootclubsCsv,
  detectCsvDelimiter,
  exportLicensesToCsv,
} from '../features/club/utils/footclubsCsvParser';

describe('footclubsCsvParser', () => {
  it('détecte le séparateur point-virgule ou virgule', () => {
    expect(detectCsvDelimiter('Numéro Licence;Nom;Prénom;Date Naissance')).toBe(';');
    expect(detectCsvDelimiter('Numéro Licence,Nom,Prénom,Date Naissance')).toBe(',');
    expect(detectCsvDelimiter('Numéro Licence\tNom\tPrénom\tDate Naissance')).toBe('\t');
  });

  it('parse un export CSV Footclubs avec point-virgule et accents', () => {
    const csvData = `Numéro Licence;Nom;Prénom;Date de Naissance;Catégorie;Email;Certificat Médical
2548963210;Diallo;Moussa;12/03/2007;U17;moussa.diallo@test.com;Valide
2548963211;Martin;Lucas;05/09/2009;U15;;Oui
2548963212;Dupont;Arthur;22/01/2004;Seniors;arthur@test.com;Non`;

    const result = parseFootclubsCsv(csvData);
    expect(result.success).toBe(true);
    expect(result.validRowsCount).toBe(3);
    expect(result.rows[0]).toMatchObject({
      licenseNumber: '2548963210',
      lastName: 'Diallo',
      firstName: 'Moussa',
      displayName: 'Moussa Diallo',
      category: 'U17',
      email: 'moussa.diallo@test.com',
      medicalValid: true,
    });
    expect(result.rows[1].medicalValid).toBe(true);
    expect(result.rows[2].medicalValid).toBe(false);
  });

  it('gère les lignes vides ou avec espaces', () => {
    const csvData = `Licence,Nom,Prénom,Catégorie
12345,Koné,Ibrahim,U19

67890,Petit,Hugo,U15
`;

    const result = parseFootclubsCsv(csvData);
    expect(result.success).toBe(true);
    expect(result.validRowsCount).toBe(2);
    expect(result.rows[0].displayName).toBe('Ibrahim Koné');
    expect(result.rows[1].displayName).toBe('Hugo Petit');
  });

  it('retourne une erreur explicite si le header est manquant', () => {
    const csvData = `Bonjour tout le monde
123,456,789`;

    const result = parseFootclubsCsv(csvData);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('génère un export CSV correct', () => {
    const players = [
      {
        displayName: 'Moussa Diallo',
        email: 'moussa@test.com',
        licenseNumber: '2548963210',
        category: 'U17',
        verified: true,
      },
      {
        displayName: 'Lucas Martin',
        email: 'lucas@test.com',
        licenseNumber: '2548963211',
        category: 'U15',
        verified: false,
      },
    ];

    const exported = exportLicensesToCsv(players);
    expect(exported).toContain('Licence FFF;Nom Complet;Email;Catégorie;Statut');
    expect(exported).toContain('"2548963210";"Moussa Diallo";"moussa@test.com";"U17";"Valide"');
    expect(exported).toContain('"2548963211";"Lucas Martin";"lucas@test.com";"U15";"À vérifier"');
  });
});
