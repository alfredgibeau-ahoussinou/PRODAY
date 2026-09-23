import fs from 'fs';
import path from 'path';
import {
  TACTICAL_BOARD_BOUNDS,
  normalizeTacticalBoardState,
} from '../utils/coachTacticalBoard';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const BOARD = 'screens/coach/CoachTacticalBoardScreen.tsx';
const PITCH = 'components/coach/CoachPitchView.tsx';
const SURFACE = 'components/coach/CoachPitchSurface.tsx';

describe('Tableau tactique Coach — état enregistré', () => {
  it('ramène l’ancien mode isométrique sur le tableau plat', () => {
    expect(normalizeTacticalBoardState({ boardMode: '3d' }).boardMode).toBe('2d');
    expect(normalizeTacticalBoardState({ boardMode: 'cpa' }).boardMode).toBe('cpa');
    expect(normalizeTacticalBoardState({}).boardMode).toBe('2d');
  });

  it('ignore un format ou un état inconnu au lieu de le réinjecter', () => {
    const restored = normalizeTacticalBoardState({
      selectedFormat: 'waterpolo',
      activeFormation: '  ',
      players: 'douze joueurs',
    });
    expect(restored.selectedFormat).toBeUndefined();
    expect(restored.activeFormation).toBeUndefined();
    expect(restored.players).toBeUndefined();
    expect(normalizeTacticalBoardState(null)).toEqual({});
  });

  it('borne les positions et écarte les entrées corrompues', () => {
    const restored = normalizeTacticalBoardState({
      selectedFormat: '11v11',
      players: [
        { id: 'h1', num: 1, name: 'Hugo L.', x: 400, y: -50, team: 'home', role: 'GB' },
        { id: 'h2', num: 2, name: 'Sans coordonnées', team: 'home' },
        { id: '', num: 3, name: 'Sans identifiant', x: 10, y: 10, team: 'home' },
      ],
      vectors: [{ id: 'v1', fromX: 10, fromY: 20, toX: 30, toY: 40, type: 'run' }],
      cones: [{ id: 'c1', x: 12, y: 34 }],
    });

    expect(restored.selectedFormat).toBe('11v11');
    expect(restored.players).toHaveLength(1);
    expect(restored.players?.[0]).toMatchObject({
      id: 'h1',
      x: TACTICAL_BOARD_BOUNDS.maxX,
      y: 0,
    });
    expect(restored.vectors).toHaveLength(1);
    expect(restored.cones).toHaveLength(1);
  });

  it('range les tracés par phase et ramène les anciens sur la première', () => {
    const restored = normalizeTacticalBoardState({
      vectors: [
        { id: 'v1', fromX: 1, fromY: 2, toX: 3, toY: 4, type: 'pass' },
        { id: 'v2', fromX: 1, fromY: 2, toX: 3, toY: 4, type: 'run', phase: 3 },
        { id: 'v3', fromX: 1, fromY: 2, toX: 3, toY: 4, type: 'run', phase: 9 },
      ],
    });
    expect(restored.vectors?.map((vector) => vector.phase)).toEqual([1, 3, 1]);
  });

  it('n’accepte que les deux modes conservés', () => {
    const source = read('utils/coachTacticalBoard.ts');
    expect(source).toContain("export type TacticalBoardMode = '2d' | 'cpa'");
  });
});

describe('Tableau tactique Coach — décor retiré', () => {
  it('ne comporte plus de mode 3D ni de transformation de perspective', () => {
    const source = read(BOARD);
    expect(source).not.toContain("'3d'");
    expect(source).not.toContain('3D Iso');
    expect(source).not.toContain('rotateX:');
    expect(source).not.toContain('perspective:');
    expect(source).not.toContain('pitchWrapper3D');
  });

  it('ne dessine plus son propre décor de stade', () => {
    const source = read(BOARD);
    /** Pelouse et tracé viennent du composant partagé, plus d'empilement local. */
    expect(source).not.toContain('LinearGradient');
    expect(source).not.toContain('turfGradTactical');
    expect(source).not.toContain('futsalGradTactical');
    /** La zone de pressing dessinée en dur n'était pilotée par aucun état. */
    expect(source).not.toContain('ZONE DE PRESSING');
    expect(source).not.toContain('BLOC CADRAGE');
    expect(source).not.toContain('PressingZone');
  });

  it('ne confirme plus une diffusion qui n’a pas eu lieu', () => {
    const source = read(BOARD);
    expect(source).not.toContain('Diffuser aux Vestiaires');
    expect(source).not.toContain('synchronisé en direct');
    expect(source).not.toContain('Consigne Spécifique');
    expect(source).not.toContain('Alert.alert');
    expect(source).toContain('Schéma enregistré sur cet appareil');
  });

  it('identifie les repères CPA comme des repères de travail', () => {
    const source = read(BOARD);
    expect(source).toContain('Repères de travail, à réassigner aux joueurs du match.');
  });
});

describe('Tableau tactique Coach — socle partagé', () => {
  it('tire toutes ses couleurs des jetons du socle', () => {
    const literals = read(BOARD).match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
    expect(literals).toEqual([]);
    const source = read(BOARD);
    expect(source).toContain("from '../../theme/professionalDesign'");
    expect(source).toContain('useCoachThemedStyles');
    expect(source).toContain("from '../../features/coach/theme/coachPitchTokens'");
  });

  it('emprunte la géométrie de puce du pôle au lieu de la réinventer', () => {
    const source = read(BOARD);
    expect(source).toContain('coachChipContainerStyle');
    expect(source).toContain('minHeight: proForm.chipHeight');
    expect(source).toContain('borderRadius: proForm.chipRadius');
    expect(source).toContain('...proCard(tokens)');
    /** Aucune dimension d'action recopiée à la main. */
    for (const literal of ['height: 38', 'borderRadius: 14', 'fontSize: 10.5']) {
      expect({ literal, found: source.includes(literal) }).toEqual({ literal, found: false });
    }
  });

  it('dessine la pelouse avec le composant partagé, pas un second tracé', () => {
    const board = read(BOARD);
    const pitch = read(PITCH);
    const surface = read(SURFACE);

    for (const source of [board, pitch]) {
      expect(source).toContain('CoachPitchSurface');
      /** Le tracé n'est plus recopié : ni bandes, ni lignes de jeu locales. */
      expect(source).not.toContain('COACH_PITCH.line');
      expect(source).not.toContain('COACH_PITCH.stripe');
    }
    expect(surface).toContain('COACH_PITCH.lineStrong');
    expect(surface).toContain('COACH_PITCH_GEOMETRY');
  });

  it('ne laisse pas la lecture sans effet', () => {
    const source = read(BOARD);
    expect(source).toContain('setInterval');
    expect(source).toContain('phase: activePhase');
    expect(source).toContain('opacity={vector.phase === activePhase ? 1 : 0.25}');
  });

  it('garde les commandes hors pelouse', () => {
    const source = read(BOARD);
    /** Les puces de format, de système et d'outil vivent au-dessus du terrain. */
    const pitchFrame = source.indexOf('styles.pitchFrame');
    expect(pitchFrame).toBeGreaterThan(-1);
    expect(source.indexOf('TOOL_CHIPS.map')).toBeLessThan(pitchFrame);
    expect(source.indexOf('FORMAT_CHIPS.map')).toBeLessThan(pitchFrame);
  });

  it('reste piloté par la largeur réelle de la fenêtre', () => {
    const source = read(BOARD);
    expect(source).toContain('useWindowDimensions');
    expect(source).not.toContain("Dimensions.get('window')");
  });
});
