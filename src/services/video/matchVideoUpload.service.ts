/**
 * Service d'import et d'upload de vidéos de match / entraînement ProDay.
 * Conçu pour les flux club et coach (fichiers locaux, caméras Veo / Pixellot / XbotGo ou capture smartphone).
 */

import { storageService, type UploadFileInput } from '../storage.service';
import { clubCamerasService } from '../clubCameras.service';
import type { MatchVideoSource, MatchVideoShareAudience } from '../../models/ClubCameras';
import type { VideoCameraVendor } from '../../content/videoOffers';

export interface MatchVideoUploadInput {
  clubId: string;
  teamId?: string;
  teamLabel?: string;
  vendor?: VideoCameraVendor;
  source?: MatchVideoSource;
  title: string;
  opponent?: string;
  eventId?: string;
  eventTitle?: string;
  file: UploadFileInput;
  createdByUid: string;
  shareWith?: MatchVideoShareAudience[];
  playerUids?: string[];
}

export interface MatchVideoUploadResult {
  videoId: string;
  videoUrl: string;
  message: string;
}

export const matchVideoUploadService = {
  /**
   * Upload le fichier vidéo vers Firebase Storage puis crée le document club_match_videos.
   */
  async uploadAndRegisterMatchVideo(
    input: MatchVideoUploadInput,
  ): Promise<MatchVideoUploadResult> {
    const {
      clubId,
      teamId,
      teamLabel,
      vendor = 'generic',
      source = 'upload',
      title,
      opponent,
      eventId,
      eventTitle,
      file,
      createdByUid,
      shareWith = ['coaches', 'players'],
      playerUids = [],
    } = input;

    // 1. Upload vers Firebase Storage
    const downloadUrl = await storageService.uploadCommunityReel(createdByUid, file);

    // 2. Enregistrement dans clubCamerasService
    const res = await clubCamerasService.importMatchVideo({
      club_id: clubId,
      team_id: teamId,
      team_label: teamLabel,
      vendor,
      source,
      title: opponent ? `${title} vs ${opponent}` : title,
      event_id: eventId,
      event_title: eventTitle,
      storage_url: downloadUrl,
      created_by_uid: createdByUid,
      share_with: shareWith,
      player_uids: playerUids,
    });

    return {
      videoId: res.id,
      videoUrl: downloadUrl,
      message: res.message,
    };
  },
};
