/**
 * Modèle pour l'animation et l'interactivité des schémas d'exercice d'entraînement.
 *
 * Toutes les données sont stockées au format vectoriel paramétrique (pas de vidéo aplatie),
 * garantissant que les trajectoires, vitesses, décalages et étapes restent 100% éditables.
 */

export type MovementActionType = 'run' | 'pass' | 'dribble' | 'shot' | 'reposition';

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface ElementMovementAction {
  id: string;
  /** Identifiant du joueur ou de l'équipement (ex: 'p1', 'ball-1') */
  elementId: string;
  /** Type d'action tactique */
  actionType: MovementActionType;
  /** Coordonnées de départ normalisées (0-100 x, 0-64 y) */
  from: TrajectoryPoint;
  /** Coordonnées d'arrivée */
  to: TrajectoryPoint;
  /** Point de contrôle optionnel pour courbe quadratique de Bézier */
  controlPoint?: TrajectoryPoint;
  /** Décalage en ms avant le départ de l'action au sein de l'étape */
  startDelayMs: number;
  /** Durée effective du déplacement en ms */
  durationMs: number;
  /** Indique si le joueur a le ballon pendant ce déplacement (ex: conduite/dribble) */
  hasBall?: boolean;
  /** Identifiant optionnel d'un coéquipier récepteur (ex: passe) */
  targetElementId?: string;
  /** Label ou consigne courte affichée sur le tracé */
  label?: string;
}

export interface ExerciseAnimationStage {
  id: string;
  stageIndex: number;
  title: string;
  instruction?: string;
  /** Durée totale de l'étape en ms (au moins la durée max des mouvements) */
  durationMs: number;
  /** Pause pédagogique avant d'enchaîner sur l'étape suivante */
  pauseAfterMs?: number;
  /** Liste des mouvements programmés au cours de cette étape */
  movements: ElementMovementAction[];
  /** Positions figées de tous les éléments au début de cette étape */
  initialPositions?: Record<string, TrajectoryPoint>;
}

export interface ExerciseDiagramAnimationData {
  version: 1;
  stages: ExerciseAnimationStage[];
  loop: boolean;
  playbackSpeed: number; // 0.5, 0.75, 1.0, 1.25, 1.5, 2.0
  autoPauseBetweenStages: boolean;
}

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0] as const;

export const DEFAULT_STAGE_DURATION_MS = 3000;
export const DEFAULT_PAUSE_AFTER_MS = 600;

export function createEmptyAnimationData(): ExerciseDiagramAnimationData {
  return {
    version: 1,
    stages: [],
    loop: true,
    playbackSpeed: 1.0,
    autoPauseBetweenStages: false,
  };
}

export function createDefaultAnimationStage(
  index = 0,
  title?: string,
  instruction?: string,
): ExerciseAnimationStage {
  return {
    id: `anim-stage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    stageIndex: index,
    title: title || `Phase ${index + 1}`,
    instruction: instruction || 'Phase de jeu',
    durationMs: DEFAULT_STAGE_DURATION_MS,
    pauseAfterMs: DEFAULT_PAUSE_AFTER_MS,
    movements: [],
    initialPositions: {},
  };
}
