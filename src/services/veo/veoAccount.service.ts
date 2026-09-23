/**
 * Veo côté application — **aucun secret, aucun état supposé**.
 *
 * Toute la partie sensible (client_id + secret Veo, échange `grant_type=password`,
 * jeton, URL `downloadtoken`) vit dans les Cloud Functions
 * (`functions/src/veoApi.ts`). L'application ne fait que demander, et elle **rapporte
 * exactement ce que le serveur répond** : pas de « Connecté » déduit d'un identifiant
 * présent, pas de bibliothèque inventée, pas d'URL de lecture reconstruite.
 *
 * Le mot de passe Veo transite une seule fois, vers notre propre fonction, pour
 * l'échange serveur → serveur ; il n'est ni persisté ni journalisé côté application.
 *
 * Les règles de vérité (normalisation, classification d'erreurs, formatage) vivent dans
 * `veoAccountModel` : elles sont pures, donc vérifiables sans Firebase.
 */
import { callFunction } from '../../lib/firebaseFunctions';
import {
  VEO_DISCONNECTED_STATE,
  classifyVeoCallableError,
  normalizeVeoAccountState,
  normalizeVeoVideoList,
  type VeoAccountState,
  type VeoAccountVideo,
  type VeoApiClientDraft,
  type VeoConnectionKind,
  type VeoPlaybackTarget,
} from './veoAccountModel';

export {
  classifyVeoCallableError,
  formatVeoDuration,
  formatVeoRecordedAt,
  normalizeVeoAccountState,
  normalizeVeoVideoList,
  validateVeoApiClientDraft,
  veoAccountHeadline,
  VEO_DISCONNECTED_STATE,
} from './veoAccountModel';
export type {
  VeoAccountState,
  VeoAccountVideo,
  VeoApiClientDraft,
  VeoClientSource,
  VeoConnectionKind,
  VeoEnvironment,
  VeoPlaybackTarget,
} from './veoAccountModel';

/**
 * Région des fonctions Veo — **la même que le reste de ProDay** (`europe-west1`).
 * L'oublier enverrait les appels au domaine par défaut (us-central1) : la fonction y est
 * introuvable, et l'écran conclurait à tort que l'utilisateur n'a pas de vidéo.
 */
export const VEO_FUNCTIONS_REGION = 'europe-west1';

/** Repli d'échec : nature du problème + message serveur conservé tel quel. */
const failedState = (kind: VeoConnectionKind, message: string): VeoAccountState => ({
  ...VEO_DISCONNECTED_STATE,
  kind,
  message,
});

/**
 * La vidéo Veo est toujours rattachée à un club : sans club, l'appel est inutile et le
 * serveur le refuserait. On le dit ici, sans consommer un aller-retour réseau.
 */
const missingClub = (clubId: string | null | undefined): VeoAccountState | null => {
  if (typeof clubId === 'string' && clubId.trim()) return null;
  return failedState(
    'unavailable',
    'Aucun club associé : la vidéo Veo est rattachée à un club. Demandez à votre club de vous rattacher.',
  );
};

/**
 * État du compte pour **un club donné** : c'est le club qui peut porter les identifiants
 * d'application saisis dans l'app, donc son identifiant est nécessaire pour savoir si
 * quelque chose est configuré.
 */
export async function fetchVeoAccountStatus(clubId: string): Promise<VeoAccountState> {
  const missing = missingClub(clubId);
  if (missing) return missing;
  try {
    const payload = await callFunction<{ clubId: string }, unknown>(
      'veoAccountStatus',
      { clubId },
      VEO_FUNCTIONS_REGION,
    );
    return normalizeVeoAccountState(payload);
  } catch (error) {
    const { kind, message } = classifyVeoCallableError(error);
    return failedState(kind, message);
  }
}

/**
 * Enregistre les identifiants d'application Veo du club **depuis l'application**.
 * C'est le seul chemin : aucune variable d'environnement ni commande de déploiement n'est
 * nécessaire pour que le club se connecte à Veo. Le secret est stocké côté serveur et
 * n'est jamais renvoyé à l'écran.
 */
export async function setVeoApiClient(
  clubId: string,
  draft: VeoApiClientDraft,
): Promise<VeoAccountState> {
  const missing = missingClub(clubId);
  if (missing) return missing;
  try {
    const payload = await callFunction<
      { clubId: string } & VeoApiClientDraft,
      unknown
    >(
      'veoSetApiClient',
      {
        clubId,
        clientId: draft.clientId.trim(),
        clientSecret: draft.clientSecret.trim(),
        environment: draft.environment,
      },
      VEO_FUNCTIONS_REGION,
    );
    return normalizeVeoAccountState(payload);
  } catch (error) {
    const { kind, message } = classifyVeoCallableError(error);
    return failedState(kind, message);
  }
}

/** Retire les identifiants enregistrés par le club (rôle dirigeant). */
export async function clearVeoApiClient(clubId: string): Promise<VeoAccountState> {
  const missing = missingClub(clubId);
  if (missing) return missing;
  try {
    await callFunction<{ clubId: string }, unknown>(
      'veoClearApiClient',
      { clubId },
      VEO_FUNCTIONS_REGION,
    );
    return VEO_DISCONNECTED_STATE;
  } catch (error) {
    const { kind, message } = classifyVeoCallableError(error);
    return failedState(kind, message);
  }
}

/**
 * Connexion au compte Veo. Le mot de passe n'est **pas** conservé côté application :
 * il est transmis à notre fonction, qui réalise l'échange avec Veo.
 */
export async function connectVeoAccount(
  clubId: string,
  email: string,
  password: string,
): Promise<VeoAccountState> {
  const missing = missingClub(clubId);
  if (missing) return missing;
  try {
    const payload = await callFunction<{ clubId: string; email: string; password: string }, unknown>(
      'veoConnect',
      { clubId, email: email.trim(), password },
      VEO_FUNCTIONS_REGION,
    );
    return normalizeVeoAccountState(payload);
  } catch (error) {
    const { kind, message } = classifyVeoCallableError(error);
    return failedState(kind, message);
  }
}

export async function disconnectVeoAccount(): Promise<VeoAccountState> {
  try {
    await callFunction<Record<string, never>, unknown>(
      'veoDisconnect',
      {},
      VEO_FUNCTIONS_REGION,
    );
    return VEO_DISCONNECTED_STATE;
  } catch (error) {
    const { kind, message } = classifyVeoCallableError(error);
    return failedState(kind, message);
  }
}

export type VeoLibraryResult =
  | { ok: true; videos: VeoAccountVideo[] }
  | { ok: false; state: VeoAccountState };

/** Vidéos autorisées du compte Veo (`videos/v3/get-all` côté serveur). */
export async function listVeoAccountVideos(pageSize = 50): Promise<VeoLibraryResult> {
  try {
    const payload = await callFunction<{ pageSize: number }, unknown>(
      'veoVideosList',
      { pageSize },
      VEO_FUNCTIONS_REGION,
    );
    return { ok: true, videos: normalizeVeoVideoList(payload) };
  } catch (error) {
    const { kind, message } = classifyVeoCallableError(error);
    return { ok: false, state: failedState(kind, message) };
  }
}

export type VeoPlaybackResult =
  | { ok: true; target: VeoPlaybackTarget }
  | { ok: false; state: VeoAccountState };

/**
 * Résout l'URL de lecture d'une captation. Les URL Veo sont à usage unique : elles
 * sont demandées au moment de la lecture, jamais mises en cache par l'application.
 */
export async function resolveVeoPlaybackUrl(videoId: string): Promise<VeoPlaybackResult> {
  try {
    const payload = await callFunction<{ videoId: string }, unknown>(
      'veoPlaybackUrl',
      { videoId },
      VEO_FUNCTIONS_REGION,
    );
    const row = (payload ?? {}) as Record<string, unknown>;
    const url = typeof row.url === 'string' ? row.url : '';
    if (!url) {
      return {
        ok: false,
        state: failedState(
          'unavailable',
          'Veo n’a renvoyé aucune URL de lecture pour cette captation.',
        ),
      };
    }
    return {
      ok: true,
      target: {
        url,
        durationSec: typeof row.durationSec === 'number' ? row.durationSec : null,
      },
    };
  } catch (error) {
    const { kind, message } = classifyVeoCallableError(error);
    return { ok: false, state: failedState(kind, message) };
  }
}
