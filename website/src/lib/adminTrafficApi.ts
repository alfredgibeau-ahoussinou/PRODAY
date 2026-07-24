export type TrafficDailyRow = {
  day_key: string;
  site_visits: number;
  app_opens: number;
};

export type TrafficTotals = {
  site_visits: number;
  app_opens: number;
  tracking_started_at: string | null;
  updated_at: string | null;
};

export type TrafficStatsPayload = {
  totals: TrafficTotals;
  days: TrafficDailyRow[];
};

const DEFAULT_ADMIN_URL =
  "https://europe-west1-proday-155b0.cloudfunctions.net/websiteTrafficStatsAdmin";

function getAdminFunctionConfig(): { url: string; secret: string } | null {
  const url =
    process.env.TRAFFIC_STATS_ADMIN_FUNCTION_URL?.trim() || DEFAULT_ADMIN_URL;
  const secret = process.env.BETA_WEBSITE_ADMIN_SECRET?.trim();
  if (!secret) return null;
  return { url, secret };
}

export async function fetchTrafficStatsAdmin(): Promise<{
  ok: boolean;
  status: number;
  data: TrafficStatsPayload;
  error?: string;
}> {
  const empty: TrafficStatsPayload = {
    totals: {
      site_visits: 0,
      app_opens: 0,
      tracking_started_at: null,
      updated_at: null,
    },
    days: [],
  };

  const config = getAdminFunctionConfig();
  if (!config) {
    return {
      ok: false,
      status: 503,
      data: empty,
      error:
        "Stats non configurées. Définissez BETA_WEBSITE_ADMIN_SECRET (et déployez websiteTrafficStatsAdmin).",
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
    const raw = (await upstream.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      totals?: Partial<TrafficTotals>;
      days?: TrafficDailyRow[];
    };

    if (!upstream.ok) {
      return {
        ok: false,
        status: upstream.status,
        data: empty,
        error: raw.error ?? "Lecture impossible",
      };
    }

    return {
      ok: true,
      status: 200,
      data: {
        totals: {
          site_visits: Number(raw.totals?.site_visits ?? 0),
          app_opens: Number(raw.totals?.app_opens ?? 0),
          tracking_started_at: raw.totals?.tracking_started_at ?? null,
          updated_at: raw.totals?.updated_at ?? null,
        },
        days: Array.isArray(raw.days) ? raw.days : [],
      },
    };
  } catch {
    return {
      ok: false,
      status: 502,
      data: empty,
      error: "Service stats indisponible",
    };
  }
}
