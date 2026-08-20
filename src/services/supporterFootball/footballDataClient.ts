/**
 * football-data.org v4 client — cache + soft rate-limit.
 * Token: EXPO_PUBLIC_FOOTBALL_DATA_TOKEN (Free Plan, 10 req/min).
 */

const DEFAULT_BASE = 'https://api.football-data.org/v4';
const DEFAULT_TTL_MS = 60_000;
const LIVE_TTL_MS = 30_000;
const MIN_GAP_MS = 6_500; // free tier ≈ 10/min

type CacheEntry = { expiresAt: number; payload: unknown };

const cache = new Map<string, CacheEntry>();
let lastRequestAt = 0;

export function getFootballDataToken(): string {
  return (process.env.EXPO_PUBLIC_FOOTBALL_DATA_TOKEN ?? '').trim();
}

export function isFootballDataTokenConfigured(): boolean {
  return getFootballDataToken().length > 0;
}

export function getFootballDataBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_FOOTBALL_DATA_URL ?? '').trim() || DEFAULT_BASE;
}

export function footballDataLiveTtl(): number {
  return LIVE_TTL_MS;
}

async function throttle(): Promise<void> {
  const wait = MIN_GAP_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export type FootballDataFetchOpts = {
  path: string;
  query?: Record<string, string | number | undefined | null>;
  ttlMs?: number;
};

export async function footballDataFetch<T = unknown>(opts: FootballDataFetchOpts): Promise<T> {
  const token = getFootballDataToken();
  if (!token) {
    throw new Error('Token football-data.org absent (EXPO_PUBLIC_FOOTBALL_DATA_TOKEN).');
  }

  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;
  const query = opts.query ?? {};
  const cacheKey = `${opts.path}?${JSON.stringify(query)}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.payload as T;
  }

  await throttle();

  const clean = opts.path.startsWith('/') ? opts.path : `/${opts.path}`;
  const url = new URL(`${getFootballDataBaseUrl()}${clean}`);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  const response = await fetch(url.toString(), {
    headers: { 'X-Auth-Token': token },
  });

  if (response.status === 429) {
    const stale = cache.get(cacheKey);
    if (stale) return stale.payload as T;
    throw new Error('Quota football-data.org dépassé.');
  }

  if (!response.ok) {
    throw new Error(`football-data.org indisponible (${response.status}).`);
  }

  const payload = (await response.json()) as T;
  cache.set(cacheKey, { expiresAt: Date.now() + ttl, payload });
  return payload;
}

export function clearFootballDataCache(): void {
  cache.clear();
}
