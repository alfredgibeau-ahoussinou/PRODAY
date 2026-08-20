/**
 * Sportmonks Soccer API v3 client — cache + soft rate-limit.
 * Docs: https://docs.sportmonks.com/v3/
 * Base: https://api.sportmonks.com/v3/football
 * Auth: api_token query param (prefer Cloud Function proxy).
 */

const BASE = 'https://api.sportmonks.com/v3/football';
const DEFAULT_TTL_MS = 45_000;
const LIVE_TTL_MS = 25_000;
const MIN_GAP_MS = 350;

type CacheEntry = { expiresAt: number; payload: unknown };

const cache = new Map<string, CacheEntry>();
let lastRequestAt = 0;

export type SportmonksFetchOpts = {
  path: string;
  query?: Record<string, string | number | undefined | null>;
  ttlMs?: number;
  /** Prefer server proxy when available */
  useProxy?: boolean;
};

function getClientToken(): string {
  return (process.env.EXPO_PUBLIC_SPORTMONKS_API_TOKEN ?? '').trim();
}

export function isSportmonksTokenConfigured(): boolean {
  return getClientToken().length > 0;
}

export function isSupporterFootballDemoForced(): boolean {
  return process.env.EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO === '1';
}

async function throttle(): Promise<void> {
  const wait = MIN_GAP_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

function buildUrl(path: string, query: Record<string, string | number | undefined | null>, token: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE}${clean}`);
  url.searchParams.set('api_token', token);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function tryProxy(path: string, query: Record<string, string | number | undefined | null>): Promise<unknown | null> {
  try {
    const { callFunction, isFunctionsUnavailable } = await import('../../lib/firebaseFunctions');
    const result = await callFunction<
      { path: string; query?: Record<string, string | number | undefined | null> },
      { data: unknown }
    >('supporterFootballProxy', { path, query });
    return result?.data ?? null;
  } catch (e) {
    const { isFunctionsUnavailable } = await import('../../lib/firebaseFunctions');
    if (isFunctionsUnavailable(e)) return null;
    return null;
  }
}

export async function sportmonksFetch<T = unknown>(opts: SportmonksFetchOpts): Promise<T> {
  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;
  const query = opts.query ?? {};
  const cacheKey = `${opts.path}?${JSON.stringify(query)}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.payload as T;
  }

  let payload: unknown = null;

  if (opts.useProxy !== false) {
    payload = await tryProxy(opts.path, query);
  }

  if (payload == null) {
    const token = getClientToken();
    if (!token) {
      throw new Error('SPORTMONKS_TOKEN_MISSING');
    }
    await throttle();
    const url = buildUrl(opts.path, query, token);
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Sportmonks HTTP ${res.status}: ${text.slice(0, 180)}`);
    }
    payload = await res.json();
  }

  cache.set(cacheKey, { expiresAt: Date.now() + ttl, payload });
  return payload as T;
}

export function sportmonksLiveTtl(): number {
  return LIVE_TTL_MS;
}

export function clearSportmonksCache(): void {
  cache.clear();
}

/** Raw Sportmonks list envelope. */
export interface SportmonksListResponse<T> {
  data?: T[];
  message?: string;
  rate_limit?: { remaining?: number; resets_in_seconds?: number };
}

export interface SportmonksItemResponse<T> {
  data?: T;
  message?: string;
}
