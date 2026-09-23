/**
 * Modèle Veo **pur** — testable sans Firebase, sans réseau, sans état.
 *
 * Il porte la règle de vérité de l'intégration : l'application ne connaît que ce que le
 * serveur ProDay lui renvoie. Aucune fonction de ce module ne peut produire un compte
 * « connecté » sans une réponse serveur qui l'affirme.
 */
import { getErrorCode } from '../../utils/errors';

export type VeoConnectionKind =
  | 'not_configured'
  | 'connected'
  | 'disconnected'
  | 'expired'
  | 'unauthorized'
  | 'unavailable';

/** D'où viennent les identifiants d'application Veo (le couple délivré par Veo). */
export type VeoClientSource = 'project' | 'club';

/** Environnement Veo : production ou recette (UAT). */
export type VeoEnvironment = 'prod' | 'uat';

/** Ce que l'utilisateur saisit dans l'app — jamais relu ensuite. */
export type VeoApiClientDraft = {
  clientId: string;
  clientSecret: string;
  environment: VeoEnvironment;
};

export type VeoAccountState = {
  kind: VeoConnectionKind;
  /** Le client Veo (identifiant + secret) est-il disponible côté serveur ? */
  configured: boolean;
  /** Un jeton Veo utilisable existe-t-il réellement pour cet utilisateur ? */
  connected: boolean;
  expiresAt: number | null;
  accountEmail: string | null;
  message: string;
  /** Origine de la configuration : projet (variables serveur) ou club (saisie dans l'app). */
  clientSource: VeoClientSource | null;
  /** Identifiant client masqué — permet de vérifier lequel est en place, sans le secret. */
  clientIdMasked: string | null;
  /** Le club a-t-il enregistré son propre client ? Décide de l'action « retirer ». */
  clubClientStored: boolean;
};

export type VeoAccountVideo = {
  id: string;
  title: string;
  /** Horodatage tel que fourni par Veo — jamais recomposé. */
  recordedAt: string | null;
  durationSec: number | null;
  status: string | null;
};

export type VeoPlaybackTarget = {
  url: string;
  durationSec: number | null;
};

export const VEO_DISCONNECTED_STATE: VeoAccountState = {
  kind: 'disconnected',
  configured: false,
  connected: false,
  expiresAt: null,
  accountEmail: null,
  message: 'Connexion Veo non vérifiée pour le moment.',
  clientSource: null,
  clientIdMasked: null,
  clubClientStored: false,
};

/** Mappe une erreur de callable vers une nature d'échec explicite. */
export function classifyVeoCallableError(error: unknown): {
  kind: VeoConnectionKind;
  message: string;
} {
  const code = getErrorCode(error);
  const raw =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message).trim()
      : '';
  const message = raw || 'Action Veo impossible pour le moment.';

  if (code === 'functions/failed-precondition') return { kind: 'not_configured', message };
  if (code === 'functions/permission-denied') return { kind: 'unauthorized', message };
  if (code === 'functions/not-found') {
    return {
      kind: 'unavailable',
      message:
        'Service Veo ProDay non déployé sur cet environnement : la fonction serveur qui garde les identifiants Veo est absente.',
    };
  }
  if (code === 'functions/unauthenticated') {
    return { kind: 'unauthorized', message: 'Session expirée. Reconnectez-vous.' };
  }
  return { kind: 'unavailable', message };
}

/** Normalise la réponse serveur ; un champ absent reste absent. */
export function normalizeVeoAccountState(payload: unknown): VeoAccountState {
  if (!payload || typeof payload !== 'object') return VEO_DISCONNECTED_STATE;
  const row = payload as Record<string, unknown>;
  const configured = row.configured === true;
  const connected = row.connected === true;
  const expiresAt = typeof row.expiresAt === 'number' ? row.expiresAt : null;
  const isExpired =
    row.kind === 'expired' ||
    (Boolean(expiresAt) && expiresAt! <= Date.now() + 60_000 && !connected && Boolean(row.accountEmail));
  const kind: VeoConnectionKind =
    typeof row.kind === 'string' && (row.kind === 'unauthorized' || row.kind === 'unavailable' || row.kind === 'expired')
      ? (row.kind as VeoConnectionKind)
      : connected
        ? 'connected'
        : isExpired
          ? 'expired'
          : configured
            ? 'disconnected'
            : 'not_configured';

  return {
    kind,
    configured,
    connected,
    expiresAt,
    accountEmail: typeof row.accountEmail === 'string' ? row.accountEmail : null,
    message: typeof row.message === 'string' ? row.message : VEO_DISCONNECTED_STATE.message,
    clientSource:
      row.clientSource === 'project' || row.clientSource === 'club' ? row.clientSource : null,
    clientIdMasked: typeof row.clientIdMasked === 'string' ? row.clientIdMasked : null,
    clubClientStored: row.clubClientStored === true,
  };
}

/**
 * Contrôle de saisie côté app, **avant** l'envoi : mêmes longueurs minimales que le serveur,
 * pour éviter un aller-retour réseau sur une faute de copier-coller. La décision qui compte
 * reste serveur.
 */
export function validateVeoApiClientDraft(
  draft: Partial<VeoApiClientDraft>,
): { ok: true } | { ok: false; message: string } {
  const clientId = (draft.clientId ?? '').trim();
  const clientSecret = (draft.clientSecret ?? '').trim();
  if (clientId.length < 8) return { ok: false, message: 'Identifiant client Veo incomplet.' };
  if (clientSecret.length < 16) return { ok: false, message: 'Secret client Veo incomplet.' };
  if (clientId === clientSecret) {
    return { ok: false, message: 'L’identifiant et le secret doivent être différents.' };
  }
  return { ok: true };
}

/** Liste reçue du serveur, filtrée sur les entrées réellement exploitables. */
export function normalizeVeoVideoList(payload: unknown): VeoAccountVideo[] {
  if (!payload || typeof payload !== 'object') return [];
  const rows = (payload as { videos?: unknown }).videos;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row): VeoAccountVideo | null => {
      if (!row || typeof row !== 'object') return null;
      const item = row as Record<string, unknown>;
      const id = typeof item.id === 'string' ? item.id : '';
      if (!id) return null;
      return {
        id,
        title: typeof item.title === 'string' && item.title.trim() ? item.title : `Captation ${id}`,
        recordedAt: typeof item.recordedAt === 'string' ? item.recordedAt : null,
        durationSec: typeof item.durationSec === 'number' ? item.durationSec : null,
        status: typeof item.status === 'string' ? item.status : null,
      };
    })
    .filter((v): v is VeoAccountVideo => v !== null);
}

/** Libellé honnête de l'état du compte, jamais « Connecté » sans jeton vérifié. */
export function veoAccountHeadline(state: VeoAccountState): string {
  switch (state.kind) {
    case 'connected':
      return 'Compte Veo connecté';
    case 'disconnected':
      return 'Compte Veo non connecté';
    case 'expired':
      return 'Accès Veo expiré';
    case 'unauthorized':
      return 'Accès Veo refusé';
    case 'unavailable':
      return 'Service Veo injoignable';
    default:
      return 'Connexion Veo non configurée';
  }
}

/**
 * Ton de la pastille d'état. « Non configuré » est réservé à ce que le serveur a
 * réellement constaté : une vérification impossible n'est **pas** un client absent.
 */
export function veoConnectionTone(
  state: VeoAccountState,
): 'success' | 'danger' | 'warning' | 'neutral' {
  if (state.connected) return 'success';
  if (state.kind === 'unauthorized') return 'danger';
  if (state.kind === 'expired' || state.kind === 'unavailable') return 'warning';
  return 'neutral';
}

/** Pastille courte : trois échecs différents ne se lisent pas de la même façon. */
export function veoConnectionPillLabel(state: VeoAccountState): string {
  switch (state.kind) {
    case 'connected':
      return 'Connecté';
    case 'unauthorized':
      return 'Refusé';
    case 'expired':
      return 'Expiré';
    case 'unavailable':
      return 'Indisponible';
    case 'not_configured':
      return 'Non configuré';
    default:
      return 'Non connecté';
  }
}

/** Résumé lisible d'une captation Veo — aucune donnée inventée quand elle manque. */
export function formatVeoRecordedAt(recordedAt: string | null): string {
  if (!recordedAt) return 'Date non communiquée';
  const parsed = new Date(recordedAt);
  if (Number.isNaN(parsed.getTime())) return recordedAt;
  return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatVeoDuration(durationSec: number | null): string {
  if (!durationSec || durationSec <= 0) return '';
  return `${Math.round(durationSec / 60)} min`;
}
