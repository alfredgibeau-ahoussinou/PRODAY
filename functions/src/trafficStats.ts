import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { timingSafeEqual } from 'crypto';
import { configStr } from './runtimeConfig';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://proday75.fr',
  'https://www.proday75.fr',
  'https://proday.app',
  'https://www.proday.app',
  'https://proday75.netlify.app',
];

const TOTALS_DOC = 'traffic_stats/totals';
const DAILY_COLLECTION = 'traffic_stats_daily';

type TrafficSource = 'site' | 'app';

/** Rate-limit mémoire (instance Functions) — anti-abus basique. */
const hitBuckets = new Map<string, { count: number; resetAt: number }>();

function setCors(
  req: functions.https.Request,
  res: functions.Response,
  methods: string,
): boolean {
  const origin = req.get('Origin') ?? '';
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.netlify.app'))
  ) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', methods);
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');
  return req.method === 'OPTIONS';
}

function clientIp(req: functions.https.Request): string {
  const forwarded = String(req.get('x-forwarded-for') ?? '')
    .split(',')[0]
    ?.trim();
  return forwarded || req.ip || 'unknown';
}

function allowHit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = hitBuckets.get(key);
  if (!cur || now >= cur.resetAt) {
    hitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (cur.count >= max) return false;
  cur.count += 1;
  return true;
}

function dayKeyUtc(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function isTrafficSource(value: unknown): value is TrafficSource {
  return value === 'site' || value === 'app';
}

function fieldForSource(source: TrafficSource): 'site_visits' | 'app_opens' {
  return source === 'site' ? 'site_visits' : 'app_opens';
}

async function incrementTraffic(
  db: admin.firestore.Firestore,
  source: TrafficSource,
): Promise<void> {
  const field = fieldForSource(source);
  const day = dayKeyUtc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const totalsRef = db.doc(TOTALS_DOC);
  const dailyRef = db.collection(DAILY_COLLECTION).doc(day);

  await db.runTransaction(async (tx) => {
    const totalsSnap = await tx.get(totalsRef);
    const dailySnap = await tx.get(dailyRef);

    if (!totalsSnap.exists) {
      tx.set(totalsRef, {
        site_visits: source === 'site' ? 1 : 0,
        app_opens: source === 'app' ? 1 : 0,
        tracking_started_at: now,
        updated_at: now,
      });
    } else {
      tx.update(totalsRef, {
        [field]: admin.firestore.FieldValue.increment(1),
        updated_at: now,
      });
    }

    if (!dailySnap.exists) {
      tx.set(dailyRef, {
        day_key: day,
        site_visits: source === 'site' ? 1 : 0,
        app_opens: source === 'app' ? 1 : 0,
        updated_at: now,
      });
    } else {
      tx.update(dailyRef, {
        [field]: admin.firestore.FieldValue.increment(1),
        updated_at: now,
      });
    }
  });
}

/** Enregistre une visite site ou une ouverture app (public, rate-limité). */
export function createRecordTrafficVisitHandler(db: admin.firestore.Firestore) {
  return async (req: functions.https.Request, res: functions.Response): Promise<void> => {
    if (setCors(req, res, 'POST, OPTIONS')) {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!allowHit(`traffic:${clientIp(req)}`, 60, 60_000)) {
      res.status(429).json({ error: 'Trop de requêtes' });
      return;
    }

    const body = (req.body ?? {}) as { source?: string };
    if (!isTrafficSource(body.source)) {
      res.status(400).json({ error: 'source invalide (site|app)' });
      return;
    }

    try {
      await incrementTraffic(db, body.source);
      res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[recordTrafficVisit]', e);
      res.status(500).json({ error: 'Enregistrement impossible' });
    }
  };
}

function getConfiguredSecret(): string | null {
  return (
    configStr('beta', 'website_admin_secret', [
      'BETA_WEBSITE_ADMIN_SECRET',
      'BETA_ADMIN_API_SECRET',
    ]) ?? null
  );
}

function extractProvidedSecret(req: functions.https.Request): string {
  const headerSecret = String(req.get('X-Admin-Secret') ?? '').trim();
  if (headerSecret) return headerSecret;
  const auth = String(req.get('Authorization') ?? '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return '';
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

/** Lecture des stats trafic pour l’admin site (secret partagé). */
export function createWebsiteTrafficStatsAdminHandler(db: admin.firestore.Firestore) {
  return async (req: functions.https.Request, res: functions.Response): Promise<void> => {
    if (setCors(req, res, 'GET, POST, OPTIONS')) {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const expected = getConfiguredSecret();
    if (!expected) {
      res.status(503).json({
        error: 'Secret admin site non configuré (BETA_WEBSITE_ADMIN_SECRET)',
      });
      return;
    }
    if (!secretsMatch(extractProvidedSecret(req), expected)) {
      res.status(403).json({ error: 'Secret invalide' });
      return;
    }

    try {
      const totalsSnap = await db.doc(TOTALS_DOC).get();
      const totalsData = totalsSnap.data() ?? {};
      const dailySnap = await db
        .collection(DAILY_COLLECTION)
        .orderBy('day_key', 'desc')
        .limit(90)
        .get();

      const days = dailySnap.docs.map((d) => {
        const data = d.data();
        return {
          day_key: String(data.day_key ?? d.id),
          site_visits: Number(data.site_visits ?? 0),
          app_opens: Number(data.app_opens ?? 0),
        };
      });

      res.status(200).json({
        ok: true,
        totals: {
          site_visits: Number(totalsData.site_visits ?? 0),
          app_opens: Number(totalsData.app_opens ?? 0),
          tracking_started_at: toIso(totalsData.tracking_started_at),
          updated_at: toIso(totalsData.updated_at),
        },
        days,
      });
    } catch (e) {
      console.error('[websiteTrafficStatsAdmin]', e);
      res.status(500).json({ error: 'Lecture impossible' });
    }
  };
}
