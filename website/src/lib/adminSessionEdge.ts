/** Vérification session admin compatible Edge (Web Crypto, sans Node). */

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TOKEN_PREFIX,
} from "@/lib/adminSessionConstants";

function runtimeEnv(name: string): string {
  return String(
    (typeof process !== "undefined" ? process.env?.[name] : undefined) ?? "",
  ).trim();
}

function getEdgeSessionSecret(): string | null {
  const secret =
    runtimeEnv("BETA_ADMIN_SESSION_SECRET") ||
    runtimeEnv("BETA_ACCESS_SECRET") ||
    runtimeEnv("BETA_WEBSITE_ADMIN_SECRET");
  return secret.length >= 16 ? secret : null;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Base64Url(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return bufferToBase64Url(signature);
}

/** Valide le cookie admin (HMAC + expiration). utilisable en middleware/proxy Edge. */
export async function verifyAdminSessionTokenEdge(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token?.startsWith(ADMIN_SESSION_TOKEN_PREFIX)) return false;
  const secret = getEdgeSessionSecret();
  if (!secret) return false;

  const rest = token.slice(ADMIN_SESSION_TOKEN_PREFIX.length);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return false;

  const body = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  if (!body || !sig) return false;

  const expected = await hmacSha256Base64Url(secret, body);
  if (!timingSafeEqualString(sig, expected)) return false;

  try {
    const padded = body.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    const b64 = padded + "=".repeat(padLen);
    const raw = atob(b64);
    const parsed = JSON.parse(raw) as { role?: string; exp?: number };
    if (parsed.role !== "founder" || typeof parsed.exp !== "number") return false;
    return parsed.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function hasValidAdminSessionCookie(
  value: string | undefined,
): Promise<boolean> {
  return verifyAdminSessionTokenEdge(value);
}

export { ADMIN_SESSION_COOKIE };
