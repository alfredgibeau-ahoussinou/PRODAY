jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  uploadAsync: jest.fn(),
  copyAsync: jest.fn(),
  cacheDirectory: 'file:///cache/',
  FileSystemUploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((_storage: unknown, path: string) => ({ fullPath: path })),
  uploadBytes: jest.fn(),
  uploadString: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  firebaseConfig: { storageBucket: 'test-bucket.appspot.com' },
}));

jest.mock('../lib/firebase', () => ({
  getFirebaseStorage: jest.fn(() => ({})),
  getFirebaseAuth: jest.fn(() => ({ currentUser: { uid: 'uid-1' } })),
}));

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
}));

import { callFunction } from '../lib/firebaseFunctions';
import { buildSquadSheetPath, storageService } from '../services/storage.service';
import {
  SQUAD_SHEET_FUNCTION,
  extractSquadSheetCsv,
  normalizeExtraction,
} from '../services/squadSheet.service';
import {
  SCANNED_PDF_HINT,
  SPREADSHEET_HINT,
  classifySheetFile,
  parseImportedSheetText,
  resolvePdfWarnings,
  sheetCategories,
  sheetPreviewNames,
} from '../utils/squadSheetImport';

const callFunctionMock = callFunction as jest.MockedFunction<typeof callFunction>;

const FOOTCLUBS_CSV = [
  'Licence;Nom;Prenom;Categorie;Email',
  '1234567;DUPONT;Jean;U17;jean.dupont@example.com',
  '7654321;MARTIN;Luc;U15;',
].join('\n');

describe('Classement des fichiers d’effectif', () => {
  it('reconnaît CSV, PDF et tableurs', () => {
    expect(classifySheetFile('export-footclubs.csv', 'text/csv')).toBe('csv');
    expect(classifySheetFile('feuille.pdf', 'application/pdf')).toBe('pdf');
    expect(
      classifySheetFile('equipe.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    ).toBe('spreadsheet');
    expect(classifySheetFile('composition.txt', 'text/plain')).toBe('csv');
    expect(classifySheetFile('photo.jpg', 'image/jpeg')).toBe('unknown');
  });

  it('explique quoi faire d’un tableur sans le lire', () => {
    expect(SPREADSHEET_HINT).toMatch(/CSV/);
    expect(SPREADSHEET_HINT).toMatch(/Excel/i);
  });
});

describe('Relecture d’un tableau importé', () => {
  it('relit un export FootClubs via le parseur de licences du pôle Club', () => {
    const parsed = parseImportedSheetText(FOOTCLUBS_CSV);
    expect(parsed.ok).toBe(true);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]?.displayName).toBe('Jean DUPONT');
    expect(parsed.rows[0]?.licenseNumber).toBe('1234567');
    expect(parsed.rows[1]?.category).toBe('U15');
  });

  it('ne prétend pas avoir lu un tableau vide ou inexploitable', () => {
    expect(parseImportedSheetText('').ok).toBe(false);
    expect(parseImportedSheetText('   ').ok).toBe(false);
    expect(parseImportedSheetText('texte libre sans en-tête').ok).toBe(false);
    expect(parseImportedSheetText('Categorie;Licence\nU17;123').ok).toBe(false);
  });

  it('résume l’aperçu sans dépasser les plafonds', () => {
    const parsed = parseImportedSheetText(FOOTCLUBS_CSV);
    expect(sheetCategories(parsed.rows)).toEqual(['U17', 'U15']);
    expect(sheetPreviewNames(parsed.rows)).toEqual(['Jean DUPONT', 'Luc MARTIN']);
  });

  it('remonte un message utile quand le PDF ne contient aucun texte', () => {
    expect(resolvePdfWarnings([])).toEqual([SCANNED_PDF_HINT]);
    expect(resolvePdfWarnings(['  ', 'PDF sans texte exploitable'])).toEqual([
      'PDF sans texte exploitable',
    ]);
  });
});

describe('Conversion d’une feuille PDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dépose le PDF puis appelle la fonction serveur avec son chemin', async () => {
    const uploadSpy = jest
      .spyOn(storageService, 'uploadSquadSheet')
      .mockResolvedValue({ path: 'squad-sheets/uid-1/1700.pdf' });
    callFunctionMock.mockResolvedValue({
      csv: FOOTCLUBS_CSV,
      rows: 2,
      columns: ['Licence', 'Nom', 'Prenom'],
      pages: 1,
      warnings: [],
    } as never);

    const extraction = await extractSquadSheetCsv({
      uid: 'uid-1',
      file: { uri: 'file:///tmp/feuille.pdf', mimeType: 'application/pdf' },
    });

    expect(uploadSpy).toHaveBeenCalledWith('uid-1', {
      uri: 'file:///tmp/feuille.pdf',
      mimeType: 'application/pdf',
    });
    expect(callFunctionMock).toHaveBeenCalledWith(SQUAD_SHEET_FUNCTION, {
      storagePath: 'squad-sheets/uid-1/1700.pdf',
    });
    expect(extraction.rows).toBe(2);
    expect(parseImportedSheetText(extraction.csv).ok).toBe(true);
  });

  it('n’invente aucun joueur quand le serveur ne lit rien', async () => {
    jest
      .spyOn(storageService, 'uploadSquadSheet')
      .mockResolvedValue({ path: 'squad-sheets/uid-1/1700.pdf' });
    callFunctionMock.mockResolvedValue({ csv: '', rows: 0, warnings: ['PDF scanné'] } as never);

    const extraction = await extractSquadSheetCsv({
      uid: 'uid-1',
      file: { uri: 'file:///tmp/scan.pdf', mimeType: 'application/pdf' },
    });

    expect(extraction.rows).toBe(0);
    expect(extraction.csv).toBe('');
    expect(resolvePdfWarnings(extraction.warnings)).toEqual(['PDF scanné']);
  });

  it('normalise une réponse partielle ou aberrante', () => {
    expect(normalizeExtraction(undefined)).toEqual({
      csv: '',
      rows: 0,
      columns: [],
      pages: 0,
      warnings: [],
    });
    expect(
      normalizeExtraction({ csv: 'Nom\nA', rows: Number.NaN, columns: [1, 'Nom'], warnings: ['', 'ok'] }),
    ).toEqual({ csv: 'Nom\nA', rows: 0, columns: ['Nom'], pages: 0, warnings: ['ok'] });
  });

  it('place la feuille dans le dossier de son auteur', () => {
    expect(buildSquadSheetPath('uid-9', 42)).toBe('squad-sheets/uid-9/42.pdf');
    expect(buildSquadSheetPath('uid-9', 42).startsWith('squad-sheets/')).toBe(true);
  });
});
