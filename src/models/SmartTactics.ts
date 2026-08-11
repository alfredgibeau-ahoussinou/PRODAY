/**
 * ProDay Smart Tactics — flagship tactical ecosystem.
 * Interactive board, readiness, AI prep, training, video VO, live tagging.
 */

export const SMART_TACTICS_PRESET_FORMATIONS = [
  '4-3-3',
  '4-4-2',
  '3-5-2',
  '4-2-3-1',
  '5-3-2',
  '4-1-4-1',
  '3-4-3',
  '4-5-1',
  '5-4-1',
  '4-3-2-1',
  '3-4-2-1',
  '4-4-1-1',
  '2-3-5',
  '3-3-3-1',
] as const;

export type SmartFormationPreset = (typeof SMART_TACTICS_PRESET_FORMATIONS)[number];

/** Free-form pitch slot (0–1 normalized coordinates, attack direction = top). */
export interface TacticalBoardSlot {
  uid: string;
  display_name: string;
  role: 'starter' | 'sub';
  position_label?: string;
  /** Player role in the system (pressing forward, false 9…). */
  tactical_role?: string;
  x?: number;
  y?: number;
  is_captain?: boolean;
}

export interface TacticalBoardState {
  formation: string;
  slots: TacticalBoardSlot[];
  /** Custom formation string e.g. "3-1-4-2" — validated at write time. */
  is_custom_formation?: boolean;
}

export type TeamInstructionIntensity = 'low' | 'balanced' | 'high';

export interface TeamInstructions {
  build_up: 'short' | 'mixed' | 'long';
  chance_creation: 'possession' | 'direct' | 'counter';
  defensive_line: 'deep' | 'medium' | 'high';
  pressing: TeamInstructionIntensity;
  width: 'narrow' | 'standard' | 'wide';
  tempo: TeamInstructionIntensity;
  notes?: string;
}

export type SetPieceKind = 'corner' | 'free_kick' | 'penalty' | 'throw_in';

export interface SetPiecePlan {
  id: string;
  kind: SetPieceKind;
  side?: 'left' | 'right' | 'center';
  primary_uid?: string;
  decoy_uids?: string[];
  description: string;
}

export type MatchPhase = 'pre' | 'half' | 'post' | 'debrief';

export interface MatchTacticalReport {
  id: string;
  event_id: string;
  club_id?: string;
  phase: MatchPhase;
  title: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  adjustments: string[];
  key_players: string[];
  risks: string[];
  created_at: Date;
  created_by: string;
  /** True when generated with sparse data / heuristics. */
  ai_fallback?: boolean;
}

export interface TacticalPlan {
  id: string;
  club_id: string;
  title: string;
  opponent_name?: string;
  event_id?: string;
  board: TacticalBoardState;
  instructions: TeamInstructions;
  set_pieces: SetPiecePlan[];
  strategy_notes?: string;
  opponent_analysis?: OpponentAnalysis;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  archived?: boolean;
}

export interface OpponentAnalysis {
  strengths: string[];
  weaknesses: string[];
  formation_guess?: string;
  key_players: string[];
  risk_flags: string[];
  suggested_approach: string;
  data_confidence: 'low' | 'medium' | 'high';
}

export interface AiMatchPreparation {
  opponent: OpponentAnalysis;
  formation_recommendation: string;
  starting_xi_uids: string[];
  tactical_suggestions: string[];
  physical_alerts: string[];
  risk_analysis: string[];
  fallback: boolean;
  /** Origine de la préparation — mistral cloud ou moteur local. */
  source?: 'local' | 'mistral';
  /** Briefing coach (IA cloud). */
  briefing_fr?: string;
}

/** Wellness / load inputs for match readiness. */
export interface WellnessSignals {
  sleep_hours?: number;
  fatigue?: number; // 1–10 (10 = exhausted)
  stress?: number; // 1–10
  recovery?: number; // 1–10 (10 = fully recovered)
  wellness_score?: number; // 1–10 from questionnaire
  pain?: number; // 0–10
  training_attendance_rate?: number; // 0–1
  minutes_last_7d?: number;
  recovery_hours_since_last?: number;
  injury_recency_days?: number | null; // null = no recent injury
  suspended?: boolean;
  injured?: boolean;
}

export interface MatchReadinessResult {
  potential: number; // 0–99 overall ceiling
  readiness_pct: number; // 0–100 current match readiness
  form: number; // 0–100
  confidence: number; // 0–100
  availability: 'available' | 'doubtful' | 'out' | 'suspended';
  factors: { id: string; label: string; impact: number }[];
}

export type TrainingBlockKind =
  | 'warmup'
  | 'technical'
  | 'tactical'
  | 'possession'
  | 'finishing'
  | 'small_sided'
  | 'physical'
  | 'recovery';

export interface TrainingBlock {
  kind: TrainingBlockKind;
  title: string;
  duration_min: number;
  focus: string;
  intensity: TeamInstructionIntensity;
}

export interface CollectiveTrainingSession {
  id: string;
  title: string;
  total_duration_min: number;
  blocks: TrainingBlock[];
  based_on: string[];
  objectives: string[];
  created_at: Date;
}

export type IndividualSkillFocus =
  | 'weak_foot'
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'ball_control'
  | 'speed'
  | 'acceleration'
  | 'strength'
  | 'agility'
  | 'heading'
  | 'crossing'
  | 'defensive_positioning'
  | 'decision_making'
  | 'vision'
  | 'explosiveness';

export interface IndividualTrainingPlan {
  id: string;
  player_uid: string;
  focus: IndividualSkillFocus[];
  weekly_sessions: { day: string; title: string; drills: string[]; duration_min: number }[];
  evolves_from?: string;
  premium: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlayerDevelopmentProfile {
  player_uid: string;
  strengths: string[];
  weaknesses: string[];
  ai_recommendations: string[];
  weekly_objectives: string[];
  monthly_objectives: string[];
  career_goals: string[];
  xp: number;
  level: number;
  badges: string[];
  challenges: { id: string; title: string; progress: number; target: number }[];
}

export type VideoAnalysisStatus =
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'archived';

/** Smartphone / tripod VO — cloud-ready, CV-compatible architecture. */
export interface VideoAnalysisJob {
  id: string;
  club_id?: string;
  event_id?: string;
  uploader_uid: string;
  source: 'smartphone' | 'tripod' | 'import';
  local_uri?: string;
  storage_path?: string;
  status: VideoAnalysisStatus;
  duration_sec?: number;
  highlight_clip_ids?: string[];
  /** Reserved for future computer-vision payloads. */
  cv_ready: boolean;
  processing_note?: string;
  created_at: Date;
  updated_at: Date;
  error_message?: string;
}

export type LiveTagKind =
  | 'goal'
  | 'shot'
  | 'save'
  | 'card'
  | 'substitution'
  | 'injury';

export interface LiveMatchTag {
  id: string;
  event_id: string;
  kind: LiveTagKind;
  minute: number;
  player_uid?: string;
  player_name?: string;
  note?: string;
  /** Auto-generated clip stub linked to VO pipeline. */
  clip_id?: string;
  created_at: Date;
  created_by: string;
}

export interface MatchAnalyticsSnapshot {
  event_id: string;
  goals: number;
  assists: number;
  minutes: number;
  distance_km?: number;
  passes?: number;
  duels?: number;
  recoveries?: number;
  interceptions?: number;
  shots?: number;
  expected_progress?: number;
  player_ratings: Record<string, number>;
  /** Placeholder for heatmap buckets until CV lands. */
  heatmap_ready: boolean;
}

export interface SmartPlayerCardData {
  uid: string;
  display_name: string;
  photo_url?: string;
  position?: string;
  preferred_foot?: 'left' | 'right' | 'both';
  overall: number;
  readiness_pct: number;
  form: number;
  availability: MatchReadinessResult['availability'];
  confidence: number;
  progress: number;
  contract_status?: string;
  age?: number;
  badges: string[];
  certifications: string[];
  is_captain?: boolean;
  injured?: boolean;
  suspended?: boolean;
}

export interface TeamTacticsDashboard {
  suggested_xi: SmartPlayerCardData[];
  formation: string;
  in_form: SmartPlayerCardData[];
  fatigued: SmartPlayerCardData[];
  injured: SmartPlayerCardData[];
  suspended: SmartPlayerCardData[];
  at_risk: SmartPlayerCardData[];
  upcoming_match_titles: string[];
  attendance_rate: number;
  morale: number;
  weekly_workload: number;
  ai_alerts: string[];
  tactical_recommendations: string[];
}

export const DEFAULT_TEAM_INSTRUCTIONS: TeamInstructions = {
  build_up: 'mixed',
  chance_creation: 'possession',
  defensive_line: 'medium',
  pressing: 'balanced',
  width: 'standard',
  tempo: 'balanced',
};

export const LIVE_TAG_LABELS: Record<LiveTagKind, string> = {
  goal: 'GOAL',
  shot: 'SHOT',
  save: 'SAVE',
  card: 'CARD',
  substitution: 'SUB',
  injury: 'INJURY',
};

export const TRAINING_BLOCK_LABELS: Record<TrainingBlockKind, string> = {
  warmup: 'Échauffement',
  technical: 'Technique',
  tactical: 'Tactique',
  possession: 'Possession',
  finishing: 'Finition',
  small_sided: 'Jeux réduits',
  physical: 'Physique',
  recovery: 'Récupération',
};

export const INDIVIDUAL_SKILL_LABELS: Record<IndividualSkillFocus, string> = {
  weak_foot: 'Pied faible',
  shooting: 'Frappe',
  passing: 'Passes',
  dribbling: 'Dribble',
  ball_control: 'Contrôle',
  speed: 'Vitesse',
  acceleration: 'Accélération',
  strength: 'Force',
  agility: 'Agilité',
  heading: 'Jeu de tête',
  crossing: 'Centres',
  defensive_positioning: 'Placement défensif',
  decision_making: 'Prise de décision',
  vision: 'Vision',
  explosiveness: 'Explosivité',
};
