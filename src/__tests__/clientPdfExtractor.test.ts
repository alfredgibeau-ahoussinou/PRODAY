import { deflateSync } from 'zlib';
import {
  inflatePureJs,
  parseToUnicodeCmap,
  extractTextFromContent,
  convertExtractedTextToSquadCsv,
  collectPdfObjects,
  extractPdfTextClient,
} from '../utils/clientPdfExtractor';

describe('Extracteur PDF autonome côté client (clientPdfExtractor)', () => {
  describe('inflatePureJs (Décompression RFC 1950 & 1951)', () => {
    it('décompresse un flux non compressé (Type 0)', () => {
      const data = new Uint8Array([
        0x78, 0x01, // zlib header
        0x01, // isFinal = 1, bType = 0 (uncompressed)
        0x05, 0x00, // len = 5
        0xfa, 0xff, // nlen = ~5
        0x48, 0x65, 0x6c, 0x6c, 0x6f, // "Hello"
      ]);
      const res = inflatePureJs(data);
      expect(String.fromCharCode(...res)).toBe('Hello');
    });

    it('décompresse un flux compressé par node:zlib (Deflate dynamique)', () => {
      const sample = 'Licence;Nom;Prenom\n2548963210;DIALLO;Moussa\n2548963211;MARTIN;Lucas';
      const compressed = new Uint8Array(deflateSync(Buffer.from(sample, 'utf8')));
      const res = inflatePureJs(compressed);
      expect(Buffer.from(res).toString('utf8')).toBe(sample);
    });
  });

  describe('extractTextFromContent (Opérateurs Tj, TJ, Td)', () => {
    it('extrait le texte simple avec opérateurs Tj', () => {
      const content = `
        BT
        /F1 12 Tf
        10 20 Td
        (2548963210) Tj
        T*
        (DIALLO) Tj
        15 0 Td
        (Moussa) Tj
        ET
      `;
      const text = extractTextFromContent(content, new Map());
      expect(text).toContain('2548963210');
      expect(text).toContain('DIALLO');
      expect(text).toContain('Moussa');
    });

    it('extrait le texte avec tableaux TJ et espacements', () => {
      const content = `
        BT
        /F1 12 Tf
        [(2541234567) -200 (BENALIA) -200 (Karim)] TJ
        ET
      `;
      const text = extractTextFromContent(content, new Map());
      expect(text).toContain('2541234567');
      expect(text).toContain('BENALIA');
      expect(text).toContain('Karim');
    });
  });

  describe('convertExtractedTextToSquadCsv', () => {
    it('convertit les lignes extraites en CSV structuré avec licence et noms', () => {
      const rawText = `
        2548963210  DIALLO  Moussa  U17  Apte  14/03/2009
        2548963211  MARTIN  Lucas   U17  Valide 22/07/2009
      `;
      const { csv, rowCount } = convertExtractedTextToSquadCsv(rawText);
      expect(rowCount).toBe(2);
      expect(csv).toContain('2548963210;DIALLO;Moussa;U17;Valide;14/03/2009');
      expect(csv).toContain('2548963211;MARTIN;Lucas;U17;Valide;22/07/2009');
    });

    it('renvoie un CSV vide si aucun joueur identifiable', () => {
      const rawText = 'Feuille d’émargement sans numéro de licence ni joueur';
      const { csv, rowCount } = convertExtractedTextToSquadCsv(rawText);
      expect(rowCount).toBe(0);
      expect(csv).toBe('');
    });
  });

  describe('extractPdfTextClient sur structure PDF synthétique', () => {
    it('extrait le texte d’un PDF contenant des objets texte uncompressed', () => {
      const pdf = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 75 >>
stream
BT
/F1 12 Tf
(2549999999) Tj
T*
(TRAORE) Tj
10 0 Td
(Amadou) Tj
ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF
      `;
      const bytes = new Uint8Array(Buffer.from(pdf, 'latin1'));
      const res = extractPdfTextClient(bytes);
      expect(res.hasText).toBe(true);
      expect(res.text).toContain('2549999999');
      expect(res.text).toContain('TRAORE');
    });

    it('décompresse et extrait les objets rangés dans un flux d’objets (/Type /ObjStm)', () => {
      // Construction d'un /ObjStm compressé contenant l'objet 3 (Page)
      const objStmInner = '3 0 << /Type /Page /Parent 2 0 R /Contents 4 0 R >>';
      const compressedStream = deflateSync(Buffer.from(objStmInner, 'latin1'));

      const pdf = `
%PDF-1.5
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
10 0 obj
<< /Type /ObjStm /N 1 /First 4 /Length ${compressedStream.length} /Filter /FlateDecode >>
stream
${compressedStream.toString('latin1')}
endstream
endobj
4 0 obj
<< /Length 70 >>
stream
BT
(2548888888) Tj
T*
(CAMARA) Tj
ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF
      `;
      const bytes = new Uint8Array(Buffer.from(pdf, 'latin1'));
      const res = extractPdfTextClient(bytes);
      expect(res.hasText).toBe(true);
      expect(res.text).toContain('2548888888');
      expect(res.text).toContain('CAMARA');
    });
  });
});
