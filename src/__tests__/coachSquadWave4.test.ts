/**
 * WAVE 4 P-004 — Effectif unifié (`CoachSquadScreen`).
 * Proto `squad` + `availability` en sous-vue ; composition via API partagée.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const SCREEN = 'screens/coach/CoachSquadScreen.tsx';
const IMPORT = 'components/coach/CoachSquadImportPanel.tsx';
const SURFACE = 'components/coach/CoachCompositionSurface.tsx';

describe('WAVE 4 P-004 — Effectif', () => {
  const screen = read(SCREEN);
  const importPanel = read(IMPORT);

  it('branche coachCommonUi + jetons proto catégorie effectif', () => {
    expect(screen).toContain("from '../../features/coach/ui/coachCommonUi'");
    expect(screen).toContain('coachProtoTokens');
    expect(screen).toContain('CoachSegmented');
    expect(screen).toContain('CoachPrimaryButton');
    expect(screen).toContain('category="effectif"');
    expect(screen).toContain("COACH_PROTO_CATEGORY_PAGE.effectif");
  });

  it('garde Effectif | Composition et Disponibilités en sous-vue (pas d’écran séparé)', () => {
    expect(screen).toContain("type SquadTab = 'effectif' | 'composition'");
    expect(screen).toContain("type EffectifPane = 'joueurs' | 'disponibilites'");
    expect(screen).toContain("label: 'Joueurs'");
    expect(screen).toContain("label: 'Disponibilités'");
    expect(screen).toContain('effectifPane');
    expect(screen).not.toContain('CoachAvailabilityScreen');
  });

  it('conserve annuaire, import réel et Sync FFF — pas de wizard 8 écrans', () => {
    expect(screen).toContain('<CoachRosterDirectory');
    expect(screen).toContain('<CoachSquadImportPanel');
    expect(screen).toContain('setFederationVisible(true)');
    expect(screen).toContain('Importer des effectifs');
    expect(screen).not.toMatch(/importChoice|importFiles|importAnalysis|importDuplicates/);
    expect(importPanel).toContain('clubLicenseService.importLicensedRoster');
    expect(importPanel).toContain('extractSquadSheetCsv');
    expect(importPanel).toContain('COACH_PROTO_BUTTON');
    expect(importPanel).not.toMatch(/importChoice|Étape \d+\/8|wizard/i);
  });

  it('consomme la composition partagée sans retoucher la surface pitch', () => {
    expect(screen).toContain('<CoachCompositionSurface');
    expect(screen).toContain('useCoachCompositionBoard(');
    expect(screen).toContain('roster.publishLineup(payload)');
    expect(screen).toContain('roster.setAttendanceMark(playerId, availabilityToMark(availability))');
    /** Fichier surface hors ownership P-004 — on vérifie seulement qu’il existe encore. */
    expect(read(SURFACE)).toContain('export function CoachCompositionSurface');
  });

  it('aligne le pointage disponibilités sur le proto (métrique, listes, relance)', () => {
    expect(screen).toContain('Pointage');
    expect(screen).toContain('availabilityPointageRow');
    expect(screen).toContain('Pointer la séance');
  });
});
