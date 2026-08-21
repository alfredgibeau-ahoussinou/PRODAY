import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccPlatformHealth } from "@/components/admin/cc/AccPlatformHealth";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Santé système · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccHealthPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccPlatformHealth
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
      config={ov.config}
      metrics={{
        users: ov.platform.data.users.total,
        active: ov.platform.data.users.active,
        pro: ov.platform.data.subscriptions.pro_count,
        pendingBeta: ov.beta.counts.pending,
        pastDue: ov.platform.data.subscriptions.past_due,
        reportsOpen: ov.platform.data.reports.open,
        siteWeek: ov.siteWeek,
        appOpens: ov.visits.data.totals.app_opens,
      }}
      errors={{
        platform: ov.platform.ok ? null : ov.platform.error,
        beta: ov.beta.ok ? null : ov.beta.error,
        visits: ov.visits.ok ? null : ov.visits.error,
      }}
    />
  );
}
