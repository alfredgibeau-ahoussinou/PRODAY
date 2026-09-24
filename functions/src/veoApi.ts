/**
 * Fonctions Veo — **le seul endroit où le `client_secret` existe**.
 *
 * Pourquoi côté serveur, et pas dans l'application : la méthode d'authentification
 * réellement documentée par Veo est `grant_type=password`
 * (`tokenapi.veo.co.uk/oauth2/token`), avec un `client_id` **et** un secret délivrés
 * uniquement par un représentant Veo. Un secret embarqué dans le bundle mobile serait
 * extractible : l'échange se fait donc ici, et l'application n'envoie que la demande.
 *
 * Règles tenues par ce module :
 * 1. **Aucun mot de passe journalisé ni persisté** — il sert à l'échange puis disparaît.
 * 2. **Aucun état « connecté » sans jeton réellement obtenu** : tant que les
 *    identifiants Veo ne sont pas provisionnés, la réponse est `not_configured`
 *    avec le blocage exact, jamais un succès simulé.
 * 3. **Aucune URL de lecture devinée** : elle vient de `downloadtoken`, qui renvoie
 *    des URL à usage unique. Sans compte, il n'y a pas d'URL à servir.
 * 4. **Le direct n'est pas exposé** : aucun endpoint live n'est documenté par Veo.
 *
 * Le noyau pur (`veoApiCore`) porte les règles de lecture et de décision ; ce fichier ne
 * fait que les brancher sur Firestore et sur les callables. Documentation de référence :
 * `docs/proday-veo-feature-inventory.md` §2 (endpoints, flux d'authentification, cycle de
 * vie des vidéos) — sources officielles citées dans ce document.
 */
import { onCall, HttpsError, type CallableRequest, type FunctionsErrorCode } from 'firebase-functions/v2/https';
/**
 * `admin` vient de `firebaseAdmin` (et non de `firebase-admin` directement) : ce module
 * appelle `admin.firestore()` au chargement, donc l'application par défaut doit déjà
 * exister. Un import direct de `firebase-admin` laisserait `initializeApp()` s'exécuter
 * après, et toutes les fonctions Veo échoueraient au démarrage du conteneur.
 */
import { admin } from './firebaseAdmin';
import {
  VEO_API_BASE,
  VEO_API_CLIENTS_COLLECTION,
  VEO_FAILURE_MESSAGE,
  VEO_TOKEN_LIFETIME_SEC,
  buildTokenRequestBody,
  classifyVeoStatus,
  isSameClub,
  isSessionUsable,
  isVeoAdminRole,
  isVeoStaffRole,
  mapVeoVideoList,
  maskClientId,
  normalizeVeoApiClientInput,
  pickPlaybackTarget,
  resolveVeoCredentials,
  type VeoApiClientRecord,
  type VeoFailureKind,
  type VeoSessionRecord,
} from './veoApiCore';

export * from './veoApiCore';

const db = admin.firestore();

/**
 * Les fonctions Veo sont déployées en **`europe-west1`**, comme toutes les callables
 * ProDay : l'application les appelle avec cette région (sinon elles seraient cherchées
 * sur le domaine par défaut et donc introuvables).
 */
export const VEO_FUNCTIONS_REGION = 'europe-west1';

/** Options communes : région ProDay, mémoire et délai d'un appel d'API externe. */
const VEO_CALLABLE_OPTIONS = {
  region: VEO_FUNCTIONS_REGION,
  timeoutSeconds: 60,
  memory: '256MiB' as const,
};

const sessionRef = (uid: string) => db.doc(`veo_sessions/${uid}`);

export type VeoAccountStatus = {
  configured: boolean;
  connected: boolean;
  expiresAt: number | null;
  accountEmail: string | null;
  message: string;
  /** D'où vient la configuration : projet (env) ou club (saisie dans l'app). */
  clientSource: 'project' | 'club' | null;
  /** Identifiant client masqué, pour vérifier lequel est en place. Jamais le secret. */
  clientIdMasked: string | null;
  /** Le club a-t-il un client enregistré ? Permet de proposer de le retirer. */
  clubClientStored: boolean;
};

function requireClubId(request: CallableRequest): string {
  const clubId = typeof request.data?.clubId === 'string' ? request.data.clubId.trim() : '';
  if (!clubId) {
    throw new HttpsError('invalid-argument', 'Club manquant : la vidéo Veo est rattachée à un club.');
  }
  return clubId;
}

/**
 * Autorise un membre du **staff** de ce club (coach, dirigeant, staff ou admin plateforme).
 * Un joueur, un parent, un visiteur ou un staff d'un autre club est refusé ici — la
 * vérification est faite côté serveur, jamais seulement dans l'écran.
 */
async function assertClubVideoStaff(
  request: CallableRequest,
  clubId: string,
): Promise<{ uid: string; role: string; isPlatformAdmin: boolean }> {
  const uid = requireUid(request);
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'Profil introuvable.');
  }
  const user = userSnap.data() ?? {};
  const role = String(user.role ?? '');
  const isPlatformAdmin = request.auth?.token?.admin === true || user.is_admin === true;
  const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
  const userClub = profile.club_id ?? user.club_id;

  if (!isVeoStaffRole(role, isPlatformAdmin)) {
    throw new HttpsError('permission-denied', 'Vidéo Veo réservée au staff du club.');
  }
  if (!isSameClub(userClub, clubId, isPlatformAdmin)) {
    throw new HttpsError('permission-denied', 'Club non autorisé.');
  }
  return { uid, role, isPlatformAdmin };
}

/** Identifiants d'application enregistrés par le club, s'ils existent. */
async function readStoredApiClient(clubId: string): Promise<VeoApiClientRecord | null> {
  const snap = await db.doc(`${VEO_API_CLIENTS_COLLECTION}/${clubId}`).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<VeoApiClientRecord> | undefined;
  if (!data?.client_id || !data.client_secret) return null;
  return {
    client_id: String(data.client_id),
    client_secret: String(data.client_secret),
    environment: data.environment === 'uat' ? 'uat' : 'prod',
    updated_by_uid: String(data.updated_by_uid ?? ''),
    updated_at: Number(data.updated_at ?? 0),
  };
}

async function readSession(uid: string): Promise<VeoSessionRecord | null> {
  const snap = await sessionRef(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<VeoSessionRecord> | undefined;
  if (!data?.token || typeof data.expires_at !== 'number') return null;
  return {
    token: data.token,
    expires_at: data.expires_at,
    account_email: data.account_email ?? '',
    updated_at: data.updated_at ?? 0,
  };
}

function requireUid(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Session expirée. Reconnectez-vous.');
  }
  return uid;
}

/**
 * État du compte Veo — **sans appel réseau**, donc jamais un succès supposé.
 * Le club est passé en paramètre : c'est lui qui peut porter les identifiants saisis dans
 * l'application, sans qu'aucune variable d'environnement n'ait à être déployée.
 */
export const veoAccountStatus = onCall(VEO_CALLABLE_OPTIONS, async (request) => {
  const clubId = requireClubId(request);
  const { uid } = await assertClubVideoStaff(request, clubId);
  const stored = await readStoredApiClient(clubId);
  const { credentials, source } = resolveVeoCredentials({ env: process.env, stored });
  const session = await readSession(uid);
  const connected = isSessionUsable(session, Date.now());
  const status: VeoAccountStatus = {
    configured: Boolean(credentials),
    connected,
    expiresAt: connected && session ? session.expires_at : null,
    accountEmail: connected && session?.account_email ? session.account_email : null,
    message: !credentials
      ? VEO_FAILURE_MESSAGE.not_configured
      : connected
        ? 'Compte Veo connecté côté serveur : la bibliothèque et la lecture passent par l’API officielle.'
        : 'Identifiants Veo présents, mais aucun compte Veo n’est connecté : lancez la connexion.',
    clientSource: source,
    clientIdMasked: credentials ? maskClientId(credentials.clientId) : null,
    clubClientStored: Boolean(stored),
  };
  return status;
});

/**
 * Enregistre, **depuis l'application**, le couple d'identifiants Veo du club (celui qu'un
 * représentant Veo a délivré au club). C'est ce qui permet de tout faire sans commande de
 * déploiement : le secret reste côté serveur et l'écran ne le revoit jamais.
 *
 * Le retrait est réservé à un rôle dirigeant ; la saisie est ouverte au staff du club.
 */
export const veoSetApiClient = onCall(VEO_CALLABLE_OPTIONS, async (request) => {
  const clubId = requireClubId(request);
  const { uid } = await assertClubVideoStaff(request, clubId);
  const parsed = normalizeVeoApiClientInput(request.data);
  if (!parsed.ok) {
    throw new HttpsError('invalid-argument', parsed.message);
  }

  const record: VeoApiClientRecord = {
    client_id: parsed.value.clientId,
    client_secret: parsed.value.clientSecret,
    environment: parsed.value.environment,
    updated_by_uid: uid,
    updated_at: Date.now(),
  };
  await db.doc(`${VEO_API_CLIENTS_COLLECTION}/${clubId}`).set(record, { merge: true });

  const status: VeoAccountStatus = {
    configured: true,
    connected: false,
    expiresAt: null,
    accountEmail: null,
    message:
      'Identifiants API Veo enregistrés côté serveur. Vous pouvez maintenant connecter le compte Veo, ici même.',
    clientSource: 'club',
    clientIdMasked: maskClientId(record.client_id),
    clubClientStored: true,
  };
  return status;
});

/** Retire les identifiants enregistrés par le club (réservé à un rôle dirigeant). */
export const veoClearApiClient = onCall(VEO_CALLABLE_OPTIONS, async (request) => {
  const clubId = requireClubId(request);
  const { role, isPlatformAdmin } = await assertClubVideoStaff(request, clubId);
  if (!isVeoAdminRole(role, isPlatformAdmin)) {
    throw new HttpsError('permission-denied', 'Retirer les identifiants est réservé à un dirigeant.');
  }
  await db.doc(`${VEO_API_CLIENTS_COLLECTION}/${clubId}`).delete();
  return { cleared: true };
});

/**
 * Connexion au compte Veo — échange `grant_type=password` **côté serveur**.
 * Le mot de passe sert à l'échange puis n'est ni persisté, ni journalisé.
 */
export const veoConnect = onCall(VEO_CALLABLE_OPTIONS, async (request) => {
  const clubId = requireClubId(request);
  const { uid } = await assertClubVideoStaff(request, clubId);
  const stored = await readStoredApiClient(clubId);
  const { credentials } = resolveVeoCredentials({ env: process.env, stored });
  if (!credentials) {
    throw new HttpsError('failed-precondition', VEO_FAILURE_MESSAGE.not_configured);
  }
  const email = typeof request.data?.email === 'string' ? request.data.email : '';
  const password = typeof request.data?.password === 'string' ? request.data.password : '';
  if (!email.trim() || !password) {
    throw new HttpsError(
      'invalid-argument',
      'Adresse e-mail et mot de passe du compte Veo requis.',
    );
  }

  const body = new URLSearchParams(
    buildTokenRequestBody({ email, password, clientId: credentials.clientId }),
  );
  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');

  let response: Response;
  try {
    response = await fetch(credentials.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      body: body.toString(),
    });
  } catch {
    throw new HttpsError('unavailable', VEO_FAILURE_MESSAGE.unavailable);
  }

  if (!response.ok) {
    const kind = classifyVeoStatus(response.status);
    throw new HttpsError(
      kind === 'unauthorized' ? 'permission-denied' : 'unavailable',
      VEO_FAILURE_MESSAGE[kind],
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { access_token?: unknown; expires_in?: unknown }
    | null;
  const token = typeof payload?.access_token === 'string' ? payload.access_token : '';
  if (!token) {
    throw new HttpsError('internal', VEO_FAILURE_MESSAGE.invalid_response);
  }
  const lifetime =
    typeof payload?.expires_in === 'number' && Number.isFinite(payload.expires_in)
      ? payload.expires_in
      : VEO_TOKEN_LIFETIME_SEC;

  const expiresAt = Date.now() + lifetime * 1000;
  await sessionRef(uid).set(
    {
      token,
      expires_at: expiresAt,
      account_email: email.trim(),
      updated_at: Date.now(),
    } satisfies VeoSessionRecord,
    { merge: true },
  );

  const result: VeoAccountStatus = {
    configured: true,
    connected: true,
    expiresAt,
    accountEmail: email.trim(),
    message: 'Compte Veo connecté. La bibliothèque Veo et la lecture sont disponibles dans ProDay.',
    clientSource: stored ? 'club' : 'project',
    clientIdMasked: maskClientId(credentials.clientId),
    clubClientStored: Boolean(stored),
  };
  return result;
});

/** Coupe la session locale — révoque l'usage du jeton côté ProDay. */
export const veoDisconnect = onCall(VEO_CALLABLE_OPTIONS, async (request) => {
  const uid = requireUid(request);
  await sessionRef(uid).delete();
  return { connected: false };
});

async function veoFetch(
  uid: string,
  path: string,
): Promise<{ ok: true; payload: unknown } | { ok: false; kind: VeoFailureKind }> {
  const session = await readSession(uid);
  if (!isSessionUsable(session, Date.now())) return { ok: false, kind: 'unauthorized' };
  let response: Response;
  try {
    response = await fetch(`${VEO_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${session!.token}` },
    });
  } catch {
    return { ok: false, kind: 'unavailable' };
  }
  if (!response.ok) return { ok: false, kind: classifyVeoStatus(response.status) };
  const payload = await response.json().catch(() => null);
  if (payload === null) return { ok: false, kind: 'invalid_response' };
  return { ok: true, payload };
}

function throwVeoFailure(kind: VeoFailureKind): never {
  const code: FunctionsErrorCode =
    kind === 'unauthorized'
      ? 'permission-denied'
      : kind === 'not_configured'
        ? 'failed-precondition'
        : kind === 'invalid_response'
          ? 'internal'
          : 'unavailable';
  throw new HttpsError(code, VEO_FAILURE_MESSAGE[kind]);
}

/** Vidéos **autorisées** du compte Veo connecté (`videos/v3/get-all`, paginé). */
export const veoVideosList = onCall(VEO_CALLABLE_OPTIONS, async (request) => {
  const uid = requireUid(request);
  const pageSize = Math.min(Math.max(Number(request.data?.pageSize) || 50, 1), 100);
  const pageNumber = Math.max(Number(request.data?.pageNumber) || 1, 1);
  const result = await veoFetch(
    uid,
    `/videos/v3/get-all?pageSize=${pageSize}&pageNumber=${pageNumber}&orderByDirection=Descending`,
  );
  if (!result.ok) throwVeoFailure(result.kind);
  return { videos: mapVeoVideoList(result.payload), pageNumber, pageSize };
});

/**
 * URL de lecture d'une captation (`videos/{id}/downloadtoken`).
 * Les URL Veo sont **à usage unique** : elles sont résolues à la demande, jamais
 * stockées, et le lecteur intégré ProDay les consomme directement.
 */
export const veoPlaybackUrl = onCall(VEO_CALLABLE_OPTIONS, async (request) => {
  const uid = requireUid(request);
  const videoId = typeof request.data?.videoId === 'string' ? request.data.videoId.trim() : '';
  if (!videoId) {
    throw new HttpsError('invalid-argument', 'Identifiant de captation manquant.');
  }
  const result = await veoFetch(uid, `/videos/${encodeURIComponent(videoId)}/downloadtoken`);
  if (!result.ok) throwVeoFailure(result.kind);
  const target = pickPlaybackTarget(result.payload);
  if (!target) throwVeoFailure('invalid_response');
  return { videoId, url: target.url, durationSec: target.durationSec };
});
