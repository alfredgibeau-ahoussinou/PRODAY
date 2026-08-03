/** Client serveur → Cloud Function `websiteAdminStats` (secret partagé). */

export type AdminPlatformUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  subscription_tier: "free" | "pro" | null;
  subscription_status: string | null;
  player_level: string | null;
  gender: string | null;
  created_at: string | null;
  last_active_at: string | null;
};

export type AdminPlatformReferral = {
  id: string;
  code: string;
  ownerEmail: string;
  progress: number;
  totalSubscribed: number;
  rewardsEarned: number;
  updatedAt: string | null;
};

export type AdminPlatformSubscription = {
  id: string;
  email: string;
  plan: string;
  status: string;
  renewsAt: string | null;
};

export type AdminPlatformReport = {
  id: string;
  type: string;
  target: string;
  reporter: string;
  status: "open";
  createdAt: string | null;
};

export type AdminPlatformStatsPayload = {
  truncated: boolean;
  scanned_users: number;
  users: {
    total: number;
    active: number;
    inactive: number;
    by_role: Record<string, number>;
    by_tier: Record<string, number>;
    by_subscription_status: Record<string, number>;
    items: AdminPlatformUser[];
  };
  subscriptions: {
    mrr_available: boolean;
    mrr: number | null;
    pro_count: number;
    free_count: number;
    by_status: Record<string, number>;
    active_or_trialing: number;
    past_due: number;
    items: AdminPlatformSubscription[];
  };
  referrals: {
    codes: number;
    total_subscribed: number;
    rewards_earned: number;
    items: AdminPlatformReferral[];
  };
  reports: {
    total: number;
    open: number;
    items: AdminPlatformReport[];
  };
};

const EMPTY: AdminPlatformStatsPayload = {
  truncated: false,
  scanned_users: 0,
  users: {
    total: 0,
    active: 0,
    inactive: 0,
    by_role: {},
    by_tier: { free: 0, pro: 0 },
    by_subscription_status: {},
    items: [],
  },
  subscriptions: {
    mrr_available: false,
    mrr: null,
    pro_count: 0,
    free_count: 0,
    by_status: {},
    active_or_trialing: 0,
    past_due: 0,
    items: [],
  },
  referrals: {
    codes: 0,
    total_subscribed: 0,
    rewards_earned: 0,
    items: [],
  },
  reports: {
    total: 0,
    open: 0,
    items: [],
  },
};

const DEFAULT_ADMIN_URL =
  "https://europe-west1-proday-155b0.cloudfunctions.net/websiteAdminStats";

function getAdminFunctionConfig(): { url: string; secret: string } | null {
  const url =
    process.env.ADMIN_STATS_FUNCTION_URL?.trim() || DEFAULT_ADMIN_URL;
  const secret = process.env.BETA_WEBSITE_ADMIN_SECRET?.trim();
  if (!secret) return null;
  return { url, secret };
}

export async function fetchAdminPlatformStats(): Promise<{
  ok: boolean;
  status: number;
  data: AdminPlatformStatsPayload;
  error?: string;
}> {
  const config = getAdminFunctionConfig();
  if (!config) {
    return {
      ok: false,
      status: 503,
      data: EMPTY,
      error:
        "Stats plateforme non configurées. Définissez BETA_WEBSITE_ADMIN_SECRET et déployez websiteAdminStats.",
    };
  }

  try {
    const upstream = await fetch(config.url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret": config.secret,
      },
      cache: "no-store",
    });
    const raw = (await upstream.json().catch(() => ({}))) as Partial<
      AdminPlatformStatsPayload
    > & { ok?: boolean; error?: string };

    if (!upstream.ok) {
      return {
        ok: false,
        status: upstream.status,
        data: EMPTY,
        error: raw.error ?? "Lecture impossible",
      };
    }

    return {
      ok: true,
      status: 200,
      data: {
        truncated: Boolean(raw.truncated),
        scanned_users: Number(raw.scanned_users ?? 0),
        users: {
          ...EMPTY.users,
          ...(raw.users ?? {}),
          items: Array.isArray(raw.users?.items) ? raw.users.items : [],
          by_role: raw.users?.by_role ?? {},
          by_tier: raw.users?.by_tier ?? { free: 0, pro: 0 },
          by_subscription_status: raw.users?.by_subscription_status ?? {},
        },
        subscriptions: {
          ...EMPTY.subscriptions,
          ...(raw.subscriptions ?? {}),
          mrr_available: false,
          mrr: null,
          items: Array.isArray(raw.subscriptions?.items)
            ? raw.subscriptions.items
            : [],
          by_status: raw.subscriptions?.by_status ?? {},
        },
        referrals: {
          ...EMPTY.referrals,
          ...(raw.referrals ?? {}),
          items: Array.isArray(raw.referrals?.items) ? raw.referrals.items : [],
        },
        reports: {
          ...EMPTY.reports,
          ...(raw.reports ?? {}),
          items: Array.isArray(raw.reports?.items) ? raw.reports.items : [],
        },
      },
    };
  } catch {
    return {
      ok: false,
      status: 502,
      data: EMPTY,
      error: "Service stats plateforme indisponible",
    };
  }
}
