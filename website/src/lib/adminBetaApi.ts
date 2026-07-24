export type BetaAdminStatus = "pending" | "approved" | "rejected";

export type BetaAdminWaitlistEntry = {
  id: string;
  email: string;
  role?: string;
  role_label?: string;
  status: BetaAdminStatus;
  welcome_email_sent?: boolean;
  created_at: string | null;
  approved_at: string | null;
};

export type BetaAdminCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
};

type UpstreamList = {
  ok?: boolean;
  entries?: BetaAdminWaitlistEntry[];
  counts?: BetaAdminCounts;
  error?: string;
};

type UpstreamAction = {
  ok?: boolean;
  success?: boolean;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
};

function getAdminFunctionConfig(): { url: string; secret: string } | null {
  const url = process.env.BETA_WAITLIST_ADMIN_FUNCTION_URL?.trim();
  const secret = process.env.BETA_WEBSITE_ADMIN_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}

async function callAdminFunction(
  body: { action: "list" | "approve" | "reject" | "resend"; entryId?: string },
): Promise<{ status: number; data: Record<string, unknown> }> {
  const config = getAdminFunctionConfig();
  if (!config) {
    return {
      status: 503,
      data: {
        error:
          "Admin bêta non configuré. Définissez BETA_WAITLIST_ADMIN_FUNCTION_URL et BETA_WEBSITE_ADMIN_SECRET.",
      },
    };
  }

  const upstream = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": config.secret,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  return { status: upstream.status, data };
}

export async function fetchBetaWaitlistAdmin(): Promise<{
  ok: boolean;
  status: number;
  entries: BetaAdminWaitlistEntry[];
  counts: BetaAdminCounts;
  error?: string;
}> {
  const { status, data } = await callAdminFunction({ action: "list" });
  const parsed = data as UpstreamList;
  if (!upstreamOk(status, parsed)) {
    return {
      ok: false,
      status,
      entries: [],
      counts: { all: 0, pending: 0, approved: 0, rejected: 0 },
      error: String(parsed.error ?? "Impossible de charger la liste"),
    };
  }

  return {
    ok: true,
    status,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    counts: parsed.counts ?? {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
  };
}

export async function approveBetaWaitlistAdmin(entryId: string) {
  return callAction("approve", entryId);
}

export async function rejectBetaWaitlistAdmin(entryId: string) {
  return callAction("reject", entryId);
}

export async function resendBetaWaitlistAdmin(entryId: string) {
  return callAction("resend", entryId);
}

async function callAction(
  action: "approve" | "reject" | "resend",
  entryId: string,
): Promise<{
  ok: boolean;
  status: number;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
}> {
  const { status, data } = await callAdminFunction({ action, entryId });
  const parsed = data as UpstreamAction;
  if (!upstreamOk(status, parsed)) {
    return {
      ok: false,
      status,
      error: String(parsed.error ?? "Action impossible"),
    };
  }
  return {
    ok: true,
    status,
    emailSent: parsed.emailSent,
    emailError: parsed.emailError,
  };
}

function upstreamOk(
  status: number,
  data: { ok?: boolean; success?: boolean; error?: string },
): boolean {
  if (status < 200 || status >= 300) return false;
  if (data.error) return false;
  return data.ok === true || data.success === true || data.ok === undefined;
}
