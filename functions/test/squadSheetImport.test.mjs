import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateSync } from 'node:zlib';

import { extractTextFromPdf } from '../lib/pdfText.js';
import { buildSheetCsv, splitCells } from '../lib/squadSheetText.js';
import {
  SquadSheetError,
  assertOwnSquadSheetPath,
  callerClubId,
  extractSquadSheetFromStorage,
} from '../lib/squadSheetExtract.js';

/** Fabrique un PDF minimal à partir d'objets indirects (sans xref : inutile ici). */
function buildPdf(objects) {
  const parts = ['%PDF-1.4\n'];
  for (const object of objects) {
    parts.push(`${object.num} 0 obj\n${object.body}\n`);
    if (object.stream) {
      parts.push('stream\n');
      parts.push(object.stream);
      parts.push('\nendstream\n');
    }
    parts.push('endobj\n');
  }
  parts.push('trailer\n<< /Root 1 0 R >>\n%%EOF\n');
  return Buffer.concat(parts.map((part) => (Buffer.isBuffer(part) ? part : Buffer.from(part, 'latin1'))));
}

const SHEET_LINES = [
  '(Nom;Prenom;Licence;Categorie) Tj',
  '0 -14 Td (DUPONT;Jean;1234567;U17) Tj',
  '0 -14 Td (MARTIN;Luc;7654321;U15) Tj',
];

function textContent(lines) {
  return Buffer.from(`BT\n/F1 10 Tf\n40 700 Td\n${lines.join('\n')}\nET\n`, 'latin1');
}

function simplePdf({ content, fontObject, extraObjects = [] }) {
  const contentObject = {
    num: 5,
    body: content.filtered
      ? `<< /Length ${content.bytes.length} /Filter /FlateDecode >>`
      : `<< /Length ${content.bytes.length} >>`,
    stream: content.bytes,
  };
  return buildPdf([
    { num: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    { num: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    {
      num: 3,
      body: '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    },
    { num: 4, body: fontObject },
    ...extraObjects,
    contentObject,
  ]);
}

const SIMPLE_FONT = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';

const COMPOSITE_FONT =
  '<< /Type /Font /Subtype /Type0 /BaseFont /ABCDEF+Helvetica /Encoding /Identity-H /DescendantFonts [6 0 R] /ToUnicode 9 0 R >>';

const TO_UNICODE = Buffer.from(
  [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange',
    '6 beginbfchar',
    '<0048> <0044>',
    '<0049> <0075>',
    '<004A> <0070>',
    '<004B> <006F>',
    '<004C> <006E>',
    '<004D> <0074>',
    'endbfchar',
    'endcmap',
    'end',
    'end',
  ].join('\n'),
  'latin1',
);

test('extrait le texte d’un PDF non compressé', () => {
  const bytes = textContent(SHEET_LINES);
  const result = extractTextFromPdf(simplePdf({ content: { bytes }, fontObject: SIMPLE_FONT }));

  assert.equal(result.hasText, true);
  assert.equal(result.pages, 1);
  assert.match(result.text, /DUPONT;Jean;1234567;U17/);
  assert.match(result.text, /MARTIN;Luc;7654321;U15/);
});

test('extrait le texte d’un flux FlateDecode', () => {
  const bytes = deflateSync(textContent(SHEET_LINES));
  const result = extractTextFromPdf(
    simplePdf({ content: { bytes, filtered: true }, fontObject: SIMPLE_FONT }),
  );

  assert.equal(result.hasText, true);
  assert.match(result.text, /DUPONT/);
});

test('décode une police composite Identity-H via la table ToUnicode', () => {
  const bytes = textContent([
    '(Nom) Tj',
    '0 -14 Td <00480049004A004B004C004D> Tj',
  ]);
  const result = extractTextFromPdf(
    simplePdf({
      content: { bytes },
      fontObject: COMPOSITE_FONT,
      extraObjects: [{ num: 9, body: `<< /Length ${TO_UNICODE.length} >>`, stream: TO_UNICODE }],
    }),
  );

  assert.equal(result.hasText, true);
  assert.match(result.text, /Dupont/);
});

test('décode le CP1252 des polices simples (accents français)', () => {
  // Échappements octaux : 0xE9 = é, 0xE8 = è (Latin-1 en WinAnsi).
  const accents = extractTextFromPdf(
    simplePdf({ content: { bytes: textContent(['(Th\\351r\\350se) Tj']) }, fontObject: SIMPLE_FONT }),
  );
  assert.equal(accents.hasText, true);
  assert.match(accents.text, /Thérèse/);

  // 0x92 = ’ — hors Latin-1, donc lu dans la table CP1252 et non en octet brut.
  const apostrophe = extractTextFromPdf(
    simplePdf({ content: { bytes: textContent(['(d\\222Artagnan) Tj']) }, fontObject: SIMPLE_FONT }),
  );
  assert.match(apostrophe.text, /d’Artagnan/);
});

test('signale un PDF sans texte exploitable (scan) sans rien inventer', () => {
  const bytes = Buffer.from('BT\n/F1 10 Tf\nET\n0 0 100 100 re f\n', 'latin1');
  const result = extractTextFromPdf(simplePdf({ content: { bytes }, fontObject: SIMPLE_FONT }));

  assert.equal(result.hasText, false);
  assert.equal(result.text, '');
  assert.match(String(result.reason), /scann|texte/i);
});

test('résiste à un fichier qui n’est pas un PDF', () => {
  const result = extractTextFromPdf(Buffer.from('ceci n’est pas un pdf', 'latin1'));
  assert.equal(result.hasText, false);
  assert.equal(result.pages, 0);
});

test('met en forme un tableau à séparateurs explicites', () => {
  const table = buildSheetCsv('Nom;Prenom;Licence;Categorie\nDUPONT;Jean;1234567;U17');
  assert.equal(table.rows, 1);
  assert.deepEqual(table.columns, ['Nom', 'Prenom', 'Licence', 'Categorie']);
  assert.match(table.csv, /DUPONT;Jean;1234567;U17/);
});

test('déduit l’en-tête d’un tableau aligné par espaces et prévient le coach', () => {
  const table = buildSheetCsv(
    ['1234567  DUPONT  Jean  U17', '7654321  MARTIN  Luc  U15'].join('\n'),
  );

  assert.equal(table.rows, 2);
  assert.ok(table.columns.includes('Licence'));
  assert.ok(table.columns.includes('Nom'));
  assert.ok(table.warnings.some((warning) => /déduites/i.test(warning)));
  assert.match(table.csv.split('\n')[1], /DUPONT/);
});

test('refuse un document sans colonne de nom', () => {
  const table = buildSheetCsv('Categorie;Licence\nU17;1234567');
  assert.equal(table.rows, 0);
  assert.equal(table.csv, '');
  assert.ok(table.warnings.length > 0);
});

test('découpe les lignes selon le séparateur le plus fiable', () => {
  assert.deepEqual(splitCells('a\tb\tc'), ['a', 'b', 'c']);
  assert.deepEqual(splitCells('a;b;c'), ['a', 'b', 'c']);
  assert.deepEqual(splitCells('a  b  c'), ['a', 'b', 'c']);
});

test('borne le chemin au dossier du demandeur', () => {
  assert.equal(assertOwnSquadSheetPath('squad-sheets/u1/1700.pdf', 'u1'), 'squad-sheets/u1/1700.pdf');
  assert.throws(() => assertOwnSquadSheetPath('squad-sheets/u2/1700.pdf', 'u1'), SquadSheetError);
  assert.throws(() => assertOwnSquadSheetPath('documents/u1/x.pdf', 'u1'), SquadSheetError);
  assert.throws(() => assertOwnSquadSheetPath('squad-sheets/u1/../../secret.pdf', 'u1'), SquadSheetError);
  assert.throws(() => assertOwnSquadSheetPath('', 'u1'), SquadSheetError);
});

test('lit le club du demandeur sur son propre document', () => {
  assert.equal(callerClubId({ profile: { club_id: 'club-1' } }), 'club-1');
  assert.equal(callerClubId({ profile: { club_id: '   ' } }), null);
  assert.equal(callerClubId({}), null);
  assert.equal(callerClubId(null), null);
});

function fakeDb(clubId) {
  return {
    collection: () => ({
      doc: () => ({
        get: async () => ({ data: () => (clubId ? { profile: { club_id: clubId } } : {}) }),
      }),
    }),
  };
}

test('convertit une feuille déposée puis supprime le fichier', async () => {
  const bytes = simplePdf({
    content: { bytes: textContent(SHEET_LINES) },
    fontObject: SIMPLE_FONT,
  });
  const removed = [];

  const result = await extractSquadSheetFromStorage({
    db: fakeDb('club-1'),
    callerUid: 'u1',
    storagePath: 'squad-sheets/u1/1700.pdf',
    download: async () => ({ bytes, contentType: 'application/pdf' }),
    remove: async (path) => {
      removed.push(path);
    },
  });

  assert.equal(result.rows, 2);
  assert.equal(result.pages, 1);
  assert.match(result.csv, /DUPONT/);
  assert.deepEqual(removed, ['squad-sheets/u1/1700.pdf']);
});

test('refuse un compte sans club', async () => {
  await assert.rejects(
    extractSquadSheetFromStorage({
      db: fakeDb(null),
      callerUid: 'u1',
      storagePath: 'squad-sheets/u1/1700.pdf',
      download: async () => ({ bytes: Buffer.from('%PDF-1.4'), contentType: 'application/pdf' }),
    }),
    (error) => error instanceof SquadSheetError && error.code === 'permission-denied',
  );
});

test('refuse un tableur et un fichier absent', async () => {
  await assert.rejects(
    extractSquadSheetFromStorage({
      db: fakeDb('club-1'),
      callerUid: 'u1',
      storagePath: 'squad-sheets/u1/sheet.xlsx',
      download: async () => ({ bytes: Buffer.from('x'), contentType: 'application/vnd.ms-excel' }),
    }),
    (error) => error instanceof SquadSheetError && error.code === 'invalid-argument',
  );

  await assert.rejects(
    extractSquadSheetFromStorage({
      db: fakeDb('club-1'),
      callerUid: 'u1',
      storagePath: 'squad-sheets/u1/missing.pdf',
      download: async () => null,
    }),
    (error) => error instanceof SquadSheetError && error.code === 'not-found',
  );
});
