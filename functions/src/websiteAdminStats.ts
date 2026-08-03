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

const USERS_SCAN_CAP = 5000;
const LIST_CAP = 200;
const REFERRAL_LIST_CAP = 100;
const REPORTS_LIST_CAP = 100;

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

function bump(map: Record<string, number>, key: string): void {
  const k = key.trim() || 'unknown';
  map[k] = (map[k] ?? 0) + 1;
}

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  subscription_tier: 'free' | 'pro' | null;
  subscription_status: string | null;
  player_level: string | null;
  gender: string | null;
  created_at: string | null;
  last_active_at: string | null;
};

type ReferralRow = {
  id: string;
  code: string;
  ownerEmail: string;
  progress: number;
  totalSubscribed: number;
  rewardsEarned: number;
  updatedAt: string | null;
};

type ReportRow = {
  id: string;
  type: string;
  target: string;
  reporter: string;
  status: 'open';
  createdAt: string | null;
};

/**
 * Agrégats Firestore pour l’admin site (secret partagé).
 * Pas de MRR Stripe inventé — uniquement champs users / referrals / reel_reports.
 */
export function createWebsiteAdminStatsHandler(db: admin.firestore.Firestore) {
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
      const usersSnap = await db
        .collection('users')
        .select(
          'email',
          'display_name',
          'role',
          'is_active',
          'subscription_tier',
          'subscription_status',
          'subscription_period_end',
          'player_level',
          'gender',
          'created_at',
          'last_active_at',
          'updated_at',
          'referral_code',
          'referral_progress',
          'referral_total_subscribed',
          'referral_rewards_earned',
        )
        .limit(USERS_SCAN_CAP)
        .get();

      const byRole: Record<string, number> = {};
      const byTier: Record<string, number> = { free: 0, pro: 0 };
      const bySubStatus: Record<string, number> = {};
      let active = 0;
      let inactive = 0;

      const userRows: AdminUserRow[] = [];
      const referralRows: ReferralRow[] = [];
      const subscriptionRows: Array<{
        id: string;
        email: string;
        plan: string;
        status: string;
        renewsAt: string | null;
      }> = [];

      let referralCodes = 0;
      let referralSubscribed = 0;
      let referralRewards = 0;

      for (const doc of usersSnap.docs) {
        const data = doc.data();
        const role = String(data.role ?? 'unknown');
        bump(byRole, role);

        const isActive = data.is_active !== false;
        if (isActive) active += 1;
        else inactive += 1;

        const tier = data.subscription_tier === 'pro' ? 'pro' : 'free';
        byTier[tier] = (byTier[tier] ?? 0) + 1;

        const subStatus =
          typeof data.subscription_status === 'string' && data.subscription_status
            ? String(data.subscription_status)
            : tier === 'pro'
              ? 'active'
              : 'none';
        bump(bySubStatus, subStatus);

        const email = String(data.email ?? '');
        const name = String(data.display_name || email || 'Sans nom');
        const createdAt = toIso(data.created_at);
        const lastActive = toIso(data.last_active_at) ?? toIso(data.updated_at);

        userRows.push({
          id: doc.id,
          email,
          name,
          role,
          is_active: isActive,
          subscription_tier: tier,
          subscription_status: subStatus === 'none' ? null : subStatus,
          player_level:
            typeof data.player_level === 'string' ? data.player_level : null,
          gender: typeof data.gender === 'string' ? data.gender : null,
          created_at: createdAt,
          last_active_at: lastActive,
        });

        const code =
          typeof data.referral_code === 'string' ? data.referral_code.trim() : '';
        if (code) {
          referralCodes += 1;
          const progress = Number(data.referral_progress ?? 0) || 0;
          const totalSubscribed = Number(data.referral_total_subscribed ?? 0) || 0;
          const rewardsEarned = Number(data.referral_rewards_earned ?? 0) || 0;
          referralSubscribed += totalSubscribed;
          referralRewards += rewardsEarned;
          referralRows.push({
            id: doc.id,
            code,
            ownerEmail: email || doc.id,
            progress,
            totalSubscribed,
            rewardsEarned,
            updatedAt: lastActive,
          });
        }

        if (tier === 'pro' || (subStatus !== 'none' && subStatus !== 'canceled')) {
          subscriptionRows.push({
            id: doc.id,
            email: email || doc.id,
            plan: tier === 'pro' ? 'Pro' : 'Free',
            status: subStatus === 'none' ? 'active' : subStatus,
            renewsAt: toIso(data.subscription_period_end),
          });
        }
      }

      userRows.sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
      referralRows.sort((a, b) => b.totalSubscribed - a.totalSubscribed);
      subscriptionRows.sort((a, b) => a.email.localeCompare(b.email));

      let reports: ReportRow[] = [];
      try {
        const reportsSnap = await db
          .collection('reel_reports')
          .orderBy('created_at', 'desc')
          .limit(REPORTS_LIST_CAP)
          .get();
        reports = reportsSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: String(data.reason ?? 'Signalement reel'),
            target: String(data.bookmark_key ?? data.source_url ?? d.id),
            reporter: String(data.reporter_uid ?? '—'),
            status: 'open' as const,
            createdAt: toIso(data.created_at),
          };
        });
      } catch {
        const reportsSnap = await db.collection('reel_reports').limit(REPORTS_LIST_CAP).get();
        reports = reportsSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            type: String(data.reason ?? 'Signalement reel'),
            target: String(data.bookmark_key ?? data.source_url ?? d.id),
            reporter: String(data.reporter_uid ?? '—'),
            status: 'open' as const,
            createdAt: toIso(data.created_at),
          };
        });
      }

      const scanned = usersSnap.size;
      const truncated = scanned >= USERS_SCAN_CAP;

      res.status(200).json({
        ok: true,
        truncated,
        scanned_users: scanned,
        users: {
          total: scanned,
          active,
          inactive,
          by_role: byRole,
          by_tier: byTier,
          by_subscription_status: bySubStatus,
          items: userRows.slice(0, LIST_CAP),
        },
        subscriptions: {
          /** MRR Stripe réel non branché — ne jamais inventer d’euros. */
          mrr_available: false,
          mrr: null,
          pro_count: byTier.pro ?? 0,
          free_count: byTier.free ?? 0,
          by_status: bySubStatus,
          active_or_trialing:
            (bySubStatus.active ?? 0) + (bySubStatus.trialing ?? 0),
          past_due: bySubStatus.past_due ?? 0,
          items: subscriptionRows.slice(0, LIST_CAP),
        },
        referrals: {
          codes: referralCodes,
          total_subscribed: referralSubscribed,
          rewards_earned: referralRewards,
          items: referralRows.slice(0, REFERRAL_LIST_CAP),
        },
        reports: {
          total: reports.length,
          open: reports.length,
          items: reports,
        },
      });
    } catch (e) {
      console.error('[websiteAdminStats]', e);
      res.status(500).json({ error: 'Lecture impossible' });
    }
  };
}
