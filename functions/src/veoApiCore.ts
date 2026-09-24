/**
 * Noyau **pur** de l'intégration Veo côté serveur — aucun import Firebase.
 *
 * Séparé de `veoApi.ts` pour une raison précise : ces fonctions décident de ce qui est
 * accepté (identifiants, session utilisable, forme des réponses Veo, URL de lecture).
 * Un module qui n'instancie pas Firestore au chargement peut être exercé directement par
 * `node --test`, ce qui permet de vérifier ces règles au lieu de les supposer.
 *
 * Rien ici n'invente de succès : une réponse de forme inattendue est classée
 * `invalid_response`, une session sans jeton utilisable est refusée.
 */

export const VEO_TOKEN_URL_PROD = 'https://tokenapi.veo.co.uk/oauth2/token';
export const VEO_TOKEN_URL_UAT = 'https://tokenapiuat.veo.co.uk/oauth2/token';
export const VEO_API_BASE = 'https://api.veo.co.uk/api';

/** Environ 14 jours d'après la documentation Veo (`expires_in: 1209599`). */
export const VEO_TOKEN_LIFETIME_SEC = 1209599;

export type VeoFailureKind =
  | 'not_configured'
  | 'unauthorized'
  | 'rate_limited'
  | 'unavailable'
  | 'invalid_response';

export const VEO_FAILURE_MESSAGE: Record<VeoFailureKind, string> = {
  not_configured:
    'Identifiants API Veo (client_id + secret) non provisionnés : ils sont délivrés uniquement par un représentant Veo. Aucune connexion au compte Veo ne peut aboutir avant cet octroi — la demande d’accès est administrative, pas technique.',
  unauthorized:
    'Veo a refusé cet échange d’identifiants. Vérifiez l’adresse e-mail et le mot de passe du compte Veo, ainsi que les droits du client API.',
  rate_limited: 'Veo limite temporairement les requêtes. Réessayez dans quelques minutes.',
  unavailable: 'Le service Veo est injoignable pour le moment. Réessayez.',
  invalid_response: 'Réponse Veo inattendue : elle n’a pas la forme documentée.',
};

/** Traduit un statut HTTP Veo en nature d'échec — sans jamais inventer de succès. */
export function classifyVeoStatus(status: number): VeoFailureKind {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'unavailable';
  if (status >= 400) return 'invalid_response';
  return 'invalid_response';
}

/** Corps `x-www-form-urlencoded` du seul flux documenté par Veo. */
export function buildTokenRequestBody(input: {
  email: string;
  password: string;
  clientId: string;
}): Record<string, string> {
  return {
    Username: input.email.trim(),
    Password: input.password,
    Grant_type: 'password',
    Client_id: input.clientId,
  };
}

export type VeoCredentials = {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
};

/**
 * Identifiants Veo lus dans l'environnement serveur.
 * `VEO_USE_UAT=1` bascule sur l'environnement de recette Veo.
 */
export function readVeoCredentials(env: NodeJS.ProcessEnv): VeoCredentials | null {
  const clientId = env.VEO_CLIENT_ID;
  const clientSecret = env.VEO_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const tokenUrl = env.VEO_USE_UAT === '1' ? VEO_TOKEN_URL_UAT : VEO_TOKEN_URL_PROD;
  return { clientId, clientSecret, tokenUrl };
}

// ---------------------------------------------------------------------------
// Identifiants de l'application Veo (le couple délivré par un représentant Veo)
// ---------------------------------------------------------------------------

/**
 * Collection des identifiants d'application Veo, **par club**.
 *
 * Ces documents ne sont jamais lus par un client : seules les Cloud Functions y accèdent
 * (le SDK admin ignore les règles). Aucune règle Firestore ne les autorise, et une règle
 * de refus explicite est posée en défense supplémentaire.
 */
export const VEO_API_CLIENTS_COLLECTION = 'veo_api_clients';

export type VeoEnvironment = 'prod' | 'uat';

export type VeoApiClientRecord = {
  client_id: string;
  client_secret: string;
  environment: VeoEnvironment;
  updated_by_uid: string;
  updated_at: number;
};

/**
 * Valide la saisie faite **depuis l'application**. Les longueurs minimales ne sont pas
 * décoratives : elles écartent une adresse e-mail saisie par erreur dans le champ du
 * secret, ou une clé tronquée par un copier-coller partiel.
 */
export function normalizeVeoApiClientInput(input: unknown):
  | { ok: true; value: { clientId: string; clientSecret: string; environment: VeoEnvironment } }
  | { ok: false; message: string } {
  const row = (input ?? {}) as Record<string, unknown>;
  const clientId = typeof row.clientId === 'string' ? row.clientId.trim() : '';
  const clientSecret = typeof row.clientSecret === 'string' ? row.clientSecret.trim() : '';
  const environment: VeoEnvironment = row.environment === 'uat' ? 'uat' : 'prod';

  if (clientId.length < 8) {
    return { ok: false, message: 'Identifiant client Veo manquant ou trop court.' };
  }
  if (clientSecret.length < 16) {
    return {
      ok: false,
      message:
        'Secret client Veo manquant ou trop court — vérifiez le copier-coller depuis le message du représentant Veo.',
    };
  }
  if (clientId === clientSecret) {
    return { ok: false, message: 'L’identifiant et le secret doivent être deux valeurs distinctes.' };
  }
  return { ok: true, value: { clientId, clientSecret, environment } };
}

/**
 * Forme masquée d'un identifiant client : permet de vérifier **quel** client est en place
 * sans jamais renvoyer le secret à l'application.
 */
export function maskClientId(clientId: string): string {
  const clean = clientId.trim();
  if (clean.length <= 4) return '••••';
  return `••••${clean.slice(-4)}`;
}

/**
 * Résolution des identifiants : l'environnement du projet d'abord (si un représentant Veo
 * a fourni un client global), puis le client enregistré **par le club depuis l'app**.
 * `source` est renvoyé pour que l'écran dise d'où vient la configuration.
 */
export function resolveVeoCredentials(input: {
  env: NodeJS.ProcessEnv;
  stored: Pick<VeoApiClientRecord, 'client_id' | 'client_secret' | 'environment'> | null;
}): { credentials: VeoCredentials | null; source: 'project' | 'club' | null } {
  const fromEnv = readVeoCredentials(input.env);
  if (fromEnv) return { credentials: fromEnv, source: 'project' };

  const stored = input.stored;
  if (!stored?.client_id || !stored.client_secret) return { credentials: null, source: null };
  return {
    credentials: {
      clientId: stored.client_id,
      clientSecret: stored.client_secret,
      tokenUrl: stored.environment === 'uat' ? VEO_TOKEN_URL_UAT : VEO_TOKEN_URL_PROD,
    },
    source: 'club',
  };
}

// ---------------------------------------------------------------------------
// Autorisation — qui peut, dans un club
// ---------------------------------------------------------------------------

/**
 * Rôles autorisés à utiliser la vidéo Veo du club : le staff, jamais un joueur ni un
 * parent, ni un membre d'un autre club.
 */
export function isVeoStaffRole(role: unknown, isPlatformAdmin = false): boolean {
  if (isPlatformAdmin) return true;
  return role === 'coach' || role === 'club' || role === 'president' || role === 'staff';
}

/** Retirer les identifiants du club est réservé à un rôle dirigeant. */
export function isVeoAdminRole(role: unknown, isPlatformAdmin = false): boolean {
  if (isPlatformAdmin) return true;
  return role === 'club' || role === 'president';
}

/** Même club (ou administrateur plateforme) — un staff ne touche pas au club d'un autre. */
export function isSameClub(userClub: unknown, clubId: string, isPlatformAdmin = false): boolean {
  if (isPlatformAdmin) return true;
  const club = typeof userClub === 'string' ? userClub.trim() : '';
  if (!club) return false;
  return club === clubId;
}

export type VeoSessionRecord = {
  token: string;
  expires_at: number;
  account_email: string;
  updated_at: number;
};

/** Session exploitée seulement si elle n'est pas expirée (marge de 60 s). */
export function isSessionUsable(
  session: Pick<VeoSessionRecord, 'token' | 'expires_at'> | null | undefined,
  nowMs: number,
): boolean {
  if (!session?.token) return false;
  return session.expires_at > nowMs + 60_000;
}

/** Entrée renvoyée par `videos/v3/get-all` — formes non garanties, donc tolérée. */
export type VeoVideoSummary = {
  id: string;
  title: string;
  recordedAt: string | null;
  durationSec: number | null;
  status: string | null;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;

const asString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
};

/**
 * Normalise une entrée de `get-all`. Un champ absent **reste absent** : ni durée,
 * ni titre inventés — l'écran affichera ce qui existe réellement.
 */
export function mapVeoVideoSummary(raw: unknown): VeoVideoSummary | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = asString(row.Id) ?? asString(row.id);
  if (!id) return null;
  const title = asString(row.Title) ?? asString(row.title) ?? `Captation ${id}`;
  const recordedRaw = asString(row.RecordedStamp) ?? asString(row.recordedStamp);
  const durationRaw = row.Duration ?? row.duration;
  const duration = typeof durationRaw === 'number' && Number.isFinite(durationRaw) ? durationRaw : null;
  return {
    id,
    title,
    recordedAt: recordedRaw,
    durationSec: duration,
    status: asString(row.Status) ?? asString(row.status),
  };
}

/** Liste les vidéos d'une réponse `get-all`, quel que soit son enveloppe. */
export function mapVeoVideoList(payload: unknown): VeoVideoSummary[] {
  const root = asRecord(payload);
  const rows =
    (Array.isArray(payload) ? payload : null) ??
    (Array.isArray(root?.Videos) ? root?.Videos : null) ??
    (Array.isArray(root?.videos) ? root?.videos : null) ??
    (Array.isArray(root?.Items) ? root?.Items : null) ??
    (Array.isArray(root?.items) ? root?.items : null) ??
    [];
  return rows.map(mapVeoVideoSummary).filter((v): v is VeoVideoSummary => v !== null);
}

export type VeoPlaybackTarget = { url: string; durationSec: number | null };

/**
 * Extrait l'URL de lecture d'une réponse `downloadtoken`.
 * Le document renvoie `Id`, `Duration` et `Tokens[]` (un par ratio) : on prend la
 * **première URL fournie par Veo**, jamais une URL reconstruite.
 */
export function pickPlaybackTarget(payload: unknown): VeoPlaybackTarget | null {
  const root = asRecord(payload);
  if (!root) return null;
  const tokens = Array.isArray(root.Tokens) ? root.Tokens : Array.isArray(root.tokens) ? root.tokens : [];
  for (const entry of tokens) {
    const token = asRecord(entry);
    if (!token) continue;
    const url = asString(token.Url) ?? asString(token.url);
    if (!url) continue;
    const durationRaw = root.Duration ?? root.duration;
    const duration =
      typeof durationRaw === 'number' && Number.isFinite(durationRaw) ? durationRaw : null;
    return { url, durationSec: duration };
  }
  const direct = asString(root.Url) ?? asString(root.url);
  if (!direct) return null;
  const durationRaw = root.Duration ?? root.duration;
  return {
    url: direct,
    durationSec:
      typeof durationRaw === 'number' && Number.isFinite(durationRaw) ? durationRaw : null,
  };
}
