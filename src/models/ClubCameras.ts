/**
 * Caméras & Vidéo club — multi-marques, extensible.
 * Matériel jamais obligatoire : connecter API, import fichier, ou smartphone.
 */

import type { VideoCameraVendor } from '../content/videoOffers';
import { VIDEO_VENDORS } from '../content/videoOffers';

export type ClubCameraConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'pending'
  | 'error';

export type ClubCameraSyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

export type MatchVideoSource =
  | 'camera_api'
  | 'import'
  | 'device_capture'
  | 'upload';

export type MatchVideoStatus =
  | 'recording'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

export type MatchVideoShareAudience = 'players' | 'coaches' | 'parents' | 'staff';

export interface ClubCamera {
  id: string;
  club_id: string;
  vendor: VideoCameraVendor;
  brand_label: string;
  model: string;
  status: ClubCameraConnectionStatus;
  team_id?: string;
  team_label?: string;
  last_match_title?: string;
  last_match_at?: Date;
  storage_used_mb: number;
  storage_quota_mb?: number;
  sync_status: ClubCameraSyncStatus;
  external_device_id?: string;
  created_by_uid: string;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateClubCameraInput {
  club_id: string;
  vendor: VideoCameraVendor;
  model?: string;
  team_id?: string;
  team_label?: string;
  created_by_uid: string;
  external_device_id?: string;
}

export interface MatchVideoClip {
  id: string;
  label: string;
  starts_at_sec?: number;
  ends_at_sec?: number;
  player_uids?: string[];
  share_with?: MatchVideoShareAudience[];
  url?: string;
}

export interface ClubMatchVideo {
  id: string;
  club_id: string;
  camera_id?: string;
  vendor?: VideoCameraVendor;
  source: MatchVideoSource;
  status: MatchVideoStatus;
  team_id?: string;
  team_label?: string;
  event_id?: string;
  event_title?: string;
  title: string;
  storage_url?: string;
  duration_sec?: number;
  highlights_ready: boolean;
  clips: MatchVideoClip[];
  player_uids: string[];
  share_with: MatchVideoShareAudience[];
  created_by_uid: string;
  created_at: Date;
  updated_at?: Date;
}

export interface CreateMatchVideoInput {
  club_id: string;
  camera_id?: string;
  vendor?: VideoCameraVendor;
  source: MatchVideoSource;
  team_id?: string;
  team_label?: string;
  event_id?: string;
  event_title?: string;
  title: string;
  storage_url?: string;
  created_by_uid: string;
  player_uids?: string[];
  share_with?: MatchVideoShareAudience[];
}

export const CAMERA_STATUS_LABELS: Record<ClubCameraConnectionStatus, string> = {
  connected: 'Connectée',
  disconnected: 'Non connectée',
  pending: 'Connexion…',
  error: 'Erreur',
};

export const MATCH_VIDEO_STATUS_LABELS: Record<MatchVideoStatus, string> = {
  recording: 'Enregistrement',
  uploading: 'Import…',
  processing: 'Analyse…',
  ready: 'Prête',
  failed: 'Échec',
};

export function vendorLabel(vendor: VideoCameraVendor): string {
  return VIDEO_VENDORS.find((v) => v.id === vendor)?.label ?? vendor;
}

export function defaultModelForVendor(vendor: VideoCameraVendor): string {
  switch (vendor) {
    case 'veo':
      return 'Veo Cam';
    case 'xbotgo':
      return 'XbotGo Chameleon';
    case 'spiideo':
      return 'Spiideo Arena';
    case 'pixellot':
      return 'Pixellot S5';
    case 'trace':
      return 'Trace Cam';
    case 'smartphone':
      return 'Smartphone';
    case 'tablet':
      return 'Tablette';
    default:
      return 'Import / compatible';
  }
}
