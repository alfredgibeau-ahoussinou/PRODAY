import {
  cloneDiagram,
  createEmptyDiagram,
  normalizeDiagramData,
  type DiagramArrowElement,
  type DiagramElement,
  type DiagramEquipmentElement,
  type DiagramPlayerElement,
  type ExerciseDiagramData,
} from '../models/ExerciseDiagram';
import {
  createDefaultAnimationStage,
  createEmptyAnimationData,
  type ElementMovementAction,
  type ExerciseAnimationStage,
  type ExerciseDiagramAnimationData,
} from '../models/ExerciseDiagramAnimation';
import {
  calculateMovementPositionAtTime,
  computeStageInterpolation,
  convertStaticArrowsToAnimationStage,
  extractAnimationKeyframes,
  getTotalAnimationDurationMs,
  interpolateLinear,
  interpolateQuadraticBezier,
  resolveStageAndElapsedFromTotalMs,
} from '../utils/diagramAnimationEngine';

describe('Tactical & Exercise Diagram Animation System', () => {
  describe('Mathematical Interpolation Functions', () => {
    it('calculates exact linear coordinates at t=0, t=0.5, and t=1', () => {
      const p0 = { x: 10, y: 20 };
      const p1 = { x: 30, y: 60 };

      const start = interpolateLinear(p0, p1, 0);
      expect(start).toEqual({ x: 10, y: 20 });

      const mid = interpolateLinear(p0, p1, 0.5);
      expect(mid).toEqual({ x: 20, y: 40 });

      const end = interpolateLinear(p0, p1, 1);
      expect(end).toEqual({ x: 30, y: 60 });
    });

    it('clamps t between 0 and 1 for linear interpolation', () => {
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 10, y: 10 };

      expect(interpolateLinear(p0, p1, -0.5)).toEqual({ x: 0, y: 0 });
      expect(interpolateLinear(p0, p1, 1.8)).toEqual({ x: 10, y: 10 });
    });

    it('calculates quadratic Bézier curve interpolation correctly', () => {
      const p0 = { x: 0, y: 0 };
      const pc = { x: 10, y: 20 }; // Sommet de la courbe
      const p1 = { x: 20, y: 0 };

      // À t = 0.5 :
      // x = 0.25*0 + 2*0.25*10 + 0.25*20 = 5 + 5 = 10
      // y = 0.25*0 + 2*0.25*20 + 0.25*0 = 10
      const mid = interpolateQuadraticBezier(p0, pc, p1, 0.5);
      expect(mid.x).toBe(10);
      expect(mid.y).toBe(10);

      const start = interpolateQuadraticBezier(p0, pc, p1, 0);
      expect(start).toEqual({ x: 0, y: 0 });

      const end = interpolateQuadraticBezier(p0, pc, p1, 1);
      expect(end).toEqual({ x: 20, y: 0 });
    });
  });

  describe('Single Movement Timing & Delays', () => {
    const movement: ElementMovementAction = {
      id: 'mv-1',
      elementId: 'p1',
      actionType: 'run',
      from: { x: 10, y: 10 },
      to: { x: 50, y: 30 },
      startDelayMs: 1000,
      durationMs: 2000,
    };

    it('remains at starting position before startDelayMs', () => {
      const stateBefore = calculateMovementPositionAtTime(movement, 400);
      expect(stateBefore.isStarted).toBe(false);
      expect(stateBefore.isCompleted).toBe(false);
      expect(stateBefore.progress).toBe(0);
      expect(stateBefore.position).toEqual({ x: 10, y: 10 });
    });

    it('interpolates intermediate position during movement', () => {
      // elapsed = 2000ms -> active = 1000ms out of 2000ms (50%)
      const stateMid = calculateMovementPositionAtTime(movement, 2000);
      expect(stateMid.isStarted).toBe(true);
      expect(stateMid.isCompleted).toBe(false);
      expect(stateMid.progress).toBe(0.5);
      expect(stateMid.position).toEqual({ x: 30, y: 20 });
    });

    it('locks at destination once completed', () => {
      // elapsed = 3500ms -> completed
      const stateEnd = calculateMovementPositionAtTime(movement, 3500);
      expect(stateEnd.isStarted).toBe(true);
      expect(stateEnd.isCompleted).toBe(true);
      expect(stateEnd.progress).toBe(1);
      expect(stateEnd.position).toEqual({ x: 50, y: 30 });
    });
  });

  describe('Stage Interpolation & Multi-actor Coordination', () => {
    const baseElements: DiagramElement[] = [
      { id: 'p1', type: 'player', x: 20, y: 30, team: 'home', num: 10, hasBall: true },
      { id: 'p2', type: 'player', x: 50, y: 15, team: 'home', num: 9, hasBall: false },
      { id: 'ball-1', type: 'equipment', equipmentType: 'ball', x: 22, y: 30 },
    ];

    it('handles simultaneous player run and ball pass to receiver', () => {
      const stage: ExerciseAnimationStage = {
        id: 'st-1',
        stageIndex: 0,
        title: 'Attaque placée',
        durationMs: 2000,
        pauseAfterMs: 500,
        movements: [
          // P2 fait un appel en profondeur simultané
          {
            id: 'm-run',
            elementId: 'p2',
            actionType: 'run',
            from: { x: 50, y: 15 },
            to: { x: 70, y: 15 },
            startDelayMs: 0,
            durationMs: 2000,
          },
          // Le ballon est passé vers la course de P2
          {
            id: 'm-pass',
            elementId: 'ball-1',
            actionType: 'pass',
            from: { x: 22, y: 30 },
            to: { x: 70, y: 15 },
            targetElementId: 'p2',
            startDelayMs: 400,
            durationMs: 1600,
          },
        ],
      };

      // À t = 1000ms (mi-course)
      const resMid = computeStageInterpolation(stage, 1000, baseElements);
      expect(resMid.activeMovements.length).toBe(2);

      const p2Mid = resMid.elements.find((el) => el.id === 'p2') as DiagramPlayerElement;
      expect(p2Mid.x).toBe(60); // 50 + 50% de 20
      expect(p2Mid.y).toBe(15);

      // À t = 2000ms (fin de la passe et de la course)
      const resEnd = computeStageInterpolation(stage, 2000, baseElements);
      const p2End = resEnd.elements.find((el) => el.id === 'p2') as DiagramPlayerElement;
      expect(p2End.x).toBe(70);
      expect(p2End.hasBall).toBe(true); // P2 est devenu porteur
    });

    it('moves ball along with player during a dribble movement', () => {
      const stage: ExerciseAnimationStage = {
        id: 'st-dribble',
        stageIndex: 0,
        title: 'Conduite de balle',
        durationMs: 2000,
        movements: [
          {
            id: 'm-dribble',
            elementId: 'p1',
            actionType: 'dribble',
            from: { x: 20, y: 30 },
            to: { x: 40, y: 30 },
            startDelayMs: 0,
            durationMs: 2000,
            hasBall: true,
          },
        ],
      };

      const res = computeStageInterpolation(stage, 1000, baseElements);
      const ball = res.elements.find((el) => el.id === 'ball-1') as DiagramEquipmentElement;
      const p1 = res.elements.find((el) => el.id === 'p1') as DiagramPlayerElement;

      expect(p1.x).toBe(30);
      expect(ball.x).toBe(32); // La balle est positionnée devant le joueur
      expect(res.ballCarrierId).toBe('p1');
    });
  });

  describe('Timeline Duration & Scrubber Resolution', () => {
    const animation: ExerciseDiagramAnimationData = {
      version: 1,
      loop: true,
      playbackSpeed: 1.0,
      autoPauseBetweenStages: false,
      stages: [
        {
          id: 's1',
          stageIndex: 0,
          title: 'Phase 1',
          durationMs: 2000,
          pauseAfterMs: 500, // Total s1 = 2500ms
          movements: [],
        },
        {
          id: 's2',
          stageIndex: 1,
          title: 'Phase 2',
          durationMs: 3000,
          pauseAfterMs: 500, // Total s2 = 3500ms
          movements: [],
        },
      ],
    };

    it('calculates total animation duration in milliseconds', () => {
      expect(getTotalAnimationDurationMs(animation)).toBe(6000);
    });

    it('resolves stage index and elapsed time from total milliseconds', () => {
      // 1500ms -> Phase 1, elapsed 1500ms
      const res1 = resolveStageAndElapsedFromTotalMs(animation, 1500);
      expect(res1.stageIndex).toBe(0);
      expect(res1.stageElapsedMs).toBe(1500);

      // 3000ms -> Phase 2, elapsed 500ms (2500ms consommés par Phase 1)
      const res2 = resolveStageAndElapsedFromTotalMs(animation, 3000);
      expect(res2.stageIndex).toBe(1);
      expect(res2.stageElapsedMs).toBe(500);

      // 6500ms avec loop=true -> boucle à 500ms dans Phase 1
      const resLoop = resolveStageAndElapsedFromTotalMs(animation, 6500);
      expect(resLoop.stageIndex).toBe(0);
      expect(resLoop.stageElapsedMs).toBe(500);
    });
  });

  describe('Conversion of Static Arrows to Animation Stage', () => {
    it('converts static movement and pass arrows into animated actions', () => {
      const elements: DiagramElement[] = [
        { id: 'player-a', type: 'player', x: 20, y: 30, team: 'home', num: 8 },
        { id: 'player-b', type: 'player', x: 45, y: 30, team: 'home', num: 9 },
        { id: 'ball', type: 'equipment', equipmentType: 'ball', x: 20, y: 30 },
        // Flèche de passe de player-a vers player-b
        {
          id: 'arr-pass',
          type: 'arrow',
          kind: 'pass',
          fromX: 20,
          fromY: 30,
          toX: 45,
          toY: 30,
        },
        // Flèche de course de player-b vers le but
        {
          id: 'arr-run',
          type: 'arrow',
          kind: 'movement',
          fromX: 45,
          fromY: 30,
          toX: 70,
          toY: 30,
          controlX: 58,
          controlY: 22,
        },
      ];

      const stage = convertStaticArrowsToAnimationStage(elements, 'Atelier passes');
      expect(stage.movements.length).toBe(2);

      const passMv = stage.movements.find((m) => m.actionType === 'pass');
      expect(passMv).toBeDefined();
      expect(passMv?.targetElementId).toBe('player-b');

      const runMv = stage.movements.find((m) => m.actionType === 'run');
      expect(runMv).toBeDefined();
      expect(runMv?.elementId).toBe('player-b');
      expect(runMv?.controlPoint).toEqual({ x: 58, y: 22 });
    });
  });

  describe('Export & Keyframe Extraction', () => {
    it('extracts keyframe snapshots for each animated stage', () => {
      const diagram = createEmptyDiagram('Exercice 3v2');
      diagram.elements = [
        { id: 'p1', type: 'player', x: 10, y: 10, team: 'home' },
        { id: 'p2', type: 'player', x: 20, y: 20, team: 'away' },
      ];
      diagram.animation = {
        version: 1,
        loop: false,
        playbackSpeed: 1,
        autoPauseBetweenStages: false,
        stages: [
          {
            id: 'st-1',
            stageIndex: 0,
            title: 'Phase 1 : Pressing',
            instruction: 'Monter en bloc',
            durationMs: 1000,
            movements: [
              {
                id: 'm1',
                elementId: 'p2',
                actionType: 'run',
                from: { x: 20, y: 20 },
                to: { x: 15, y: 15 },
                startDelayMs: 0,
                durationMs: 1000,
              },
            ],
          },
        ],
      };

      const keyframes = extractAnimationKeyframes(diagram);
      expect(keyframes.length).toBe(1);
      expect(keyframes[0].stageTitle).toBe('Phase 1 : Pressing');
      expect(keyframes[0].instruction).toBe('Monter en bloc');

      const p2End = keyframes[0].elements.find((el) => el.id === 'p2');
      expect((p2End as any).x).toBe(15);
      expect((p2End as any).y).toBe(15);
    });

    it('gracefully falls back to static elements when no animation exists', () => {
      const diagram = createEmptyDiagram('Statique pur');
      diagram.elements = [{ id: 'p1', type: 'player', x: 50, y: 32, team: 'home' }];

      const keyframes = extractAnimationKeyframes(diagram);
      expect(keyframes.length).toBe(1);
      expect(keyframes[0].elements.length).toBe(1);
    });
  });

  describe('Diagram Normalization & Cloning Integrity', () => {
    it('deep-clones animation stages and movements without reference sharing', () => {
      const original = createEmptyDiagram('Original Animé');
      original.animation = {
        version: 1,
        loop: true,
        playbackSpeed: 1.5,
        autoPauseBetweenStages: false,
        stages: [
          {
            id: 'orig-stage',
            stageIndex: 0,
            title: 'Étape originale',
            durationMs: 2000,
            movements: [
              {
                id: 'orig-mv',
                elementId: 'p1',
                actionType: 'run',
                from: { x: 10, y: 10 },
                to: { x: 30, y: 30 },
                startDelayMs: 0,
                durationMs: 2000,
              },
            ],
          },
        ],
      };

      const cloned = cloneDiagram(original, 'Copie Séance');

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.name).toBe('Copie Séance');
      expect(cloned.animation).toBeDefined();
      expect(cloned.animation?.stages[0].id).not.toBe(original.animation.stages[0].id);
      expect(cloned.animation?.stages[0].movements[0].id).not.toBe(
        original.animation.stages[0].movements[0].id,
      );

      // Mutating copy does not mutate original
      cloned.animation!.stages[0].movements[0].to.x = 99;
      expect(original.animation.stages[0].movements[0].to.x).toBe(30);
    });

    it('safely normalizes raw diagram with missing or corrupted animation data', () => {
      const raw = {
        id: 'corrupt-1',
        name: 'Test Corrupt',
        elements: [],
        animation: {
          stages: [
            {
              title: 12345, // incorrect type
              durationMs: -500, // negative duration
              movements: [
                {
                  actionType: 'unknown_action',
                  from: { x: 'invalid' },
                },
              ],
            },
          ],
        },
      };

      const normalized = normalizeDiagramData(raw);
      expect(normalized.animation).toBeDefined();
      expect(normalized.animation?.stages[0].durationMs).toBe(3000); // defaulted
      expect(normalized.animation?.stages[0].movements[0].from.x).toBe(50); // defaulted
    });
  });
});
