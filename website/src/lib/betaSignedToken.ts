import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_PREFIX = "v1.";

type SignedBetaPayload = {
  email: string;
  role: string;
  exp: number;
};

/** Jeton signé HMAC (fallback sans Firestore. envoi EmailJS direct). */
export function createSignedBetaAccessToken(
  payload: { email: string; role: string },
  secret: string,
): string {
  const exp = Math.floor(Date.now() / 1000) + 90 * 24 * 3600;
  const body = Buffer.from(
    JSON.stringify({ email: payload.email, role: payload.role, exp }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${TOKEN_PREFIX}${body}.${sig}`;
}

export function verifySignedBetaAccessToken(
  token: string,
  secret: string,
): { email: string; role: string } | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;

  const rest = token.slice(TOKEN_PREFIX.length);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  if (!body || !sig) return null;

  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SignedBetaPayload;
    if (!parsed.email || !parsed.role || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

export function isSignedBetaAccessToken(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX);
}
