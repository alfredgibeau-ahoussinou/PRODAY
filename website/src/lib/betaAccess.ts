import {
  betaRoleLabel,
} from "@/lib/betaWelcomeEmail";
import {
  createSignedBetaAccessToken,
  isSignedBetaAccessToken,
  verifySignedBetaAccessToken,
} from "@/lib/betaSignedToken";

export const BETA_ACCESS_COOKIE = "proday_beta_session";
export const BETA_ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
/** Page d'atterrissage après validation du jeton email ou visite `/beta` avec cookie. */
export const BETA_LANDING_PATH = "/beta/programme";

export type BetaAccessSession = {
  email: string;
  role: string;
  roleLabel: string;
};

function roleLabelFor(role: string): string {
  return betaRoleLabel(role);
}

export function buildBetaAccessUrl(siteUrl: string, accessToken?: string): string {
  const site = siteUrl.replace(/\/$/, "");
  if (accessToken?.trim()) {
    return `${site}${BETA_LANDING_PATH}?token=${encodeURIComponent(accessToken.trim())}`;
  }
  return `${site}${BETA_LANDING_PATH}`;
}

/** Param factice pour que Netlify remplace `?token=` au lieu de le conserver (OpenNext #2209). */
export const BETA_ACCESS_REDIRECT_PARAM = "from";
export const BETA_ACCESS_REDIRECT_VALUE = "access";

/** Redirection interne absolue sans query (évite boucle middleware ↔ API sur Netlify). */
export function buildBetaInternalRedirectUrl(request: Request, pathname: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || new URL(request.url).host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const param = `${BETA_ACCESS_REDIRECT_PARAM}=${BETA_ACCESS_REDIRECT_VALUE}`;
  return `${proto}://${host}${pathname}?${param}`;
}

export function createEmailJsBetaAccessToken(email: string, role: string): string | null {
  const secret = process.env.BETA_ACCESS_SECRET?.trim();
  if (!secret) return null;
  return createSignedBetaAccessToken({ email, role }, secret);
}

async function validateFirestoreBetaToken(token: string): Promise<BetaAccessSession | null> {
  const validateUrl = process.env.BETA_VALIDATE_FUNCTION_URL?.trim();
  if (!validateUrl) return null;

  const url = new URL(validateUrl);
  url.searchParams.set("token", token);

  const upstream = await fetch(url.toString(), { cache: "no-store" });
  if (!upstream.ok) return null;

  const data = (await upstream.json().catch(() => ({}))) as {
    ok?: boolean;
    email?: string;
    role?: string;
    roleLabel?: string;
  };

  if (!data.ok || !data.email) return null;

  const role = String(data.role ?? "player");
  return {
    email: data.email,
    role,
    roleLabel: data.roleLabel?.trim() || roleLabelFor(role),
  };
}

/** Valide un jeton d'accès (Firestore via CF ou jeton signé EmailJS). */
export async function validateBetaAccessToken(
  token: string,
): Promise<BetaAccessSession | null> {
  const normalized = token.trim();
  if (!normalized) return null;

  if (isSignedBetaAccessToken(normalized)) {
    const secret = process.env.BETA_ACCESS_SECRET?.trim();
    if (!secret) return null;
    const payload = verifySignedBetaAccessToken(normalized, secret);
    if (!payload) return null;
    return {
      email: payload.email,
      role: payload.role,
      roleLabel: roleLabelFor(payload.role),
    };
  }

  return validateFirestoreBetaToken(normalized);
}
