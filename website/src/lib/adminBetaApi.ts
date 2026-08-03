export type BetaAdminStatus = "pending" | "approved" | "rejected";

export type BetaAdminWaitlistEntry = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  role_label?: string;
  status: BetaAdminStatus;
  welcome_email_sent?: boolean;
  reject_email_sent?: boolean;
  confirmation_email_sent?: boolean;
  admin_note?: string | null;
  referral_code?: string | null;
  created_at: string | null;
  approved_at: string | null;
  rejected_at?: string | null;
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
  approved?: number;
  failed?: number;
  results?: Array<{
    id: string;
    ok: boolean;
    emailSent?: boolean;
    emailError?: string;
    error?: string;
  }>;
};

function getAdminFunctionConfig(): { url: string; secret: string } | null {
  const url = process.env.BETA_WAITLIST_ADMIN_FUNCTION_URL?.trim();
  const secret = process.env.BETA_WEBSITE_ADMIN_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}

async function callAdminFunction(
  body: {
    action:
      | "list"
      | "approve"
      | "reject"
      | "resend"
      | "bulk_approve"
      | "broadcast_ios_pre_announcement"
      | "trigger_ios_launch"
      | "send_engagement_round";
    entryId?: string;
    entryIds?: string[];
    admin_note?: string;
    round?: number;
  },
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

export async function approveBetaWaitlistAdmin(
  entryId: string,
  adminNote?: string,
) {
  return callAction("approve", entryId, adminNote);
}

export async function rejectBetaWaitlistAdmin(
  entryId: string,
  adminNote?: string,
) {
  return callAction("reject", entryId, adminNote);
}

export async function resendBetaWaitlistAdmin(entryId: string) {
  return callAction("resend", entryId);
}

export async function bulkApproveBetaWaitlistAdmin(
  entryIds: string[],
  adminNote?: string,
): Promise<{
  ok: boolean;
  status: number;
  approved?: number;
  failed?: number;
  results?: UpstreamAction["results"];
  error?: string;
}> {
  const { status, data } = await callAdminFunction({
    action: "bulk_approve",
    entryIds,
    ...(adminNote?.trim() ? { admin_note: adminNote.trim() } : {}),
  });
  const parsed = data as UpstreamAction;
  if (!upstreamOk(status, parsed)) {
    return {
      ok: false,
      status,
      error: String(parsed.error ?? "Approbation groupée impossible"),
    };
  }
  return {
    ok: true,
    status,
    approved: parsed.approved,
    failed: parsed.failed,
    results: parsed.results,
  };
}

export async function broadcastIosPreAnnouncementAdmin() {
  return callCampaignAction("broadcast_ios_pre_announcement");
}

export async function triggerIosLaunchAdmin() {
  return callCampaignAction("trigger_ios_launch");
}

export async function sendEngagementRoundAdmin(round?: number) {
  const { status, data } = await callAdminFunction({
    action: "send_engagement_round",
    round,
  });
  const parsed = data as UpstreamAction & {
    sent?: number;
    skipped?: number;
    failed?: number;
  };
  if (!upstreamOk(status, parsed)) {
    return {
      ok: false,
      status,
      error: String(parsed.error ?? "Envoi impossible"),
    };
  }
  return { ok: true, status, ...parsed };
}

async function callCampaignAction(
  action: "broadcast_ios_pre_announcement" | "trigger_ios_launch",
): Promise<{
  ok: boolean;
  status: number;
  sent?: number;
  skipped?: number;
  failed?: number;
  errors?: string[];
  testflightUrl?: string;
  error?: string;
}> {
  const { status, data } = await callAdminFunction({ action });
  const parsed = data as UpstreamAction & {
    sent?: number;
    skipped?: number;
    failed?: number;
    errors?: string[];
    testflightUrl?: string;
  };
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
    sent: parsed.sent,
    skipped: parsed.skipped,
    failed: parsed.failed,
    errors: parsed.errors,
    testflightUrl: parsed.testflightUrl,
  };
}

async function callAction(
  action: "approve" | "reject" | "resend",
  entryId: string,
  adminNote?: string,
): Promise<{
  ok: boolean;
  status: number;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
}> {
  const { status, data } = await callAdminFunction({
    action,
    entryId,
    ...(adminNote?.trim() ? { admin_note: adminNote.trim() } : {}),
  });
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
