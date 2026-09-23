import fs from 'fs';
import path from 'path';

/**
 * Garde-fou de la checklist de recette visuelle (docs/proday-visual-qa-checklist.md).
 *
 * La checklist est dérivée de DESIGN.md et sert de guide à la recette sur appareil :
 * elle doit rester alignée sur le code réel. Ce test évite la pourriture documentaire
 * (chemins cités qui n'existent plus) et les doublons d'identifiants d'items.
 */

const CHECKLIST_PATH = path.join(__dirname, '../../docs/proday-visual-qa-checklist.md');
const DESIGN_PATH = path.join(__dirname, '../../DESIGN.md');

const checklist = fs.readFileSync(CHECKLIST_PATH, 'utf8');
const design = fs.readFileSync(DESIGN_PATH, 'utf8');

describe('Checklist QA visuelle par pôle', () => {
  it('cite uniquement des chemins source qui existent réellement', () => {
    const cited = Array.from(checklist.matchAll(/`(src\/[^`]+)`/g)).map((m) => m[1]);
    expect(cited.length).toBeGreaterThan(20);

    const missing = cited
      .map((rel) => rel.replace(/\/\*\*$/, ''))
      .filter((rel) => !fs.existsSync(path.join(__dirname, '../..', rel)));

    expect(missing).toEqual([]);
  });

  it('attribue un identifiant unique à chaque item', () => {
    const ids = Array.from(
      checklist.matchAll(/\|\s*(T-\d{2}|CL-\d{2}|C-\d{2}|PA-\d{2}|SP-\d{2}|J-\d{2}|S-\d{2}|PR-\d{2}|AD-\d{2}|EV-\d{2})\s*\|/g),
    ).map((m) => m[1]);

    expect(ids.length).toBeGreaterThanOrEqual(30);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it('couvre le socle transverse §1 à §7 de DESIGN.md', () => {
    for (const section of ['§1', '§2', '§3', '§4', '§5', '§6', '§7']) {
      expect(checklist).toContain(section);
    }
    // Le socle transverse doit couvrir les motifs majeurs de la spec.
    for (const motif of ['#121218', '#1A1A24', 'star-four-points', 'PressableSpring', 'Ambient Glow', 'hitSlop']) {
      expect(checklist).toContain(motif);
    }
  });

  it('couvre les six pôles de DESIGN.md §8 plus les rôles intégrés', () => {
    const sections = ['P-JOU', 'P-COA', 'P-CLU', 'P-PAR', 'P-SUP', 'P-SPO', 'P-PRE', 'P-ADM', 'P-EVT'];
    for (const id of sections) {
      expect(checklist).toContain(id);
    }
    // Les six pôles produit sont bien ceux de DESIGN.md §8.
    for (const pole of ['Pôle Joueur', 'Pôle Coach & Staff', 'Pôle Club & Direction', 'Pôle Parent & Famille', 'Pôle Supporter & Tribune', 'Pôle Sponsor & Marque']) {
      expect(design).toContain(pole);
      expect(checklist).toContain(pole);
    }
  });

  it('déclare les divergences spec ↔ runtime comme décidées (D-006), pas comme défauts', () => {
    expect(checklist).toContain('D-006');
    const decisions = fs.readFileSync(path.join(__dirname, '../../docs/proday-decisions.md'), 'utf8');
    expect(decisions).toContain('## D-006');
    // Les trois accents divergents sont nommés des deux côtés.
    for (const hex of ['#00E676', '#00ADEF', '#EF4444']) {
      expect(design.toLowerCase()).toContain(hex.toLowerCase());
      expect(checklist.toLowerCase()).toContain(hex.toLowerCase());
    }
  });

  it('rappelle la matrice de supports et les largeurs à parcourir', () => {
    for (const width of ['320', '390', '600', '768', '1024', '1440', '1920']) {
      expect(checklist).toContain(width);
    }
    expect(checklist).toContain('200 %');
  });

  it('exige une preuve par case cochée (renvoi au contrat §G)', () => {
    expect(checklist).toContain('proday-verification.md');
    expect(checklist).toContain('inspection de code');
  });
});
