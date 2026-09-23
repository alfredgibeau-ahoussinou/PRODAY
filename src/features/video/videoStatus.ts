/**
 * Statuts du cycle de vie vidéo — **une seule source de vérité** pour toute la section
 * Vidéo. Les libellés courts et les couleurs dérivent exclusivement des données réelles
 * du service (`ClubMatchVideo.status` / `kind`, dates de création) : aucun état n'est
 * deviné, aucun libellé décore l'interface.
 *
 * Contrat design (DESIGN.md) : un seul accent (jeton `accent` du pôle), le rouge est
 * réservé au direct, `danger` à l'échec, `warning` au transit (téléversement/traitement).
 */
import type { ClubMatchVideo } from '../../models/ClubCameras';
import type { VideoSurfaceTokens } from './VideoWorkspacePanels';

export type VideoLifecycleState = 'live' | 'recording' | 'uploading' | 'processing' | 'ready' | 'failed';

export type VideoLifecycleTone = 'live' | 'accent' | 'warning' | 'success' | 'danger';

export type VideoLifecycleView = {
  /** Libellé court, sans ambiguïté, affiché dans les badges de miniature. */
  label: string;
  tone: VideoLifecycleTone;
  /** La captation est-elle lisible maintenant ? (le direct et l'échec ne le sont pas) */
  playable: boolean;
};

const READY_VIEW: VideoLifecycleView = { label: 'Prête', tone: 'accent', playable: true };

/**
 * Déduit l'état du cycle de vie à partir des données persistées uniquement.
 * `kind === 'live'` prime (un direct n'est pas un simple statut), puis le statut
 * réel du document. À défaut, l'état est « Prête » (donnée absente ≠ état inventé).
 */
export function resolveVideoLifecycle(item: {
  kind?: ClubMatchVideo['kind'];
  status?: ClubMatchVideo['status'];
}): VideoLifecycleView {
  if (item.kind === 'live') {
    return { label: 'Live', tone: 'live', playable: true };
  }
  switch (item.status) {
    case 'recording':
      return { label: 'Enregistrement', tone: 'live', playable: true };
    case 'uploading':
      return { label: 'Téléversement', tone: 'warning', playable: false };
    case 'processing':
      return { label: 'Traitement', tone: 'warning', playable: false };
    case 'failed':
      return { label: 'Échec', tone: 'danger', playable: false };
    default:
      return READY_VIEW;
  }
}

/** Couleur d'un état dans la charte du pôle courant (aucun hex codé ici). */
export function lifecycleColor(tokens: VideoSurfaceTokens, tone: VideoLifecycleTone): string {
  switch (tone) {
    case 'live':
      return tokens.danger;
    case 'warning':
      return tokens.warning;
    case 'success':
      return tokens.success;
    case 'danger':
      return tokens.danger;
    case 'accent':
      return tokens.accent;
  }
}
