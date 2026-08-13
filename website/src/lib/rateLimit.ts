type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSec?: number };

function memoryCheck(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

/**
 * IP client : préférer les en-têtes plateforme (non spoofables),
 * jamais le premier hop X-Forwarded-For (contrôlé par le client).
 */
export function getClientIp(request: Request): string {
  const nf = request.headers.get("x-nf-client-connection-ip")?.trim();
  if (nf) return nf;

  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // Netlify / reverse-proxy : l'IP client est le dernier hop de la chaîne.
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  return "unknown";
}

async function blobsCheck(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  // Uniquement sur Netlify (évite d'exiger des credentials en local).
  if (process.env.NETLIFY !== "true" && !process.env.NETLIFY_BLOBS_CONTEXT) {
    return null;
  }

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "proday-rate-limits", consistency: "strong" });
    const now = Date.now();
    const raw = await store.get(key, { type: "json" });
    const bucket =
      raw &&
      typeof raw === "object" &&
      typeof (raw as Bucket).count === "number" &&
      typeof (raw as Bucket).resetAt === "number"
        ? (raw as Bucket)
        : null;

    if (!bucket || now > bucket.resetAt) {
      const next: Bucket = { count: 1, resetAt: now + windowMs };
      await store.setJSON(key, next);
      return { allowed: true };
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
      };
    }

    const next: Bucket = { count: bucket.count + 1, resetAt: bucket.resetAt };
    await store.setJSON(key, next);
    return { allowed: true };
  } catch {
    return null;
  }
}

/**
 * Rate limit partagé (Netlify Blobs en prod, mémoire en local / fallback).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const durable = await blobsCheck(key, limit, windowMs);
  if (durable) return durable;
  return memoryCheck(key, limit, windowMs);
}
