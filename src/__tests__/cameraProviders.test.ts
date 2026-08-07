import {
  getCameraProvider,
  listCameraProviders,
  registerCameraProvider,
  resolveMatchVideoSource,
} from '../services/video/cameraProviders';
import { VIDEO_VENDORS } from '../content/videoOffers';
import type { ClubCameraProvider } from '../services/video/cameraProviders';

describe('cameraProviders', () => {
  it('exposes all catalog vendors including XbotGo', () => {
    const ids = listCameraProviders().map((p) => p.vendor);
    expect(ids).toContain('veo');
    expect(ids).toContain('xbotgo');
    expect(ids).toContain('spiideo');
    expect(ids).toContain('pixellot');
    expect(ids).toContain('trace');
    expect(ids).toContain('smartphone');
    expect(ids.length).toBe(VIDEO_VENDORS.length);
  });

  it('Veo supports API connect + recording + highlights', () => {
    const veo = getCameraProvider('veo');
    expect(veo.capabilities.connectApi).toBe(true);
    expect(veo.capabilities.startRecording).toBe(true);
    expect(veo.capabilities.autoHighlights).toBe(true);
  });

  it('generic / connector vendors always allow import', () => {
    for (const id of ['xbotgo', 'spiideo', 'pixellot', 'generic'] as const) {
      expect(getCameraProvider(id).capabilities.importFile).toBe(true);
    }
  });

  it('allows registering a new brand without rewriting the system', async () => {
    const custom: ClubCameraProvider = {
      vendor: 'generic',
      label: 'PartnerCam',
      capabilities: {
        connectApi: true,
        startRecording: true,
        importFile: true,
        autoHighlights: false,
        playerTracking: false,
      },
      connect: async () => ({ ok: true, message: 'ok', external_device_id: 'pc-1' }),
      startRecording: async () => ({ ok: true, message: 'rec', external_recording_id: 'r1' }),
      importVideo: async () => ({ ok: true, message: 'imp' }),
      generateHighlights: async () => ({ clips: [], message: 'none' }),
    };
    registerCameraProvider(custom);
    const got = getCameraProvider('generic');
    expect(got.label).toBe('PartnerCam');
    const c = await got.connect({ clubId: 'c1' });
    expect(c.ok).toBe(true);
  });

  it('resolves match video source by integration type', () => {
    expect(resolveMatchVideoSource('smartphone')).toBe('device_capture');
    expect(resolveMatchVideoSource('veo')).toBe('camera_api');
    expect(resolveMatchVideoSource('xbotgo')).toBe('import');
  });
});
