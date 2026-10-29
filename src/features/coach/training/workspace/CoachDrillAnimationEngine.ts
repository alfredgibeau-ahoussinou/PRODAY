/**
 * Moteur d'Animation Multi-Frames & Interpolation Temporelle Déterministe.
 * Conforme à la section 5 du Master Engineering Prompt.
 */

import type {
  Drill,
  DrillFrame,
  EquipmentToken,
  NormalizedPoint,
  PlayerToken,
} from './trainingWorkspaceModel';

export interface InterpolatedFrameState {
  players: PlayerToken[];
  equipment: EquipmentToken[];
  currentFrameIndex: number;
  frameProgress: number; // 0..1
  isLoopComplete: boolean;
}

/** Interpolation linéaire entre deux points */
export function interpolatePoint(p1: NormalizedPoint, p2: NormalizedPoint, t: number): NormalizedPoint {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: p1.x + (p2.x - p1.x) * clampedT,
    y: p1.y + (p2.y - p1.y) * clampedT,
    z: (p1.z ?? 0) + ((p2.z ?? 0) - (p1.z ?? 0)) * clampedT,
  };
}

/** Interpolation quadratique Bézier (pour tirs, passes lobées ou courses courbes) */
export function interpolateQuadraticBezier(
  p0: NormalizedPoint,
  p1: NormalizedPoint,
  p2: NormalizedPoint,
  t: number,
): NormalizedPoint {
  const clampedT = Math.max(0, Math.min(1, t));
  const u = 1 - clampedT;
  const tt = clampedT * clampedT;
  const uu = u * u;

  return {
    x: uu * p0.x + 2 * u * clampedT * p1.x + tt * p2.x,
    y: uu * p0.y + 2 * u * clampedT * p1.y + tt * p2.y,
    z: (p0.z ?? 0) * uu + 2 * u * clampedT * (p1.z ?? 0) + tt * (p2.z ?? 0),
  };
}

/** Calcule la durée totale d'un atelier en millisecondes */
export function getDrillTotalDurationMs(drill: Drill): number {
  if (!drill.frames || drill.frames.length === 0) return 0;
  return drill.frames.reduce((sum, f) => sum + (f.durationMs || 2500), 0);
}

export const calculateDrillTotalDurationMs = getDrillTotalDurationMs;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Échantillonne l'état complet du terrain à un timestamp exact `timeMs`.
 * Fonction pure et déterministe, garantissant que le scrubbing en avant et en arrière est instantané et parfait.
 */
export function sampleDrillAtTime(drill: Drill, timeMs: number): InterpolatedFrameState {
  if (!drill.frames || drill.frames.length === 0) {
    return {
      players: [],
      equipment: [],
      currentFrameIndex: 0,
      frameProgress: 0,
      isLoopComplete: true,
    };
  }

  const totalDuration = getDrillTotalDurationMs(drill);
  if (totalDuration === 0) {
    const f0 = drill.frames[0];
    return {
      players: f0.players || [],
      equipment: f0.equipment || [],
      currentFrameIndex: 0,
      frameProgress: 0,
      isLoopComplete: false,
    };
  }

  // Normalisation du temps dans la boucle [0..totalDuration]
  const normalizedTime = timeMs % totalDuration;
  let elapsed = 0;
  let frameIdx = 0;
  let currentFrame = drill.frames[0];

  for (let i = 0; i < drill.frames.length; i++) {
    const dur = drill.frames[i].durationMs || 2500;
    if (normalizedTime < elapsed + dur) {
      frameIdx = i;
      currentFrame = drill.frames[i];
      break;
    }
    elapsed += dur;
  }

  const currentDuration = currentFrame.durationMs || 2500;
  const timeIntoFrame = normalizedTime - elapsed;
  const progress = Math.max(0, Math.min(1, timeIntoFrame / currentDuration));

  const nextFrameIndex = (frameIdx + 1) % drill.frames.length;
  const nextFrame = drill.frames[nextFrameIndex];

  // Interpolation des positions des joueurs
  const players: PlayerToken[] = (currentFrame.players || []).map((p) => {
    const nextP = (nextFrame?.players || []).find((np) => np.id === p.id);
    if (!nextP) return p;

    // Détection de trajectoire courbe si une flèche de course courbe existe
    const runDrawing = currentFrame.drawings?.find(
      (d) => d.from && Math.hypot(d.from.x - p.x, d.from.y - p.y) < 7.0 && d.controlPoint,
    );

    let pos: NormalizedPoint;
    if (runDrawing && runDrawing.controlPoint) {
      pos = interpolateQuadraticBezier(
        { x: p.x, y: p.y },
        runDrawing.controlPoint,
        { x: nextP.x, y: nextP.y },
        progress,
      );
    } else {
      pos = interpolatePoint({ x: p.x, y: p.y }, { x: nextP.x, y: nextP.y }, progress);
    }

    return {
      ...p,
      x: pos.x,
      y: pos.y,
    };
  });

  // Interpolation des positions des équipements (notamment le ballon)
  const equipment: EquipmentToken[] = (currentFrame.equipment || []).map((eq) => {
    const nextEq = (nextFrame?.equipment || []).find((ne) => ne.id === eq.id);
    if (!nextEq) return eq;

    // Le ballon suit les passes et les tirs
    if (eq.type === 'ball') {
      const passDrawing = currentFrame.drawings?.find(
        (d) => d.type === 'pass' && Math.hypot(d.from.x - eq.x, d.from.y - eq.y) < 7.0,
      );

      let pos: NormalizedPoint;
      if (passDrawing && passDrawing.controlPoint) {
        pos = interpolateQuadraticBezier(
          { x: eq.x, y: eq.y },
          passDrawing.controlPoint,
          { x: nextEq.x, y: nextEq.y },
          progress,
        );
      } else {
        pos = interpolatePoint({ x: eq.x, y: eq.y }, { x: nextEq.x, y: nextEq.y }, progress);
      }

      return {
        ...eq,
        x: pos.x,
        y: pos.y,
      };
    }

    const pos = interpolatePoint({ x: eq.x, y: eq.y }, { x: nextEq.x, y: nextEq.y }, progress);
    return {
      ...eq,
      x: pos.x,
      y: pos.y,
    };
  });

  return {
    players,
    equipment,
    currentFrameIndex: frameIdx,
    frameProgress: progress,
    isLoopComplete: normalizedTime >= totalDuration - 50,
  };
}

/** Crée une nouvelle frame dupliquée ou dérivée de la frame précédente */
export function createNextFrame(previousFrame: DrillFrame, orderIndex: number): DrillFrame {
  return {
    id: `frame_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    order: orderIndex,
    title: `Phase ${orderIndex + 1}`,
    durationMs: 2500,
    players: previousFrame.players.map((p) => ({ ...p })),
    equipment: previousFrame.equipment.map((e) => ({ ...e })),
    drawings: [], // Les flèches sont réinitialisées pour la nouvelle phase
    zones: (previousFrame.zones || []).map((z) => ({ ...z, points: (z.points || []).map((pt) => ({ ...pt })) })),
    notes: 'Poursuite de l’action',
  };
}
