/**
 * Service d'import et d'upload de vidéos de match / entraînement ProDay.
 * Conçu pour les flux club et coach (fichiers locaux, caméras Veo / Pixellot / XbotGo ou capture smartphone).
 * Supporte le suivi de progression en temps réel, la validation stricte des formats,
 * la détection de doublons et l'annulation de transfert.
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { Platform } from 'react-native';
import { getFirebaseStorage, getDb, getFirebaseAuth } from '../../lib/firebase';
import { clubCamerasService } from '../clubCameras.service';
import type { MatchVideoSource, MatchVideoShareAudience, ClubMatchVideo } from '../../models/ClubCameras';
import type { VideoCameraVendor } from '../../content/videoOffers';

export const SUPPORTED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v'] as const;
export type SupportedVideoExtension = (typeof SUPPORTED_VIDEO_EXTENSIONS)[number];

export const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
  'video/m4v',
] as const;

/** Limite absolue de taille de fichier autorisée (4 Go) */
export const MAX_VIDEO_FILE_SIZE_BYTES = 4 * 1024 * 1024 * 1024;
/** Taille recommandée pour une fluidité optimale en club (2 Go) */
export const RECOMMENDED_VIDEO_MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

export interface VideoFileValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  normalizedMime: string;
  extension: SupportedVideoExtension;
}

export interface UploadProgressInfo {
  status: 'validating' | 'uploading' | 'processing' | 'ready' | 'failed';
  progressPercent: number;
  bytesTransferred: number;
  totalBytes: number;
  speedBytesPerSec?: number;
  estimatedRemainingSec?: number;
  message?: string;
}

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
  file: {
    uri: string;
    name?: string;
    mimeType?: string;
    size?: number;
    rawBlob?: Blob | File;
  };
  createdByUid: string;
  shareWith?: MatchVideoShareAudience[];
  playerUids?: string[];
}

export interface MatchVideoUploadResult {
  videoId: string;
  videoUrl: string;
  message: string;
  video: ClubMatchVideo;
}

export interface UploadCancelController {
  cancel: () => void;
  isCancelled: () => boolean;
}

/**
 * Valide les formats et la taille du fichier vidéo avant téléversement.
 */
export function validateVideoFile(file: {
  name?: string;
  mimeType?: string;
  size?: number;
}): VideoFileValidationResult {
  const fileName = (file.name || '').toLowerCase();
  const rawMime = (file.mimeType || '').toLowerCase().trim();

  // Extraction d'extension
  let ext: SupportedVideoExtension | null = null;
  for (const candidate of SUPPORTED_VIDEO_EXTENSIONS) {
    if (fileName.endsWith(`.${candidate}`)) {
      ext = candidate;
      break;
    }
  }

  // Déduction MIME
  let normalizedMime = 'video/mp4';
  if (rawMime.includes('quicktime') || ext === 'mov') {
    normalizedMime = 'video/quicktime';
    if (!ext) ext = 'mov';
  } else if (rawMime.includes('webm') || ext === 'webm') {
    normalizedMime = 'video/webm';
    if (!ext) ext = 'webm';
  } else if (rawMime.includes('m4v') || ext === 'm4v') {
    normalizedMime = 'video/x-m4v';
    if (!ext) ext = 'm4v';
  } else if (rawMime.includes('mp4') || ext === 'mp4') {
    normalizedMime = 'video/mp4';
    if (!ext) ext = 'mp4';
  }

  if (!ext) {
    return {
      valid: false,
      error: `Format non supporté. Formats acceptés : MP4, MOV, WebM, M4V (reçu : ${file.name || 'inconnu'}).`,
      normalizedMime,
      extension: 'mp4',
    };
  }

  // Vérification de taille
  if (file.size && file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    const sizeInGb = (file.size / (1024 * 1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux (${sizeInGb} Go). La limite autorisée est de 4 Go.`,
      normalizedMime,
      extension: ext,
    };
  }

  let warning: string | undefined;
  if (file.size && file.size > RECOMMENDED_VIDEO_MAX_SIZE_BYTES) {
    const sizeInGb = (file.size / (1024 * 1024 * 1024)).toFixed(1);
    warning = `Fichier volumineux (${sizeInGb} Go). L'envoi peut durer plusieurs minutes selon votre débit de connexion. Gardez l'écran actif.`;
  }

  return {
    valid: true,
    warning,
    normalizedMime,
    extension: ext,
  };
}

/**
 * Formate des octets en Mo ou Go lisibles.
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 Mo';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

export const matchVideoUploadService = {
  /**
   * Vérifie si une vidéo avec un titre similaire ou rattachée au même match existe déjà.
   */
  async checkPotentialDuplicate(
    clubId: string,
    title: string,
    eventId?: string,
  ): Promise<{ isDuplicate: boolean; existingVideoTitle?: string }> {
    const database = getDb();
    if (!database || !clubId) return { isDuplicate: false };

    try {
      if (eventId) {
        const qEvent = query(
          collection(database, 'club_match_videos'),
          where('club_id', '==', clubId),
          where('event_id', '==', eventId),
          limit(1),
        );
        const snap = await getDocs(qEvent);
        if (!snap.empty) {
          const doc = snap.docs[0].data();
          return { isDuplicate: true, existingVideoTitle: doc.title as string };
        }
      }

      const cleanTitle = title.trim().toLowerCase();
      const qTitle = query(
        collection(database, 'club_match_videos'),
        where('club_id', '==', clubId),
        limit(20),
      );
      const snapTitle = await getDocs(qTitle);
      for (const d of snapTitle.docs) {
        const dTitle = ((d.data().title as string) || '').trim().toLowerCase();
        if (dTitle === cleanTitle) {
          return { isDuplicate: true, existingVideoTitle: d.data().title as string };
        }
      }
    } catch {
      // Ignorer l'erreur de détection de doublon pour ne jamais bloquer l'upload
    }

    return { isDuplicate: false };
  },

  /**
   * Téléverse un fichier vidéo avec suivi de progression en temps réel,
   * gestion d'annulation et enregistrement complet du match.
   */
  async uploadMatchVideoWithProgress(
    input: MatchVideoUploadInput,
    onProgress?: (info: UploadProgressInfo) => void,
    onControllerReady?: (controller: UploadCancelController) => void,
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

    // 1. Validation du fichier
    onProgress?.({
      status: 'validating',
      progressPercent: 0,
      bytesTransferred: 0,
      totalBytes: file.size || 0,
      message: 'Validation du format et de la taille du fichier vidéo…',
    });

    const validation = validateVideoFile({
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
    });

    if (!validation.valid) {
      throw new Error(validation.error || 'Fichier vidéo invalide.');
    }

    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage n’est pas configuré. Vérifiez votre configuration de connexion.');
    }

    let cancelled = false;
    let cancelFn = () => {
      cancelled = true;
    };

    onControllerReady?.({
      cancel: () => cancelFn(),
      isCancelled: () => cancelled,
    });

    // 2. Préparation du flux de données
    const fileName = `${clubId}_${Date.now()}.${validation.extension}`;
    const storagePath = `match_videos/${clubId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    let blobToUpload: Blob;
    if (file.rawBlob) {
      blobToUpload = file.rawBlob;
    } else {
      const resp = await fetch(file.uri);
      if (!resp.ok) {
        throw new Error('Impossible d’accéder au fichier vidéo sur cet appareil.');
      }
      blobToUpload = await resp.blob();
    }

    const totalBytes = blobToUpload.size || file.size || 1;
    let startTime = Date.now();

    onProgress?.({
      status: 'uploading',
      progressPercent: 0,
      bytesTransferred: 0,
      totalBytes,
      message: 'Démarrage de l’envoi de la vidéo…',
    });

    // 3. Téléversement avec uploadBytesResumable
    const uploadTask = uploadBytesResumable(storageRef, blobToUpload, {
      contentType: validation.normalizedMime,
      customMetadata: {
        clubId,
        uploadedBy: createdByUid,
        originalName: file.name || 'match_video',
      },
    });

    cancelFn = () => {
      cancelled = true;
      try {
        uploadTask.cancel();
      } catch {
        /* ignore */
      }
    };

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (cancelled) {
            uploadTask.cancel();
            reject(new Error('Téléversement annulé par l’utilisateur.'));
            return;
          }

          const transferred = snapshot.bytesTransferred;
          const total = snapshot.totalBytes || totalBytes;
          const percent = total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : 0;

          const elapsedSec = (Date.now() - startTime) / 1000;
          const speed = elapsedSec > 0 ? transferred / elapsedSec : 0;
          const remainingBytes = Math.max(0, total - transferred);
          const estimatedRemainingSec = speed > 0 ? Math.round(remainingBytes / speed) : undefined;

          onProgress?.({
            status: 'uploading',
            progressPercent: percent,
            bytesTransferred: transferred,
            totalBytes: total,
            speedBytesPerSec: Math.round(speed),
            estimatedRemainingSec,
            message: `Téléversement en cours (${percent}% · ${formatBytes(transferred)} / ${formatBytes(total)})…`,
          });
        },
        (error) => {
          if (cancelled) {
            reject(new Error('Téléversement annulé par l’utilisateur.'));
          } else {
            reject(new Error(`Erreur réseau lors de l’envoi : ${error.message}`));
          }
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (urlErr: any) {
            reject(new Error(`Fichier envoyé mais URL indisponible : ${urlErr?.message}`));
          }
        },
      );
    });

    // 4. Traitement & Finalisation (Ne JAMAIS marquer ready avant confirmation)
    onProgress?.({
      status: 'processing',
      progressPercent: 100,
      bytesTransferred: totalBytes,
      totalBytes,
      message: 'Traitement de la vidéo et association au calendrier du club…',
    });

    const fullTitle = opponent ? `${title} vs ${opponent}` : title;

    const res = await clubCamerasService.importMatchVideo({
      club_id: clubId,
      team_id: teamId,
      team_label: teamLabel,
      vendor,
      source,
      title: fullTitle,
      event_id: eventId,
      event_title: eventTitle,
      storage_url: downloadUrl,
      created_by_uid: createdByUid,
      share_with: shareWith,
      player_uids: playerUids,
    });

    // Récupération de l'objet complet pour l'écran
    const createdVideo: ClubMatchVideo = {
      id: res.id,
      club_id: clubId,
      vendor,
      source,
      status: 'ready',
      kind: 'imported',
      team_id: teamId,
      team_label: teamLabel,
      event_id: eventId,
      event_title: eventTitle,
      title: fullTitle,
      opponent,
      storage_url: downloadUrl,
      highlights_ready: false,
      clips: [],
      share_with: shareWith,
      player_uids: playerUids,
      created_by_uid: createdByUid,
      created_at: new Date(),
    };

    onProgress?.({
      status: 'ready',
      progressPercent: 100,
      bytesTransferred: totalBytes,
      totalBytes,
      message: 'Vidéo prête pour le visionnage immédiat !',
    });

    return {
      videoId: res.id,
      videoUrl: downloadUrl,
      message: 'Vidéo importée et prête au visionnage immédiat dans ProDay.',
      video: createdVideo,
    };
  },

  /**
   * Méthode de compatibilité simple sans progression
   */
  async uploadAndRegisterMatchVideo(
    input: MatchVideoUploadInput,
  ): Promise<MatchVideoUploadResult> {
    return this.uploadMatchVideoWithProgress(input);
  },
};
