/**
 * Modèle de domaine pur et fortement typé pour l'Espace d'Entraînement Coach (Tactical Studio).
 * Coordonnées normalisées [0, 100] indépendantes du ratio d'écran et du mode de rendu (2D/3D).
 */

export type PitchConfiguration =
  | 'full'            // Terrain complet officiel
  | 'half'            // Demi-terrain offensif/défensif
  | 'attacking_third' // Dernier tiers avec surface et ailes
  | 'box'             // Surface de réparation / zone de rondo cadrée
  | 'small_sided'     // Terrain réduit (foot à 8 / foot réduit)
  | 'futsal';         // Terrain de futsal / salle

export type ViewMode = '2d' | '3d';

export type Camera3DPreset = 'top' | 'front' | 'side' | 'isometric';

export interface NormalizedPoint {
  x: number; // 0 à 100
  y: number; // 0 à 100
  z?: number; // Hauteur relative (ex: ballon aérien en 3D)
}

export type TeamSide = 'teamA' | 'teamB' | 'neutral' | 'gk' | 'coach' | 'referee';

export interface PlayerToken {
  id: string;
  team: TeamSide;
  num?: number;
  label?: string;
  x: number;
  y: number;
  rotation?: number; // 0-360 degrés
  color?: string;
  role?: string;
  hasBall?: boolean;
}

export type EquipmentType =
  | 'cone'        // Cône 3D haut
  | 'disc_cone'   // Coupelle plate
  | 'pole'        // Piquet d'agilité
  | 'hurdle'      // Haie de coordination
  | 'ladder'      // Échelle de rythme
  | 'mannequin'   // Mannequin de coup franc
  | 'goal'        // Grand but officiel
  | 'mini_goal'   // Mini-but
  | 'bownet'      // But pop-up
  | 'ball';       // Ballon de match

export interface EquipmentToken {
  id: string;
  type: EquipmentType;
  x: number;
  y: number;
  rotation?: number;
  width?: number;
  height?: number;
  color?: string;
}

export type DrawingType = 'run' | 'pass' | 'dribble';

export interface DrawingObject {
  id: string;
  type: DrawingType;
  from: NormalizedPoint;
  to: NormalizedPoint;
  controlPoint?: NormalizedPoint;
  color?: string;
  label?: string;
}

export interface TacticalZone {
  id: string;
  points: NormalizedPoint[];
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeStyle?: 'solid' | 'dashed';
  label?: string;
}

export interface DrillFrame {
  id: string;
  order: number;
  durationMs: number;
  title?: string;
  players: PlayerToken[];
  equipment: EquipmentToken[];
  drawings: DrawingObject[];
  zones: TacticalZone[];
  notes?: string;
}

export type DrillCategory =
  | 'warm_up'
  | 'coordination'
  | 'rondo'
  | 'possession'
  | 'build_up'
  | 'pressing'
  | 'finishing'
  | 'transition'
  | 'set_pieces'
  | 'small_sided'
  | 'futsal';

export interface CoachingPoint {
  id: string;
  text: string;
  category?: 'technical' | 'tactical' | 'physical' | 'mental';
}

export interface Drill {
  id: string;
  name: string;
  category: DrillCategory;
  objective: string;
  pitchConfig: PitchConfiguration;
  frames: DrillFrame[];
  durationMin: number;
  playerCount: number;
  intensity?: 'low' | 'medium' | 'high';
  ageGroup?: string;
  instructions?: string;
  coachingPoints?: string[];
  equipmentSummary?: string;
  source?: 'proday_library' | 'coach_custom' | 'ai_generated';
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  teamId?: string;
  clubId?: string;
  date: string;
  totalDurationMin: number;
  focus: string;
  drills: Drill[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PersistenceSaveStatus = 'saving' | 'saved_local' | 'synced' | 'error';

export interface WorkspaceEditorState {
  drill: Drill;
  activeFrameIndex: number;
  selectedObjectId: string | null;
  selectedObjectType: 'player' | 'equipment' | 'drawing' | 'zone' | null;
  viewMode: ViewMode;
  camera3DPreset: Camera3DPreset;
  zoom: number; // 1.0 = fit
  panOffset: { x: number; y: number };
  showGhosts: boolean;
  isPlaying: boolean;
  playbackSpeed: 0.5 | 1.0 | 2.0;
  currentTimeMs: number;
  saveStatus: PersistenceSaveStatus;
  undoPast: Drill[];
  undoFuture: Drill[];
}

export const TEAM_PRESET_COLORS: Record<TeamSide, { fill: string; stroke: string; label: string }> = {
  teamA: { fill: '#2563EB', stroke: '#1E40AF', label: 'Bleus' },
  teamB: { fill: '#DC2626', stroke: '#991B1B', label: 'Rouges' },
  neutral: { fill: '#F59E0B', stroke: '#D97706', label: 'Joker' },
  gk: { fill: '#10B981', stroke: '#047857', label: 'Gardien' },
  coach: { fill: '#0F172A', stroke: '#000000', label: 'Coach' },
  referee: { fill: '#000000', stroke: '#FFFFFF', label: 'Arbitre' },
};

export const EQUIPMENT_PRESET_COLORS: Record<EquipmentType, string> = {
  cone: '#F97316',      // Orange vif
  disc_cone: '#FACC15', // Jaune vif
  pole: '#E11D48',      // Piquet rouge
  hurdle: '#F59E0B',    // Haie ambre
  ladder: '#EAB308',    // Échelle jaune
  mannequin: '#94A3B8', // Mannequin gris métal
  goal: '#FFFFFF',      // Grand but blanc
  mini_goal: '#FFFFFF', // Mini-but blanc
  bownet: '#F43F5E',    // But pop-up
  ball: '#FFFFFF',      // Ballon de match
};

export function clampPoint(pt: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(100, Math.round(pt.x * 10) / 10)),
    y: Math.max(0, Math.min(100, Math.round(pt.y * 10) / 10)),
  };
}

let tokenCounter = 1;
export function generateTokenId(prefix: string): string {
  tokenCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${tokenCounter}`;
}

export const PITCH_CONFIGURATIONS: Array<{
  id: PitchConfiguration;
  name: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  goals: Array<{ x: number; y: number; width: number; height: number }>;
}> = [
  {
    id: 'full',
    name: 'Grand terrain (11v11)',
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    goals: [
      { x: 0, y: 44, width: 2, height: 12 },
      { x: 98, y: 44, width: 2, height: 12 },
    ],
  },
  {
    id: 'half',
    name: 'Demi-terrain',
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    goals: [{ x: 98, y: 44, width: 2, height: 12 }],
  },
  {
    id: 'attacking_third',
    name: 'Dernier tiers',
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    goals: [{ x: 98, y: 44, width: 2, height: 12 }],
  },
  {
    id: 'box',
    name: 'Surface / Rondo cadré',
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    goals: [{ x: 98, y: 44, width: 2, height: 12 }],
  },
  {
    id: 'small_sided',
    name: 'Foot réduit (8v8 / 5v5)',
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    goals: [
      { x: 0, y: 44, width: 2, height: 12 },
      { x: 98, y: 44, width: 2, height: 12 },
    ],
  },
  {
    id: 'futsal',
    name: 'Futsal',
    bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    goals: [
      { x: 0, y: 44, width: 2, height: 12 },
      { x: 98, y: 44, width: 2, height: 12 },
    ],
  },
];

export const EQUIPMENT_PRESETS: Array<{ type: EquipmentType; label: string; icon: string }> = [
  { type: 'cone', label: 'Plot', icon: 'triangle-outline' },
  { type: 'disc_cone', label: 'Coupelle', icon: 'disc-outline' },
  { type: 'pole', label: 'Piquet', icon: 'remove-outline' },
  { type: 'hurdle', label: 'Haie', icon: 'git-commit-outline' },
  { type: 'ladder', label: 'Échelle', icon: 'menu-outline' },
  { type: 'mannequin', label: 'Mannequin', icon: 'body-outline' },
  { type: 'goal', label: 'Grand but', icon: 'square-outline' },
  { type: 'mini_goal', label: 'Mini-but', icon: 'tablet-landscape-outline' },
  { type: 'bownet', label: 'Pop-up', icon: 'radio-button-off-outline' },
  { type: 'ball', label: 'Ballon', icon: 'football-outline' },
];

export const PLAYER_PRESETS: Array<{ side: TeamSide; label: string }> = [
  { side: 'teamA', label: 'Bleus' },
  { side: 'teamB', label: 'Rouges' },
  { side: 'neutral', label: 'Joker' },
  { side: 'gk', label: 'Gardien' },
  { side: 'coach', label: 'Coach' },
  { side: 'referee', label: 'Arbitre' },
];

/**
 * Crée un atelier tactique vierge (terrain vide, aucun joueur ni équipement).
 * Permet au coach de concevoir son schéma pas à pas.
 */
export function createEmptyDrill(pitchConfig: PitchConfiguration = 'full'): Drill {
  const now = new Date().toISOString();
  return {
    id: `drill-${Date.now()}`,
    name: 'Nouvel atelier',
    category: 'rondo',
    objective: '',
    pitchConfig,
    frames: [
      {
        id: `frame-${Date.now()}-1`,
        order: 0,
        durationMs: 2000,
        title: 'Phase 1',
        players: [],
        equipment: [],
        drawings: [],
        zones: [],
      },
    ],
    durationMin: 15,
    playerCount: 0,
    source: 'coach_custom',
    createdAt: now,
    updatedAt: now,
  };
}
