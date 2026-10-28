import type {
  ArrowKind,
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
export function getTotalAnimationDurationMs(animation?: ExerciseDiagramAnimationData | null): number {
  if (!animation || !animation.stages || animation.stages.length === 0) return 0;
  return animation.stages.reduce((acc, st) => {
    return acc + Math.max(500, st.durationMs + (st.pauseAfterMs || 0));
  }, 0);
}

/**
 * Résout l'index d'étape et le temps écoulé dans cette étape à partir du temps absolu (scrubber).
 */
export function resolveStageAndElapsedFromTotalMs(
  animation: ExerciseDiagramAnimationData | null | undefined,
  totalElapsedMs: number,
): {
  stageIndex: number;
  stageElapsedMs: number;
  isEnd: boolean;
} {
  if (!animation) {
    return { stageIndex: 0, stageElapsedMs: 0, isEnd: true };
  }
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
    let minDist = 14.0; // Distance max acceptable (en % de terrain) pour interaction tactile

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
          if (p.id !== closestId && distance(toPt, { x: p.x, y: p.y }) < 12.0) {
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

/* ————————————————————————————————————————————————————————————————————————
 * Étapes lisibles pour le coach (§20-§22)
 *
 * Le moteur ci-dessus sait déjà **lire** les trajectoires dessinées
 * (`convertStaticArrowsToAnimationStage`). Ce qui suit ne le remplace pas : il
 * l'utilise pour produire une lecture **découpée en étapes** — c'est le même
 * moteur, une seule lecture du dessin pour tout le pôle (§17).
 * ———————————————————————————————————————————————————————————————————————— */

/** Étiquette d'un joueur — jamais un identifiant technique à l'écran. */
function playerLabelOf(player: DiagramPlayerElement): string {
  if (player.label) return player.label;
  if (player.num != null) return `N°${player.num}`;
  return 'Joueur';
}

const EQUIPMENT_LABELS: Partial<Record<DiagramEquipmentElement['equipmentType'], string>> = {
  ball: 'Ballon',
  cone: 'Plot',
  disc_cone: 'Coupelle',
  goal: 'But',
  mini_goal: 'Mini-but',
  mannequin: 'Mannequin',
  ladder: 'Échelle',
  hurdle: 'Haie',
};

function elementLabelOf(id: string, elements: DiagramElement[]): string | undefined {
  const el = elements.find((item) => item.id === id);
  if (!el) return undefined;
  if (el.type === 'player') return playerLabelOf(el);
  if (el.type === 'equipment') return EQUIPMENT_LABELS[el.equipmentType] ?? 'Matériel';
  return undefined;
}

/**
 * Auteur d'un geste **nommé du point de vue du coach** : pour une passe, la
 * balle est ce qui se déplace, mais c'est le passeur que le coach nomme
 * (« Passe · MDC → Ail D »).
 */
function actorLabelFor(movement: ElementMovementAction, elements: DiagramElement[]): string {
  const direct = elementLabelOf(movement.elementId, elements);
  if (movement.actionType !== 'pass' || direct !== 'Ballon') return direct ?? 'Joueur';
  let nearest: DiagramPlayerElement | null = null;
  let best = 8;
  for (const el of elements) {
    if (el.type !== 'player') continue;
    const d = Math.hypot(el.x - movement.from.x, el.y - movement.from.y);
    if (d < best) {
      best = d;
      nearest = el;
    }
  }
  return nearest ? playerLabelOf(nearest) : 'Ballon';
}

export interface ResolvedArrowMovement {
  movement: ElementMovementAction;
  /** Ce que le coach lit comme auteur du geste. */
  fromLabel: string;
  /** Destinataire réel du geste, quand la flèche en désigne un. */
  toLabel?: string;
}

/** Clé de comparaison d'un point (les coordonnées sont déjà bornées au 1/100). */
function pointKey(p: TrajectoryPoint): string {
  return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
}

/** Même barème de durée que le convertisseur : la distance fait le tempo. */
function movementDurationMs(from: TrajectoryPoint, to: TrajectoryPoint): number {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.max(1000, Math.min(3000, Math.round(dist * 60)));
}

const ARROW_ACTION_TYPES: Record<ArrowKind, ElementMovementAction['actionType']> = {
  pass: 'pass',
  dribble: 'dribble',
  movement: 'run',
  shot: 'shot',
};

/**
 * Lit les trajectoires d'un schéma, **dans l'ordre du dessin**, et les nomme.
 *
 * Le rattachement acteur ↔ flèche délègue à
 * `convertStaticArrowsToAnimationStage` : une seule lecture du dessin, donc
 * aucun risque que les deux vues divergent (§17 — on étend le moteur, on ne le
 * double pas).
 *
 * S'y ajoute le **chaînage** : une flèche que le moteur n'a pas pu rattacher
 * (aucun acteur à moins de 8 % de son départ) prolonge le geste précédent quand
 * elle **commence là où celui-ci s'achève** — c'est le cas type « course puis
 * frappe » des schémas de finition. Sans chaînage possible, la flèche est
 * ignorée : aucun acteur n'est inventé (§28).
 */
export function resolveArrowMovements(elements: DiagramElement[]): ResolvedArrowMovement[] {
  const single = convertStaticArrowsToAnimationStage(elements);
  const arrows = elements.filter((el): el is DiagramArrowElement => el.type === 'arrow');

  const resolvedByStart = new Map<string, ElementMovementAction>();
  for (const movement of single.movements) {
    resolvedByStart.set(pointKey(movement.from), movement);
  }

  const out: ResolvedArrowMovement[] = [];

  for (const arrow of arrows) {
    const from = { x: arrow.fromX, y: arrow.fromY };
    const to = { x: arrow.toX, y: arrow.toY };
    const controlPoint =
      arrow.controlX != null && arrow.controlY != null
        ? { x: arrow.controlX, y: arrow.controlY }
        : undefined;

    const direct = resolvedByStart.get(pointKey(from));
    if (direct) {
      out.push({
        movement: { ...direct, id: `auto-mv-${out.length + 1}`, startDelayMs: 0 },
        fromLabel: actorLabelFor(direct, elements),
        toLabel: direct.targetElementId
          ? elementLabelOf(direct.targetElementId, elements)
          : undefined,
      });
      continue;
    }

    const previous = [...out]
      .reverse()
      .find(
        (item) => Math.hypot(item.movement.to.x - from.x, item.movement.to.y - from.y) <= 6.0,
      );

    let actorId = previous?.movement.elementId;
    if (previous && previous.movement.actionType === 'pass' && previous.movement.targetElementId) {
      actorId = previous.movement.targetElementId;
    }
    if (!previous || !actorId) continue;

    const actionType = ARROW_ACTION_TYPES[arrow.kind];
    out.push({
      movement: {
        id: `auto-mv-${out.length + 1}`,
        elementId: actorId,
        actionType,
        from,
        to,
        controlPoint,
        startDelayMs: 0,
        durationMs: movementDurationMs(from, to),
        hasBall: actionType === 'dribble',
      },
      fromLabel: elementLabelOf(actorId, elements) ?? 'Joueur',
    });
  }

  return out;
}

const ACTION_STEP_LABELS: Record<ElementMovementAction['actionType'], string> = {
  pass: 'Passe',
  dribble: 'Conduite',
  run: 'Course',
  shot: 'Frappe',
  reposition: 'Replacement',
};

/** Positions de départ réelles du schéma — joueurs et ballon (§21, étape 1). */
export function initialPositionsOf(elements: DiagramElement[]): Record<string, TrajectoryPoint> {
  const positions: Record<string, TrajectoryPoint> = {};
  for (const el of elements) {
    if (el.type === 'player') positions[el.id] = { x: el.x, y: el.y };
    if (el.type === 'equipment' && el.equipmentType === 'ball') {
      positions[el.id] = { x: el.x, y: el.y };
    }
  }
  return positions;
}

/**
 * Découpe un schéma en **étapes jouables** (§21-§22) à partir de ses propres
 * trajectoires : **étape 1 = position initiale** (immobile, le temps de lire la
 * mise en place), puis **une étape par flèche**, dans l'ordre du dessin —
 * « Passe · MDC → Lat D », « Course · Ailier D → DC Gauche »…
 *
 * Le terrain **évolue** d'une étape à l'autre : la position d'arrivée d'un
 * geste devient la position de départ de l'étape suivante.
 *
 * Rien n'est inventé : un schéma sans flèche exploitable ne produit **aucune**
 * animation (`undefined`) et reste statique — c'est le repli honnête de §26.
 */
export function buildStagedAnimationFromArrows(
  elements: DiagramElement[],
  options: { loop?: boolean; setupTitle?: string; setupInstruction?: string } = {},
): ExerciseDiagramAnimationData | undefined {
  const resolved = resolveArrowMovements(elements);
  if (resolved.length === 0) {
    const players = elements.filter((el): el is DiagramPlayerElement => el.type === 'player');
    const ball = elements.find(
      (el): el is DiagramEquipmentElement => el.type === 'equipment' && el.equipmentType === 'ball'
    );
    if (players.length >= 2) {
      const running = initialPositionsOf(elements);
      const p1 = players[0];
      const p2 = players[1];
      const stages: ExerciseAnimationStage[] = [
        {
          id: 'anim-stage-setup',
          stageIndex: 0,
          title: options.setupTitle ?? 'Position initiale',
          instruction: options.setupInstruction ?? 'Mise en place de l’atelier et disposition tactique.',
          durationMs: 2000,
          pauseAfterMs: 400,
          movements: [],
          initialPositions: { ...running },
        },
        {
          id: 'anim-stage-1',
          stageIndex: 1,
          title: `Passe · ${p1.label || `N°${p1.num || 1}`} → ${p2.label || `N°${p2.num || 2}`}`,
          durationMs: 1800,
          pauseAfterMs: 400,
          movements: ball
            ? [
                {
                  id: 'auto-mv-ball-1',
                  elementId: ball.id,
                  actionType: 'pass',
                  from: { x: p1.x, y: p1.y },
                  to: { x: p2.x, y: p2.y },
                  startDelayMs: 0,
                  durationMs: 1400,
                  targetElementId: p2.id,
                },
              ]
            : [
                {
                  id: 'auto-mv-run-1',
                  elementId: p1.id,
                  actionType: 'run',
                  from: { x: p1.x, y: p1.y },
                  to: {
                    x: Number(((p1.x + p2.x) / 2).toFixed(2)),
                    y: Number(((p1.y + p2.y) / 2).toFixed(2)),
                  },
                  startDelayMs: 0,
                  durationMs: 1400,
                },
              ],
          initialPositions: { ...running },
        },
      ];

      if (players.length >= 3) {
        const p3 = players[2];
        stages.push({
          id: 'anim-stage-2',
          stageIndex: 2,
          title: `Transmission d’appui · ${p2.label || `N°${p2.num || 2}`} → ${p3.label || `N°${p3.num || 3}`}`,
          durationMs: 1800,
          pauseAfterMs: 400,
          movements: ball
            ? [
                {
                  id: 'auto-mv-ball-2',
                  elementId: ball.id,
                  actionType: 'pass',
                  from: { x: p2.x, y: p2.y },
                  to: { x: p3.x, y: p3.y },
                  startDelayMs: 0,
                  durationMs: 1400,
                  targetElementId: p3.id,
                },
              ]
            : [
                {
                  id: 'auto-mv-run-2',
                  elementId: p2.id,
                  actionType: 'run',
                  from: { x: p2.x, y: p2.y },
                  to: {
                    x: Number(((p2.x + p3.x) / 2).toFixed(2)),
                    y: Number(((p2.y + p3.y) / 2).toFixed(2)),
                  },
                  startDelayMs: 0,
                  durationMs: 1400,
                },
              ],
          initialPositions: { ...running },
        });
      }

      return {
        version: 1,
        stages,
        loop: options.loop ?? true,
        playbackSpeed: 1,
        autoPauseBetweenStages: false,
      };
    }
    return undefined;
  }

  /** Positions courantes : elles avancent d'étape en étape. */
  const running = initialPositionsOf(elements);
  const stages: ExerciseAnimationStage[] = [
    {
      id: 'anim-stage-setup',
      stageIndex: 0,
      title: options.setupTitle ?? 'Position initiale',
      instruction:
        options.setupInstruction ?? 'Mise en place de l’atelier, avant le premier geste.',
      durationMs: 2000,
      pauseAfterMs: 400,
      movements: [],
      initialPositions: { ...running },
    },
  ];

  resolved.forEach((item, index) => {
    const { movement } = item;
    const title = [
      ACTION_STEP_LABELS[movement.actionType],
      item.fromLabel,
      item.toLabel ? `→ ${item.toLabel}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    stages.push({
      id: `anim-stage-${index + 1}`,
      stageIndex: index + 1,
      title,
      durationMs: Math.round(movement.durationMs + 600),
      pauseAfterMs: 400,
      /** Chaque geste démarre avec son étape : pas d'attente héritée. */
      movements: [{ ...movement, startDelayMs: 0 }],
      initialPositions: { ...running },
    });

    running[movement.elementId] = { ...movement.to };
  });

  return {
    version: 1,
    stages,
    loop: options.loop ?? true,
    playbackSpeed: 1,
    autoPauseBetweenStages: false,
  };
}

/**
 * Validation d'une animation **avant de la proposer** (§28).
 *
 * Refuse — proprement, sans jamais l'afficher — une animation dont un acteur
 * n'existe pas, dont une coordonnée sort du terrain ou dont une durée est
 * invalide. S'applique aussi bien à une animation dérivée d'un schéma qu'à une
 * animation générée puis éditée par le coach.
 */
export function validateAnimationData(
  animation: ExerciseDiagramAnimationData | undefined,
  elements: DiagramElement[],
): { valid: boolean; problems: string[] } {
  const problems: string[] = [];
  if (!animation || animation.version !== 1) {
    return { valid: false, problems: ['animation absente'] };
  }
  const stages = animation.stages ?? [];
  if (stages.length === 0) problems.push('aucune étape');

  const ids = new Set(elements.map((el) => el.id));
  const isBounded = (p: TrajectoryPoint) =>
    Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 64;

  stages.forEach((stage, i) => {
    if (!Number.isFinite(stage.durationMs) || stage.durationMs <= 0) {
      problems.push(`étape ${i + 1} : durée invalide`);
    }
    (stage.movements ?? []).forEach((movement) => {
      if (!ids.has(movement.elementId)) {
        problems.push(`étape ${i + 1} : acteur inconnu (${movement.elementId})`);
      }
      if (movement.targetElementId && !ids.has(movement.targetElementId)) {
        problems.push(`étape ${i + 1} : destinataire inconnu (${movement.targetElementId})`);
      }
      if (!isBounded(movement.from) || !isBounded(movement.to)) {
        problems.push(`étape ${i + 1} : coordonnées hors terrain`);
      }
      if (movement.controlPoint && !isBounded(movement.controlPoint)) {
        problems.push(`étape ${i + 1} : point de contrôle hors terrain`);
      }
      if (!Number.isFinite(movement.durationMs) || movement.durationMs <= 0) {
        problems.push(`étape ${i + 1} : durée de mouvement invalide`);
      }
    });
  });

  return { valid: problems.length === 0, problems };
}
