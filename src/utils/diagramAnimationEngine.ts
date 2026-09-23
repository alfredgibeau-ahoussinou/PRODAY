import type {
  DiagramArrowElement,
  DiagramElement,
  DiagramEquipmentElement,
  DiagramPlayerElement,
  ExerciseDiagramData,
} from '../models/ExerciseDiagram';
import type {
  ElementMovementAction,
  ExerciseAnimationStage,
  ExerciseDiagramAnimationData,
  TrajectoryPoint,
} from '../models/ExerciseDiagramAnimation';

/**
 * Interpolation linéaire simple entre deux points.
 */
export function interpolateLinear(p0: TrajectoryPoint, p1: TrajectoryPoint, t: number): TrajectoryPoint {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: Number((p0.x + (p1.x - p0.x) * clampedT).toFixed(2)),
    y: Number((p0.y + (p1.y - p0.y) * clampedT).toFixed(2)),
  };
}

/**
 * Interpolation courbe quadratique de Bézier:
 * B(t) = (1-t)^2 * P0 + 2(1-t)t * Pc + t^2 * P1
 */
export function interpolateQuadraticBezier(
  p0: TrajectoryPoint,
  pc: TrajectoryPoint,
  p1: TrajectoryPoint,
  t: number,
): TrajectoryPoint {
  const clampedT = Math.max(0, Math.min(1, t));
  const u = 1 - clampedT;
  const tt = clampedT * clampedT;
  const uu = u * u;
  const u2t = 2 * u * clampedT;

  return {
    x: Number((uu * p0.x + u2t * pc.x + tt * p1.x).toFixed(2)),
    y: Number((uu * p0.y + u2t * pc.y + tt * p1.y).toFixed(2)),
  };
}

/**
 * Calcule la position exacte d'un mouvement à un instant T (ms) au sein de l'étape.
 */
export function calculateMovementPositionAtTime(
  movement: ElementMovementAction,
  elapsedMs: number,
): {
  position: TrajectoryPoint;
  isStarted: boolean;
  isCompleted: boolean;
  progress: number;
} {
  const delay = Math.max(0, movement.startDelayMs || 0);
  const duration = Math.max(1, movement.durationMs || 1000);

  if (elapsedMs < delay) {
    return {
      position: { ...movement.from },
      isStarted: false,
      isCompleted: false,
      progress: 0,
    };
  }

  const activeElapsed = elapsedMs - delay;
  const progress = Math.min(1, activeElapsed / duration);

  let pos: TrajectoryPoint;
  if (movement.controlPoint) {
    pos = interpolateQuadraticBezier(movement.from, movement.controlPoint, movement.to, progress);
  } else {
    pos = interpolateLinear(movement.from, movement.to, progress);
  }

  return {
    position: pos,
    isStarted: true,
    isCompleted: progress >= 1,
    progress,
  };
}

export interface StageInterpolationResult {
  elements: DiagramElement[];
  activeMovements: ElementMovementAction[];
  ballCarrierId?: string;
  stageProgress: number; // 0 à 1
}

/**
 * Calcule l'état de tous les éléments du schéma pour une étape et un temps donné.
 */
export function computeStageInterpolation(
  stage: ExerciseAnimationStage,
  elapsedMs: number,
  baseElements: DiagramElement[],
): StageInterpolationResult {
  const totalStageDuration = Math.max(1, stage.durationMs + (stage.pauseAfterMs || 0));
  const stageProgress = Math.max(0, Math.min(1, elapsedMs / totalStageDuration));

  // Map des positions initiales ou de base
  const positionsMap = new Map<string, TrajectoryPoint>();

  // 1. Initialiser avec baseElements
  for (const el of baseElements) {
    if ('x' in el && 'y' in el) {
      positionsMap.set(el.id, { x: el.x, y: el.y });
    }
  }

  // 2. Écraser avec initialPositions si défini pour l'étape
  if (stage.initialPositions) {
    for (const [id, pt] of Object.entries(stage.initialPositions)) {
      positionsMap.set(id, pt);
    }
  }

  // 3. Calculer les déplacements actifs
  const activeMovements: ElementMovementAction[] = [];
  let currentBallCarrierId: string | undefined = undefined;
  let computedBallPos: TrajectoryPoint | undefined = undefined;

  for (const mv of stage.movements) {
    const calc = calculateMovementPositionAtTime(mv, elapsedMs);

    // Mettre à jour la position de l'élément cible
    positionsMap.set(mv.elementId, calc.position);

    if (calc.isStarted && !calc.isCompleted) {
      activeMovements.push(mv);
    }

    // Gestion du porteur de balle
    if (mv.hasBall) {
      if (calc.isStarted && (!calc.isCompleted || elapsedMs < stage.durationMs)) {
        currentBallCarrierId = mv.elementId;
        // La balle accompagne le joueur (légèrement décalée vers l'avant de sa course)
        computedBallPos = {
          x: Math.max(0, Math.min(100, calc.position.x + 2)),
          y: Math.max(0, Math.min(64, calc.position.y)),
        };
      }
    }

    // Si le mouvement concerne directement la balle (ex: passe ou frappe)
    if (mv.actionType === 'pass' || mv.actionType === 'shot') {
      if (calc.isStarted) {
        computedBallPos = calc.position;
        // Si la passe est achevée et vise un coéquipier, ce coéquipier prend la balle
        if (calc.isCompleted && mv.targetElementId) {
          currentBallCarrierId = mv.targetElementId;
        } else {
          currentBallCarrierId = undefined;
        }
      }
    }
  }

  // 4. Reconstruire la liste des DiagramElement avec positions interpolées
  const updatedElements: DiagramElement[] = baseElements.map((el) => {
    if (el.type === 'player') {
      const p = el as DiagramPlayerElement;
      const pos = positionsMap.get(p.id) || { x: p.x, y: p.y };
      const hasBall = currentBallCarrierId ? currentBallCarrierId === p.id : Boolean(p.hasBall);
      return {
        ...p,
        x: pos.x,
        y: pos.y,
        hasBall,
      };
    }

    if (el.type === 'equipment') {
      const eq = el as DiagramEquipmentElement;
      if (eq.equipmentType === 'ball') {
        const ballPos = computedBallPos || positionsMap.get(eq.id) || { x: eq.x, y: eq.y };
        return {
          ...eq,
          x: ballPos.x,
          y: ballPos.y,
        };
      }
      const pos = positionsMap.get(eq.id) || { x: eq.x, y: eq.y };
      return {
        ...eq,
        x: pos.x,
        y: pos.y,
      };
    }

    return el;
  });

  return {
    elements: updatedElements,
    activeMovements,
    ballCarrierId: currentBallCarrierId,
    stageProgress,
  };
}

/**
 * Calcule la durée totale en millisecondes d'une animation complète.
 */
export function getTotalAnimationDurationMs(animation: ExerciseDiagramAnimationData): number {
  if (!animation.stages || animation.stages.length === 0) return 0;
  return animation.stages.reduce((acc, st) => {
    return acc + Math.max(500, st.durationMs + (st.pauseAfterMs || 0));
  }, 0);
}

/**
 * Résout l'index d'étape et le temps écoulé dans cette étape à partir du temps absolu (scrubber).
 */
export function resolveStageAndElapsedFromTotalMs(
  animation: ExerciseDiagramAnimationData,
  totalElapsedMs: number,
): {
  stageIndex: number;
  stageElapsedMs: number;
  isEnd: boolean;
} {
  const stages = animation.stages || [];
  if (stages.length === 0) {
    return { stageIndex: 0, stageElapsedMs: 0, isEnd: true };
  }

  const totalDuration = getTotalAnimationDurationMs(animation);
  if (totalDuration <= 0) {
    return { stageIndex: 0, stageElapsedMs: 0, isEnd: true };
  }

  // Normalisation du temps si bouclage
  let runningMs = animation.loop ? totalElapsedMs % totalDuration : Math.min(totalElapsedMs, totalDuration);
  const isEnd = !animation.loop && totalElapsedMs >= totalDuration;

  for (let i = 0; i < stages.length; i++) {
    const st = stages[i];
    const stDuration = Math.max(500, st.durationMs + (st.pauseAfterMs || 0));

    if (runningMs < stDuration || i === stages.length - 1) {
      return {
        stageIndex: i,
        stageElapsedMs: Math.max(0, runningMs),
        isEnd,
      };
    }

    runningMs -= stDuration;
  }

  return {
    stageIndex: stages.length - 1,
    stageElapsedMs: stages[stages.length - 1].durationMs,
    isEnd: true,
  };
}

/**
 * Calcule la distance euclidienne entre 2 points.
 */
function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Convertit automatiquement les flèches statiques déjà dessinées sur un schéma
 * en actions de mouvement pour créer une animation instantanée.
 */
export function convertStaticArrowsToAnimationStage(
  elements: DiagramElement[],
  stageTitle = 'Phase animée automatique',
  instruction?: string,
): ExerciseAnimationStage {
  const arrows = elements.filter((el): el is DiagramArrowElement => el.type === 'arrow');
  const players = elements.filter((el): el is DiagramPlayerElement => el.type === 'player');
  const equipments = elements.filter((el): el is DiagramEquipmentElement => el.type === 'equipment');
  const ball = equipments.find((eq) => eq.equipmentType === 'ball');

  const movements: ElementMovementAction[] = [];
  const initialPositions: Record<string, TrajectoryPoint> = {};

  // Remplir les positions initiales
  for (const p of players) {
    initialPositions[p.id] = { x: p.x, y: p.y };
  }
  if (ball) {
    initialPositions[ball.id] = { x: ball.x, y: ball.y };
  }

  let cumulativeDelay = 0;

  for (const arrow of arrows) {
    const fromPt = { x: arrow.fromX, y: arrow.fromY };
    const toPt = { x: arrow.toX, y: arrow.toY };
    const ctrlPt = arrow.controlX != null && arrow.controlY != null ? { x: arrow.controlX, y: arrow.controlY } : undefined;

    // Trouver l'acteur le plus proche du départ de la flèche
    let closestId: string | null = null;
    let minDist = 8.0; // Distance max acceptable (en % de terrain)

    if (arrow.kind === 'pass' && ball) {
      closestId = ball.id;
    } else {
      for (const p of players) {
        const d = distance(fromPt, { x: p.x, y: p.y });
        if (d < minDist) {
          minDist = d;
          closestId = p.id;
        }
      }
      if (!closestId && ball && distance(fromPt, { x: ball.x, y: ball.y }) < minDist) {
        closestId = ball.id;
      }
    }

    if (closestId) {
      let actionType: ElementMovementAction['actionType'] = 'run';
      let hasBall = false;

      if (arrow.kind === 'pass') {
        actionType = 'pass';
      } else if (arrow.kind === 'dribble') {
        actionType = 'dribble';
        hasBall = true;
      } else if (arrow.kind === 'shot') {
        actionType = 'shot';
      }

      // Si passe, trouver le joueur récepteur éventuel proche de toPt
      let targetElementId: string | undefined = undefined;
      if (actionType === 'pass') {
        for (const p of players) {
          if (p.id !== closestId && distance(toPt, { x: p.x, y: p.y }) < 8.0) {
            targetElementId = p.id;
            break;
          }
        }
      }

      const dist = distance(fromPt, toPt);
      const durationMs = Math.max(1000, Math.min(3000, Math.round(dist * 60)));

      movements.push({
        id: `auto-mv-${movements.length + 1}`,
        elementId: closestId,
        actionType,
        from: fromPt,
        to: toPt,
        controlPoint: ctrlPt,
        startDelayMs: cumulativeDelay,
        durationMs,
        hasBall,
        targetElementId,
      });

      // Actions consécutives par défaut si multiples flèches
      cumulativeDelay += Math.round(durationMs * 0.7);
    }
  }

  const totalDuration = Math.max(3000, cumulativeDelay + 1000);

  return {
    id: `anim-stage-auto-${Date.now()}`,
    stageIndex: 0,
    title: stageTitle,
    instruction: instruction || 'Animation générée à partir des trajectoires tracées',
    durationMs: totalDuration,
    pauseAfterMs: 600,
    movements,
    initialPositions,
  };
}

/**
 * Extrait une séquence de keyframes pour l'impression A4/PDF ou le mode
 * statique accessible (réduction des animations).
 */
export function extractAnimationKeyframes(
  diagram: ExerciseDiagramData,
): Array<{
  stageIndex: number;
  stageTitle: string;
  instruction?: string;
  elements: DiagramElement[];
}> {
  if (!diagram.animation || !diagram.animation.stages || diagram.animation.stages.length === 0) {
    // Si pas d'animation, renvoyer les étapes statiques existantes ou le schéma de base
    if (diagram.stages && diagram.stages.length > 0) {
      return diagram.stages.map((st, i) => ({
        stageIndex: i,
        stageTitle: st.name,
        instruction: st.instructions,
        elements: st.elements && st.elements.length > 0 ? st.elements : diagram.elements,
      }));
    }
    return [
      {
        stageIndex: 0,
        stageTitle: diagram.name || 'Position initiale',
        instruction: diagram.instructions,
        elements: diagram.elements,
      },
    ];
  }

  const baseElements = diagram.elements || [];
  return diagram.animation.stages.map((stage, idx) => {
    // Calculer les positions à la fin de l'étape
    const interp = computeStageInterpolation(stage, stage.durationMs, baseElements);
    return {
      stageIndex: idx,
      stageTitle: stage.title || `Phase ${idx + 1}`,
      instruction: stage.instruction,
      elements: interp.elements,
    };
  });
}
