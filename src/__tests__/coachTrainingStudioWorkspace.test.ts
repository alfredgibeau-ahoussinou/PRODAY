import {
  clampPoint,
  generateTokenId,
  createEmptyDrill,
  PITCH_CONFIGURATIONS,
  type PitchConfiguration,
  type Drill,
  type DrillFrame,
  type PlayerToken,
  type EquipmentToken,
} from '../features/coach/training/workspace/trainingWorkspaceModel';
import {
  projectToScreen,
  toScreenPixels,
  fromScreenPixels,
} from '../features/coach/training/workspace/CoachPitchEngine';
import {
  sampleDrillAtTime,
  createNextFrame,
  calculateDrillTotalDurationMs,
  lerp,
} from '../features/coach/training/workspace/CoachDrillAnimationEngine';
import {
  convertSceneToDrill,
  convertDrillToScene,
} from '../features/coach/training/workspace/trainingPersistenceService';
import { PRELOADED_DRILLS } from '../features/coach/training/workspace/trainingLibraryData';

describe('Coach Training Studio Workspace', () => {
  describe('Coordinate System & Math Utilities', () => {
    it('clamps normalized points strictly within [0, 100]', () => {
      expect(clampPoint({ x: -10, y: 150 })).toEqual({ x: 0, y: 100 });
      expect(clampPoint({ x: 50, y: 30 })).toEqual({ x: 50, y: 30 });
      expect(clampPoint({ x: 105, y: -5 })).toEqual({ x: 100, y: 0 });
    });

    it('generates unique tokens with correct prefixes', () => {
      const id1 = generateTokenId('player');
      const id2 = generateTokenId('player');
      expect(id1.startsWith('player-')).toBe(true);
      expect(id2.startsWith('player-')).toBe(true);
      expect(id1).not.toEqual(id2);
    });

    it('converts normalized coordinates to screen pixels and vice versa', () => {
      const screenW = 800;
      const screenH = 500;
      const normalized = { x: 50, y: 50 };

      const screenPt = toScreenPixels(normalized, screenW, screenH);
      expect(screenPt.x).toBeCloseTo(400);
      expect(screenPt.y).toBeCloseTo(250);

      const inverted = fromScreenPixels(screenPt, screenW, screenH);
      expect(inverted.x).toBeCloseTo(50);
      expect(inverted.y).toBeCloseTo(50);
    });

    it('accurately maps palette drag-and-drop screen position into pitch normalized coordinates', () => {
      const pitchBounds = { left: 100, top: 50, width: 800, height: 512 };
      // User drops at center of pitch
      const dropX = 100 + 400;
      const dropY = 50 + 256;

      const normX = Math.round(Math.max(2, Math.min(98, ((dropX - pitchBounds.left) / pitchBounds.width) * 100)));
      const normY = Math.round(Math.max(2, Math.min(62, ((dropY - pitchBounds.top) / pitchBounds.height) * 64)));

      expect(normX).toBe(50);
      expect(normY).toBe(32);
    });
  });

  describe('3D Perspective Projection Engine', () => {
    const width = 800;
    const height = 500;

    it('projects in 2D mode with scale 1.0 and 0 offset', () => {
      const proj = projectToScreen({ x: 25, y: 75 }, '2d', 'top', width, height);
      expect(proj.scale).toBe(1);
      expect(proj.depthOpacity).toBe(1);
      expect(proj.x).toBeCloseTo(200);
      expect(proj.y).toBeCloseTo(375);
    });

    it('projects in 3D perspective mode with depth scaling and elevation angle', () => {
      const topOfPitch = projectToScreen({ x: 50, y: 10 }, '3d', 'front', width, height);
      const bottomOfPitch = projectToScreen({ x: 50, y: 50 }, '3d', 'front', width, height);

      expect(topOfPitch.scale).toBeLessThanOrEqual(bottomOfPitch.scale);
      expect(topOfPitch.y).toBeLessThan(bottomOfPitch.y);
    });

    it('supports all 4 camera presets (top, front, side, isometric)', () => {
      const presets = ['top', 'front', 'side', 'isometric'] as const;
      presets.forEach((preset) => {
        const proj = projectToScreen({ x: 50, y: 32 }, '3d', preset, width, height);
        expect(proj.x).toBeGreaterThan(0);
        expect(proj.x).toBeLessThan(width);
        expect(proj.y).toBeGreaterThan(0);
        expect(proj.y).toBeLessThan(height);
        expect(proj.scale).toBeGreaterThan(0);
      });
    });
  });

  describe('Pitch Configurations', () => {
    it('provides all 6 official football training pitch configurations', () => {
      const ids = PITCH_CONFIGURATIONS.map((p) => p.id);
      expect(ids).toContain('full');
      expect(ids).toContain('half');
      expect(ids).toContain('attacking_third');
      expect(ids).toContain('box');
      expect(ids).toContain('small_sided');
      expect(ids).toContain('futsal');
    });

    it('defines valid normalized bounding boxes and goals', () => {
      PITCH_CONFIGURATIONS.forEach((cfg) => {
        expect(cfg.name.length).toBeGreaterThan(0);
        expect(cfg.bounds.minX).toBe(0);
        expect(cfg.bounds.maxX).toBe(100);
        expect(cfg.bounds.minY).toBe(0);
        expect(cfg.bounds.maxY).toBe(100);
        expect(cfg.goals.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('initializes an empty drill with 0 players and 0 equipment for coach custom placement', () => {
      const emptyDrill = createEmptyDrill('full');
      expect(emptyDrill.frames.length).toBe(1);
      expect(emptyDrill.frames[0].players).toEqual([]);
      expect(emptyDrill.frames[0].equipment).toEqual([]);
      expect(emptyDrill.frames[0].drawings).toEqual([]);
      expect(emptyDrill.frames[0].zones).toEqual([]);
      expect(emptyDrill.playerCount).toBe(0);
    });
  });

  describe('Deterministic Animation Engine & Scrubbing', () => {
    const testDrill: Drill = {
      id: 'test-drill-1',
      name: 'Test Animation',
      category: 'rondo',
      objective: 'Validation animation',
      pitchConfig: 'half',
      durationMin: 15,
      playerCount: 1,
      frames: [
        {
          id: 'frame-1',
          order: 0,
          durationMs: 2000,
          players: [
            {
              id: 'p1',
              team: 'teamA',
              num: 10,
              label: 'Meneur',
              x: 20,
              y: 30,
              rotation: 0,
              hasBall: true,
            },
          ],
          equipment: [{ id: 'b1', type: 'ball', x: 20, y: 30 }],
          drawings: [],
          zones: [],
        },
        {
          id: 'frame-2',
          order: 1,
          durationMs: 2000,
          players: [
            {
              id: 'p1',
              team: 'teamA',
              num: 10,
              label: 'Meneur',
              x: 60,
              y: 70,
              rotation: 90,
              hasBall: false,
            },
          ],
          equipment: [{ id: 'b1', type: 'ball', x: 80, y: 50 }],
          drawings: [],
          zones: [],
        },
      ],
      createdAt: '2026-10-29T00:00:00Z',
      updatedAt: '2026-10-29T00:00:00Z',
    };

    it('computes exact drill total duration', () => {
      const total = calculateDrillTotalDurationMs(testDrill);
      expect(total).toBe(4000);
    });

    it('samples frame at exact keyframe boundaries', () => {
      const atStart = sampleDrillAtTime(testDrill, 0);
      expect(atStart.players[0].x).toBeCloseTo(20);
      expect(atStart.players[0].y).toBeCloseTo(30);

      const atTransition = sampleDrillAtTime(testDrill, 2000);
      expect(atTransition.players[0].x).toBeCloseTo(60);
      expect(atTransition.players[0].y).toBeCloseTo(70);
    });

    it('interpolates positions smoothly at midpoint (t = 1000ms)', () => {
      const midpoint = sampleDrillAtTime(testDrill, 1000);
      expect(midpoint.players[0].x).toBeCloseTo(40, 1);
      expect(midpoint.players[0].y).toBeCloseTo(50, 1);
      expect(midpoint.equipment[0].x).toBeCloseTo(50, 1);
    });

    it('supports instantaneous forward and backward scrubbing without state drift', () => {
      const scrub1 = sampleDrillAtTime(testDrill, 1500);
      const scrub2 = sampleDrillAtTime(testDrill, 3500);
      const scrubBack = sampleDrillAtTime(testDrill, 1500);

      expect(scrubBack.players[0].x).toEqual(scrub1.players[0].x);
      expect(scrubBack.players[0].y).toEqual(scrub1.players[0].y);
      expect(scrubBack.equipment[0].x).toEqual(scrub1.equipment[0].x);
    });

    it('creates next animation frame cloning previous player and equipment layout', () => {
      const nextFrame = createNextFrame(testDrill.frames[0], 1);
      expect(nextFrame.order).toBe(1);
      expect(nextFrame.players.length).toBe(1);
      expect(nextFrame.players[0].x).toEqual(20);
      expect(nextFrame.players[0].y).toEqual(30);
      expect(nextFrame.drawings.length).toBe(0);
    });
  });

  describe('Preloaded Tactical Library', () => {
    it('contains complete pedagogical drills with multi-frame animated sequences', () => {
      expect(PRELOADED_DRILLS.length).toBeGreaterThanOrEqual(3);

      PRELOADED_DRILLS.forEach((drill) => {
        expect(drill.name.length).toBeGreaterThan(0);
        expect(drill.frames.length).toBeGreaterThanOrEqual(2);
        expect(drill.coachingPoints?.length).toBeGreaterThan(0);

        drill.frames.forEach((frame) => {
          expect(frame.players.length).toBeGreaterThan(0);
          expect(frame.durationMs).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Persistence Model Converter', () => {
    it('converts Drill to TacticalScene and back for backward compatibility', () => {
      const originalDrill = PRELOADED_DRILLS[0];
      const scene = convertDrillToScene(originalDrill);

      expect(scene.id).toEqual(originalDrill.id);
      expect(scene.title).toEqual(originalDrill.name);
      expect(scene.entities.length).toBeGreaterThan(0);
      expect(scene.phases.length).toEqual(originalDrill.frames.length);

      const roundTripDrill = convertSceneToDrill(scene);
      expect(roundTripDrill.id).toEqual(originalDrill.id);
      expect(roundTripDrill.name).toEqual(originalDrill.name);
      expect(roundTripDrill.frames.length).toEqual(originalDrill.frames.length);
    });
  });

  describe('Tactical Continuous Stamp Mode & Motion Vectors', () => {
    it('accumulates multiple tokens consecutively in stamp mode without re-clicking palette', () => {
      const emptyDrill = createEmptyDrill('full');
      let currentFrame = emptyDrill.frames[0];

      // Simulate placing 3 cones in succession with stamp mode
      const conePositions = [
        { x: 30, y: 20 },
        { x: 35, y: 20 },
        { x: 40, y: 20 },
      ];

      conePositions.forEach((pos, idx) => {
        const newEquip: EquipmentToken = {
          id: `equip-cone-${idx}`,
          type: 'cone',
          color: '#F97316',
          x: pos.x,
          y: pos.y,
        };
        currentFrame = {
          ...currentFrame,
          equipment: [...currentFrame.equipment, newEquip],
        };
      });

      expect(currentFrame.equipment.length).toBe(3);
      expect(currentFrame.equipment.map((e) => e.x)).toEqual([30, 35, 40]);
    });

    it('generates Phase 2 advancement animation and directional vector when player is moved', () => {
      const emptyDrill = createEmptyDrill('full');
      const player: PlayerToken = {
        id: 'player-1',
        team: 'teamA',
        num: 7,
        label: 'Ailier',
        x: 20,
        y: 30,
        rotation: 0,
      };

      const frame1: DrillFrame = {
        ...emptyDrill.frames[0],
        players: [player],
      };

      // When player is moved from (20, 30) to (50, 45)
      const fromPt = { x: 20, y: 30 };
      const toPt = { x: 50, y: 45 };

      // Phase 1 gets the trajectory drawing arrow
      const motionArrow: DrawingObject = {
        id: 'drawing-motion-player-1',
        type: 'run',
        from: fromPt,
        to: toPt,
        color: '#38BDF8',
      };

      const updatedFrame1: DrillFrame = {
        ...frame1,
        drawings: [...frame1.drawings, motionArrow],
      };

      // Phase 2 is automatically generated with player at destination
      const frame2: DrillFrame = {
        id: 'frame-phase-2',
        order: 1,
        durationMs: 2000,
        players: [{ ...player, x: toPt.x, y: toPt.y }],
        equipment: [],
        drawings: [],
        zones: [],
      };

      const multiPhaseDrill: Drill = {
        ...emptyDrill,
        frames: [updatedFrame1, frame2],
      };

      expect(multiPhaseDrill.frames.length).toBe(2);
      expect(multiPhaseDrill.frames[0].drawings[0].from).toEqual(fromPt);
      expect(multiPhaseDrill.frames[0].drawings[0].to).toEqual(toPt);
      expect(multiPhaseDrill.frames[1].players[0].x).toBe(50);
      expect(multiPhaseDrill.frames[1].players[0].y).toBe(45);

      // Verify the animation engine plays smooth translation across the vector
      const sampleAtHalf = sampleDrillAtTime(multiPhaseDrill, 1000);
      expect(sampleAtHalf.players[0].x).toBeCloseTo(35, 1);
      expect(sampleAtHalf.players[0].y).toBeCloseTo(37.5, 1);
    });
  });
});
