import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "proday_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin/beta";

const TOKEN_PREFIX = "adm1.";

type AdminSessionPayload = {
  role: "founder";
  exp: number;
};

function getAdminPin(): string | null {
  const pin =
    process.env.BETA_ADMIN_PIN?.trim() ||
    process.env.ADMIN_MINICODE?.trim() ||
    "";
  return pin || null;
}

function getSessionSecret(): string | null {
  const secret =
    process.env.BETA_ADMIN_SESSION_SECRET?.trim() ||
    process.env.BETA_ACCESS_SECRET?.trim() ||
    process.env.BETA_WEBSITE_ADMIN_SECRET?.trim() ||
    "";
  if (secret.length >= 16) return secret;
  const pin = getAdminPin();
  if (pin && process.env.NODE_ENV !== "production") {
    return `dev-admin-session:${pin}`;
  }
  return secret || null;
}

export function isAdminPinConfigured(): boolean {
  return Boolean(getAdminPin());
}

export function verifyAdminPin(pin: string): boolean {
  const expected = getAdminPin();
  if (!expected) return false;
  const a = Buffer.from(String(pin));
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createAdminSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const payload: AdminSessionPayload = {
    role: "founder",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${TOKEN_PREFIX}${body}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token?.startsWith(TOKEN_PREFIX)) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const rest = token.slice(TOKEN_PREFIX.length);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return false;

  const body = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  if (!body || !sig) return false;

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as AdminSessionPayload;
    if (parsed.role !== "founder" || typeof parsed.exp !== "number") return false;
    return parsed.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** Cookie présent (contrôle léger middleware Edge — validation crypto côté serveur). */
export function hasAdminSessionCookieValue(value: string | undefined): boolean {
  return Boolean(value?.startsWith(TOKEN_PREFIX) && value.length > 20);
}

export async function getAdminSessionFromCookies(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}

export function adminSessionCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}
