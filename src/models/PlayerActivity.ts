import type { PerformanceTag } from '../utils/performanceTags';

/** Journal d'activité joueur — match, entraînement, récupération. */
export type PlayerActivityType = 'match' | 'training' | 'recovery';

export type PlayerActivitySource = 'manual' | 'team_event';

export type PlayerActivityAnalysisStatus = 'pending_analysis' | 'analyzed' | 'failed';

export interface PlayerActivity {
  id: string;
  player_uid: string;
  type: PlayerActivityType;
  date: Date;
  duration_min: number;
  goals?: number;
  assists?: number;
  rating_self?: number;
  notes?: string;
  /** Lien vers un highlight du profil — base analyse vidéo IA. */
  video_url?: string;
  /** Miniature image optionnelle (frame poster) pour analyse vision sur MP4. */
  thumbnail_url?: string;
  /** Statut pipeline analyse — pending jusqu'à traitement réel. */
  analysis_status?: PlayerActivityAnalysisStatus;
  analysis_summary_fr?: string;
  analysis_strengths?: string[];
  analysis_improvements?: string[];
  analysis_tactical_notes?: string[];
  analysis_confidence?: number;
  analyzed_at?: Date;
  /** Tags performance manuels — agrégation client (IA vidéo = phase 2). */
  performance_tags?: PerformanceTag[];
  source: PlayerActivitySource;
  team_event_id?: string;
  created_at: Date;
}

export interface CreatePlayerActivityInput {
  player_uid: string;
  type: PlayerActivityType;
  date: Date;
  duration_min: number;
  goals?: number;
  assists?: number;
  rating_self?: number;
  notes?: string;
  video_url?: string;
  /** Miniature frame MP4 — vision IA (Storage ou poster profil). */
  thumbnail_url?: string;
  performance_tags?: PerformanceTag[];
  source?: PlayerActivitySource;
  team_event_id?: string;
}
