/**
 * Couche providers caméras — extensible sans refaire le système.
 * API native quand disponible ; sinon import / device capture.
 */

import type { VideoCameraVendor } from '../../content/videoOffers';
import { VIDEO_VENDORS } from '../../content/videoOffers';
import type { MatchVideoClip, MatchVideoSource } from '../../models/ClubCameras';
import { cameraConnectHonestMessage } from '../../utils/coachVideoHonesty';

export interface CameraProviderCapabilities {
  connectApi: boolean;
  startRecording: boolean;
  importFile: boolean;
  autoHighlights: boolean;
  playerTracking: boolean;
}

export interface CameraConnectResult {
  ok: boolean;
  external_device_id?: string;
  message: string;
}

export interface CameraRecordingResult {
  ok: boolean;
  external_recording_id?: string;
  message: string;
}

export interface CameraImportResult {
  ok: boolean;
  storage_hint?: string;
  message: string;
}

export interface CameraHighlightResult {
  clips: MatchVideoClip[];
  message: string;
}

export interface ClubCameraProvider {
  vendor: VideoCameraVendor;
  label: string;
  capabilities: CameraProviderCapabilities;
  connect(opts: { clubId: string; externalDeviceId?: string }): Promise<CameraConnectResult>;
  startRecording(opts: {
    clubId: string;
    externalDeviceId?: string;
    eventTitle: string;
  }): Promise<CameraRecordingResult>;
  importVideo(opts: {
    clubId: string;
    fileName?: string;
  }): Promise<CameraImportResult>;
  generateHighlights(opts: {
    matchVideoId: string;
    title: string;
  }): Promise<CameraHighlightResult>;
}

function baseCapabilities(
  integration: 'native' | 'connector' | 'device_capture',
): CameraProviderCapabilities {
  if (integration === 'native') {
    return {
      connectApi: true,
      startRecording: true,
      importFile: true,
      autoHighlights: true,
      playerTracking: true,
    };
  }
  if (integration === 'device_capture') {
    return {
      connectApi: false,
      startRecording: true,
      importFile: true,
      autoHighlights: true,
      playerTracking: false,
    };
  }
  return {
    connectApi: true,
    startRecording: false,
    importFile: true,
    autoHighlights: true,
    playerTracking: false,
  };
}

function makeProvider(vendor: VideoCameraVendor): ClubCameraProvider {
  const def = VIDEO_VENDORS.find((v) => v.id === vendor);
  const label = def?.label ?? vendor;
  const caps = baseCapabilities(def?.integration ?? 'connector');

  return {
    vendor,
    label,
    capabilities: caps,
    async connect({ externalDeviceId }) {
      if (!caps.connectApi && vendor !== 'smartphone' && vendor !== 'tablet') {
        return {
          ok: true,
          external_device_id: externalDeviceId ?? `${vendor}-import`,
          message: cameraConnectHonestMessage(label, false),
        };
      }
      if (!caps.connectApi) {
        return {
          ok: true,
          external_device_id: `${vendor}-device`,
          message: `${label} : captation / import téléphone — sans OAuth fabricant.`,
        };
      }
      return {
        ok: true,
        external_device_id: externalDeviceId ?? `${vendor}-${Date.now().toString(36)}`,
        message: cameraConnectHonestMessage(label, true),
      };
    },
    async startRecording({ eventTitle }) {
      if (!caps.startRecording) {
        return {
          ok: false,
          message: `${label} : lancez l’enregistrement sur l’appareil, puis importez la vidéo.`,
        };
      }
      return {
        ok: true,
        external_recording_id: `rec-${Date.now().toString(36)}`,
        message: `Enregistrement démarré pour « ${eventTitle} ».`,
      };
    },
    async importVideo({ fileName }) {
      return {
        ok: true,
        storage_hint: fileName ?? `import-${vendor}-${Date.now()}.mp4`,
        message: 'Vidéo prête à être associée au match.',
      };
    },
    async generateHighlights({ title }) {
      if (!caps.autoHighlights) {
        return { clips: [], message: 'Highlights non disponibles pour cette source.' };
      }
      // Pas de clips inventés — le pipeline réel peuplera les highlights.
      return {
        clips: [] as MatchVideoClip[],
        message: `Highlights « ${title} » : en attente du pipeline club / fabricant. Aucun clip fictif généré.`,
      };
    },
  };
}

const registry = new Map<VideoCameraVendor, ClubCameraProvider>();

for (const v of VIDEO_VENDORS) {
  registry.set(v.id, makeProvider(v.id));
}

/** Récupère le provider d’une marque — ajouter une marque = 1 entrée VIDEO_VENDORS. */
export function getCameraProvider(vendor: VideoCameraVendor): ClubCameraProvider {
  return registry.get(vendor) ?? makeProvider(vendor);
}

export function listCameraProviders(): ClubCameraProvider[] {
  return VIDEO_VENDORS.map((v) => getCameraProvider(v.id));
}

export function resolveMatchVideoSource(vendor: VideoCameraVendor): MatchVideoSource {
  const def = VIDEO_VENDORS.find((v) => v.id === vendor);
  if (def?.integration === 'device_capture') return 'device_capture';
  if (def?.integration === 'native') return 'camera_api';
  return 'import';
}

/** Enregistre un provider custom (tests / partenaires). */
export function registerCameraProvider(provider: ClubCameraProvider): void {
  registry.set(provider.vendor, provider);
}
