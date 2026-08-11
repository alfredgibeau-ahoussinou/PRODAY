import type { GeoPoint } from './User';
import type { AppSpaceId } from './AppSpace';
import type { ClubApplicationStage, ClubApplicationPriority } from './ClubApplicationPipeline';
import type { PlayerLevelId, RecruiterPlayerLevelFilter } from './PlayerLevel';

export interface RecruitmentPost {
  id: string;
  author_uid?: string;
  club_id: string;
  club_name: string;
  title: string;
  position: string;
  category: string;
  level: string;
  city: string;
  location?: GeoPoint;
  description: string;
  created_at: Date;
  status: 'OPEN' | 'CLOSED';
  /** Espace cible : féminin, masculin, jeunes, -13 */
  target_space?: AppSpaceId;
}

export interface Application {
  id: string;
  post_id: string;
  post_author_uid?: string;
  player_uid: string;
  player_name?: string;
  cover_letter: string;
  cv_pdf_url: string;
  created_at: Date;
  updated_at?: Date;
  /** @deprecated Préférer `pipeline_stage` (kanban club). */
  status: 'PENDING' | 'VIEWED' | 'IN_PROGRESS' | 'ACCEPTED' | 'REJECTED';
  /** Étape pipeline club simplifié (inbox → hired). */
  pipeline_stage?: ClubApplicationStage;
  priority?: ClubApplicationPriority;
  club_notes?: string;
  trial_date?: Date;
  rejection_reason?: string;
  /** Documents partagés club↔joueur (coffre candidature). */
  shared_documents?: ApplicationSharedDocument[];
}

export interface ApplicationSharedDocument {
  id: string;
  label: string;
  url: string;
  uploaded_by: string;
  created_at: Date;
  /** `medical` est interdit côté Mercato — pas de partage de documents médicaux via candidature. */
  kind?: 'cv' | 'license' | 'medical' | 'parental' | 'other';
}

export interface RecruitmentFilters {
  position?: string;
  category?: string;
  level?: string;
  /** Filtre badge Pôle Joueur (recruteurs). */
  player_level?: RecruiterPlayerLevelFilter;
  /** Niveau exact si besoin (hors filtre agrégé). */
  player_level_exact?: PlayerLevelId;
  max_distance_km?: number;
  city?: string;
}
