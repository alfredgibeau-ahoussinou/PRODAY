import fs from 'fs';
import path from 'path';
import { nearestPointIndex } from '../components/coach/CoachPitchView';
import {
  COACH_LINEUP_HISTORY_LIMIT,
  popCoachLineupHistory,
  pushCoachLineupHistory,
  readCoachLineupSnapshot,
  sameCoachLineup,
  type CoachLineupSnapshot,
} from '../utils/coachLineupHistory';
import type { SquadPlayer } from '../utils/coachSquadRoster';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const PITCH = 'components/coach/CoachPitchView.tsx';
const SCREEN = 'screens/coach/CoachSquadScreen.tsx';
const GUIDE = 'components/coach/CoachLineupGuide.tsx';

function player(
  id: string,
  availability: SquadPlayer['availability'] = 'present',
): SquadPlayer {
  return {
    id,
    num: Number(id.replace(/\D/g, '')) || 1,
    name: `Joueur ${id}`,
    pos: 'CM',
    availability,
  };
}

function state(overrides: Partial<Parameters<typeof readCoachLineupSnapshot>[0]> = {}) {
  return readCoachLineupSnapshot({
    format: '11v11',
    formation: '4-3-3',
    starterIds: ['p1', 'p2', null],
    squad: [player('p1'), player('p2'), player('p3')],
    ...overrides,
  });
}

describe('Dépôt d’un jeton glissé', () => {
  const grid = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: 120 },
    { x: 100, y: 120 },
  ];

  it('accroche au cran le plus proche, où que le doigt se lève', () => {
    expect(nearestPointIndex(grid, 10, 5)).toBe(0);
    expect(nearestPointIndex(grid, 92, 8)).toBe(1);
    expect(nearestPointIndex(grid, 40, 118)).toBe(2);
    expect(nearestPointIndex(grid, 99, 119)).toBe(3);
  });

  it('n’a pas de zone morte : même à mi-chemin, un cran est choisi', () => {
    expect(nearestPointIndex(grid, 50, 60)).toBe(0);
    expect(nearestPointIndex(grid, 51, 61)).toBe(3);
  });

  it('renvoie -1 plutôt qu’un poste inventé quand la formation ne fournit aucun cran', () => {
    expect(nearestPointIndex([], 40, 40)).toBe(-1);
  });
});

describe('Annulation de session', () => {
  it('remonte toute la session, geste après geste', () => {
    const initial = state();
    /** Chaque geste empile l'état d'avant : geste 1 (aligner), puis geste 2 (échanger). */
    let history = pushCoachLineupHistory([], initial);
    const afterFirst = state({ starterIds: ['p3', 'p2', null] });
    history = pushCoachLineupHistory(history, afterFirst);

    const first = popCoachLineupHistory(history)!;
    expect(first.snapshot).toEqual(afterFirst);
    const second = popCoachLineupHistory(first.history)!;
    expect(second.snapshot).toEqual(initial);
    expect(popCoachLineupHistory(second.history)).toBeNull();
  });

  it('n’empile pas deux fois le même état (pas d’annulation dans le vide)', () => {
    const snapshot = state();
    const once = pushCoachLineupHistory([], snapshot);
    const twice = pushCoachLineupHistory(once, state());
    expect(twice).toHaveLength(1);
    expect(once).toHaveLength(1);
  });

  it('considère une indisponibilité comme un geste réversible', () => {
    const before = state();
    const after = readCoachLineupSnapshot({
      format: '11v11',
      formation: '4-3-3',
      starterIds: ['p1', null, null],
      squad: [player('p1'), player('p2', 'absent'), player('p3')],
    });
    expect(sameCoachLineup(before, after)).toBe(false);
    expect(pushCoachLineupHistory([before], after)).toHaveLength(2);
  });

  it('copie l’état au lieu de le capturer par référence', () => {
    const starterIds = ['p1', 'p2', null];
    const squad = [player('p1'), player('p2')];
    const snapshot = readCoachLineupSnapshot({
      format: '11v11',
      formation: '4-3-3',
      starterIds,
      squad,
    });
    starterIds[0] = 'p9';
    squad.push(player('p3'));
    expect(snapshot.starterIds[0]).toBe('p1');
    expect(snapshot.squad).toHaveLength(2);
  });

  it('borne la profondeur et oublie les gestes les plus anciens', () => {
    let history: CoachLineupSnapshot[] = [];
    for (let index = 0; index < COACH_LINEUP_HISTORY_LIMIT + 12; index += 1) {
      history = pushCoachLineupHistory(history, state({ formation: `système-${index}` }));
    }
    expect(history).toHaveLength(COACH_LINEUP_HISTORY_LIMIT);
    expect(history[0]!.formation).toBe(`système-${12}`);
    expect(history[history.length - 1]!.formation).toBe(
      `système-${COACH_LINEUP_HISTORY_LIMIT + 11}`,
    );
  });
});

describe('Terrain — glisser-déposer', () => {
  it('capte le glisser avec le système de répondeur de React Native', () => {
    const source = read(PITCH);
    expect(source).toContain('PanResponder');
    /** Le projet n’embarque pas `react-native-gesture-handler` : ne pas l’inventer. */
    expect(source).not.toContain('react-native-gesture-handler');
    expect(source).toContain('onMoveShouldSetPanResponder');
  });

  it('démarre sur appui long, pour ne pas voler le défilement de la page', () => {
    const source = read(PITCH);
    expect(source).toContain('onStartShouldSetPanResponder: () => false');
    expect(source).toContain('onMoveShouldSetPanResponder: () => dragRef.current !== null');
    expect(source).toContain('beginDrag');
  });

  it('repose le jeton si l’appui long n’a pas été suivi d’un glisser', () => {
    const source = read(PITCH);
    expect(source).toContain('onPressOut');
    expect(source).toContain('if (!claimedRef.current) endDrag(false)');
  });

  it('n’active le geste que si le parent sait quoi faire du déplacement', () => {
    const source = read(PITCH);
    expect(source).toContain('onMovePlayer?: (player: SquadPlayer, toSlotIndex: number) => void');
    expect(source).toContain('if (!onMovePlayer) return');
    expect(source).toContain("onLongPress={\n                  onMovePlayer ? () => beginDrag(index, player) : undefined");
  });

  it('dessine le poste visé et lève le jeton tenu, sans animation parasite', () => {
    const source = read(PITCH);
    expect(source).toContain('styles.dropTarget');
    expect(source).toContain('styles.markerDragged');
    expect(source).not.toContain('withSpring');
    expect(source).not.toContain('withTiming');
  });

  it('partage une seule géométrie entre dessin, accrochage et dépôt', () => {
    const source = read(PITCH);
    expect(source).toContain('const slotGeometry = useMemo');
    expect(source).toContain('const cx = isDragged ? drag.x : geometry.cx');
  });
});

describe('Écran Équipe — glisser et annulation', () => {
  it('branche le glisser sur le même chemin que le sélecteur', () => {
    const source = read(SCREEN);
    /** Le terrain **et** la composition guidée reçoivent le même chemin de dépôt. */
    const wired = source.match(/onMovePlayer=\{movePlayerToSlot\}/g) ?? [];
    expect(wired.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("swap ? 'Postes échangés'");
  });

  it('empile un instantané pour chaque geste qui change le onze', () => {
    const source = read(SCREEN);
    const remembered = source.match(/rememberStep\(\)/g) ?? [];
    /** aligner, libérer un poste, format, système, réorganisation, statut, rôle. */
    expect(remembered.length).toBeGreaterThanOrEqual(7);
    expect(source).toContain('pushCoachLineupHistory(previous, snapshotRef.current)');
    expect(source).toContain('popCoachLineupHistory(history)');
  });

  it('n’empile rien quand le geste ne change rien', () => {
    const source = read(SCREEN);
    expect(source).toContain('if (lineup[slotIndex] === player.id) return');
    expect(source).toContain('if (!lineup[slotIndex]) return');
    expect(source).toContain('if (nextFormation === formation) return');
  });

  it('restaure la disponibilité en la réécrivant sur la convocation réelle', () => {
    const source = read(SCREEN);
    /**
     * Annuler une absence ne peut pas rester local : la disponibilité vit sur
     * la convocation, sinon l'écran afficherait un joueur disponible que la
     * base tient toujours pour absent.
     */
    expect(source).toContain('roster.setAvailability(player.id, player.availability)');
    expect(source).toContain('snapshot.squad.forEach');
  });

  it('n’affiche l’annulation que lorsqu’un geste est réversible', () => {
    const source = read(SCREEN);
    expect(source).toContain('const canUndo = history.length > 0');
    expect(source).toContain('{canUndo ? (');
  });

  it('rend le geste découvrable par une phrase, pas par une icône seule', () => {
    const source = read(SCREEN);
    expect(source).toContain('maintenez un joueur pour le faire');
  });

  it('propose la même annulation dans la composition guidée', () => {
    const screen = read(SCREEN);
    const guide = read(GUIDE);
    expect(screen).toContain('onUndo={undoLineupStep}');
    expect(screen).toContain('canUndo={canUndo}');
    expect(guide).toContain('onUndo?: () => void');
    expect(guide).toContain('canUndo && onUndo');
    expect(guide).toContain('onMovePlayer={onMovePlayer ? handleSlotDrag : undefined}');
  });
});
