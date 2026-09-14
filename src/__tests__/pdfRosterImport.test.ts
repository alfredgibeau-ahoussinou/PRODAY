import {
  parseRosterText,
  parsePlayerLine,
  detectPositionCategory,
  detectFormation,
  stringSimilarity,
  SAMPLE_FFF_MATCH_SHEET,
  type ExistingSquadPlayer,
} from '../services/pdf/pdfRosterExtractor.service';

describe('pdfRosterExtractor (Section 28 - Import Structuré & Réconciliation)', () => {
  describe('Similarité et utilitaires de parsing', () => {
    it('calcule correctement la similarité entre deux noms avec accents et casse différente', () => {
      expect(stringSimilarity('Kylian MBAPPÉ', 'Kylian Mbappe')).toBe(1.0);
      expect(stringSimilarity('Antoine Griezmann', 'A. Griezmann')).toBeGreaterThan(0.6);
      expect(stringSimilarity('Hugo Lloris', 'Paul Pogba')).toBeLessThan(0.3);
    });

    it('détecte les catégories de postes à partir des abréviations et libellés français', () => {
      expect(detectPositionCategory('GK').category).toBe('GK');
      expect(detectPositionCategory('Gardien').category).toBe('GK');
      expect(detectPositionCategory('DC').category).toBe('DEF');
      expect(detectPositionCategory('Latéral').category).toBe('DEF');
      expect(detectPositionCategory('Milieu').category).toBe('MID');
      expect(detectPositionCategory('MDC').category).toBe('MID');
      expect(detectPositionCategory('Attaquant').category).toBe('ATT');
      expect(detectPositionCategory('Buteur').category).toBe('ATT');
    });

    it('détecte le dispositif tactique dans le document', () => {
      expect(detectFormation('Système tactique : 4-3-3')).toBe('4-3-3');
      expect(detectFormation('Organisation en 4-2-3-1 classique')).toBe('4-2-3-1');
      expect(detectFormation('Listing général des joueurs')).toBeUndefined();
    });
  });

  describe('Extraction d’une ligne de joueur', () => {
    it('parse un joueur avec numéro, nom, poste et numéro de licence', () => {
      const line = '1. Hugo LLORIS (GK / Gardien) Lic. 2541009101';
      const player = parsePlayerLine(line, 0);

      expect(player).not.toBeNull();
      expect(player?.number).toBe(1);
      expect(player?.fullName).toContain('Hugo LLORIS');
      expect(player?.positionCategory).toBe('GK');
      expect(player?.licenseNumber).toBe('2541009101');
      expect(player?.isStarter).toBe(true);
    });

    it('attribue le poste par défaut selon le numéro de maillot si non spécifié', () => {
      const gk = parsePlayerLine('1 - Steve MANDANDA', 0);
      expect(gk?.positionCategory).toBe('GK');

      const def = parsePlayerLine('4 - Raphael VARANE', 3);
      expect(def?.positionCategory).toBe('DEF');

      const att = parsePlayerLine('9 - Olivier GIROUD', 8);
      expect(att?.positionCategory).toBe('ATT');
    });

    it('ignore les entêtes de colonnes ou lignes non informatives', () => {
      expect(parsePlayerLine('NOM PRENOM POSTE LICENCE', 0)).toBeNull();
      expect(parsePlayerLine('Feuille de match officielle', 1)).toBeNull();
      expect(parsePlayerLine('---', 2)).toBeNull();
    });
  });

  describe('Extraction complète et réconciliation d’effectif', () => {
    it('parse la feuille de match officielle FFF exemple avec 11 titulaires et remplaçants', () => {
      const result = parseRosterText(SAMPLE_FFF_MATCH_SHEET, [], 'match_fff.pdf');

      expect(result.players.length).toBe(17);
      expect(result.tactics).toBeDefined();
      expect(result.tactics?.formation).toBe('4-3-3');
      expect(result.tactics?.starters.length).toBe(11);
      expect(result.tactics?.substitutes.length).toBe(6);
      expect(result.duplicatesCount).toBe(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('identifie un doublon immédiat par numéro de licence FFF', () => {
      const existingSquad: ExistingSquadPlayer[] = [
        { id: 'sq-1', name: 'Hugo Lloris', licenseNumber: '2541009101' },
      ];

      const result = parseRosterText(SAMPLE_FFF_MATCH_SHEET, existingSquad, 'match_fff.pdf');
      const dup = result.players.find((p) => p.licenseNumber === '2541009101');

      expect(dup).toBeDefined();
      expect(dup?.isDuplicate).toBe(true);
      expect(dup?.duplicateWithPlayerId).toBe('sq-1');
      expect(dup?.status).toBe('duplicate');
      expect(result.duplicatesCount).toBeGreaterThanOrEqual(1);
    });

    it('identifie un doublon par nom très proche (Levenshtein >= 85%)', () => {
      const existingSquad: ExistingSquadPlayer[] = [
        { id: 'sq-2', name: 'Kylian Mbappe' },
      ];

      const result = parseRosterText(SAMPLE_FFF_MATCH_SHEET, existingSquad, 'match_fff.pdf');
      const dup = result.players.find((p) => p.fullName.includes('MBAPPE'));

      expect(dup).toBeDefined();
      expect(dup?.isDuplicate).toBe(true);
      expect(dup?.duplicateWithPlayerId).toBe('sq-2');
    });
  });
});
