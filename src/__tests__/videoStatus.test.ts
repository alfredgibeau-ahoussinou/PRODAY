import {
  lifecycleColor,
  resolveVideoLifecycle,
} from '../features/video/videoStatus';
import type { VideoSurfaceTokens } from '../features/video/VideoWorkspacePanels';

/**
 * Jetons de référence — des chaînes uniques par champ rendent les assertions
 * de `lifecycleColor` explicites (la fonction ne fait que projeter un ton sur
 * un jeton du pôle, sans jamais coder d'hex).
 */
const TOKENS: VideoSurfaceTokens = {
  bg: 'token:bg',
  surface: 'token:surface',
  elevated: 'token:elevated',
  border: 'token:border',
  borderStrong: 'token:border-strong',
  foreground: 'token:foreground',
  muted: 'token:muted',
  accent: 'token:accent',
  accentSoft: 'token:accent-soft',
  onAccent: 'token:on-accent',
  warning: 'token:warning',
  danger: 'token:danger',
  success: 'token:success',
  isLight: false,
};

describe('videoStatus — cycle de vie vidéo', () => {
  describe('resolveVideoLifecycle — les six états', () => {
    it("kind 'live' → Live, ton live, lisible (le rouge est réservé au direct)", () => {
      expect(resolveVideoLifecycle({ kind: 'live' })).toEqual({
        label: 'Live',
        tone: 'live',
        playable: true,
      });
    });

    it("status 'recording' → Enregistrement, ton live, lisible", () => {
      expect(resolveVideoLifecycle({ status: 'recording' })).toEqual({
        label: 'Enregistrement',
        tone: 'live',
        playable: true,
      });
    });

    it("status 'uploading' → Téléversement, ton warning, non lisible", () => {
      expect(resolveVideoLifecycle({ status: 'uploading' })).toEqual({
        label: 'Téléversement',
        tone: 'warning',
        playable: false,
      });
    });

    it("status 'processing' → Traitement, ton warning, non lisible", () => {
      expect(resolveVideoLifecycle({ status: 'processing' })).toEqual({
        label: 'Traitement',
        tone: 'warning',
        playable: false,
      });
    });

    it("status 'ready' → Prête, ton accent, lisible", () => {
      expect(resolveVideoLifecycle({ status: 'ready' })).toEqual({
        label: 'Prête',
        tone: 'accent',
        playable: true,
      });
    });

    it("status 'failed' → Échec, ton danger, non lisible", () => {
      expect(resolveVideoLifecycle({ status: 'failed' })).toEqual({
        label: 'Échec',
        tone: 'danger',
        playable: false,
      });
    });
  });

  describe('primauté du direct (kind prime sur le statut)', () => {
    it("un direct resté en statut 'failed' s'affiche Live", () => {
      expect(resolveVideoLifecycle({ kind: 'live', status: 'failed' })).toEqual({
        label: 'Live',
        tone: 'live',
        playable: true,
      });
    });

    it("un direct en cours de traitement s'affiche Live", () => {
      expect(resolveVideoLifecycle({ kind: 'live', status: 'processing' })).toEqual({
        label: 'Live',
        tone: 'live',
        playable: true,
      });
    });

    it('un direct sans statut persisté reste Live', () => {
      expect(resolveVideoLifecycle({ kind: 'live', status: undefined })).toEqual({
        label: 'Live',
        tone: 'live',
        playable: true,
      });
    });
  });

  describe('statuts absents — donnée absente ≠ état inventé', () => {
    it('aucune donnée → Prête (état de repli honnête)', () => {
      expect(resolveVideoLifecycle({})).toEqual({
        label: 'Prête',
        tone: 'accent',
        playable: true,
      });
    });

    it("kind 'replay' sans statut → Prête", () => {
      expect(resolveVideoLifecycle({ kind: 'replay' })).toEqual({
        label: 'Prête',
        tone: 'accent',
        playable: true,
      });
    });

    it("kind 'imported' sans statut → Prête", () => {
      expect(resolveVideoLifecycle({ kind: 'imported' })).toEqual({
        label: 'Prête',
        tone: 'accent',
        playable: true,
      });
    });

    it("kind 'unknown' sans statut → Prête", () => {
      expect(resolveVideoLifecycle({ kind: 'unknown' })).toEqual({
        label: 'Prête',
        tone: 'accent',
        playable: true,
      });
    });

    it('statut undefined explicite → Prête', () => {
      expect(resolveVideoLifecycle({ kind: undefined, status: undefined })).toEqual({
        label: 'Prête',
        tone: 'accent',
        playable: true,
      });
    });
  });

  describe('lifecycleColor — projection des tons sur les jetons du pôle', () => {
    it('le ton live emprunte danger (rouge réservé au direct)', () => {
      expect(lifecycleColor(TOKENS, 'live')).toBe('token:danger');
    });

    it('le ton accent emprunte accent du pôle', () => {
      expect(lifecycleColor(TOKENS, 'accent')).toBe('token:accent');
    });

    it('le ton warning (téléversement/traitement) emprunte warning', () => {
      expect(lifecycleColor(TOKENS, 'warning')).toBe('token:warning');
    });

    it('le ton danger (échec) emprunte danger', () => {
      expect(lifecycleColor(TOKENS, 'danger')).toBe('token:danger');
    });

    it('le ton success emprunte success', () => {
      expect(lifecycleColor(TOKENS, 'success')).toBe('token:success');
    });
  });

  describe('cohérence transversale', () => {
    const SIX_STATES = [
      { item: { kind: 'live' as const }, playable: true },
      { item: { status: 'recording' as const }, playable: true },
      { item: { status: 'uploading' as const }, playable: false },
      { item: { status: 'processing' as const }, playable: false },
      { item: { status: 'ready' as const }, playable: true },
      { item: { status: 'failed' as const }, playable: false },
    ];

    it('seuls Live, Enregistrement et Prête sont lisibles', () => {
      for (const { item, playable } of SIX_STATES) {
        expect(resolveVideoLifecycle(item).playable).toBe(playable);
      }
    });

    it('chaque état dérivé projette une couleur définie du pôle', () => {
      for (const { item } of SIX_STATES) {
        const view = resolveVideoLifecycle(item);
        expect(lifecycleColor(TOKENS, view.tone)).toMatch(/^token:/);
      }
    });
  });
});
