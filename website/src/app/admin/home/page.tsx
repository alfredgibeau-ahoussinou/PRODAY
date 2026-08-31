import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccHomeDashboard } from "@/components/admin/cc/AccHomeDashboard";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Control Center · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccHomePage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);

  const ov = await loadAccOverview();

  return (
    <AccHomeDashboard
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
      badges={ov.badges}
      metrics={{
        users: ov.platform.data.users.total,
        active: ov.platform.data.users.active,
        pro: ov.platform.data.subscriptions.pro_count,
        byRole: ov.platform.data.users.by_role,
        pendingBeta: ov.beta.counts.pending,
        siteWeek: ov.siteWeek,
        siteToday: ov.siteToday,
        appOpens: ov.visits.data.totals.app_opens,
        mrr: ov.platform.data.subscriptions.mrr,
        mrrAvailable: ov.platform.data.subscriptions.mrr_available,
        pastDue: ov.platform.data.subscriptions.past_due,
        reportsOpen: ov.platform.data.reports.open,
      }}
      actions={ov.actions}
      insights={ov.insights}
      errors={{
        beta: ov.beta.ok ? null : (ov.beta.error ?? "Chargement bêta impossible"),
        visits: ov.visits.ok ? null : (ov.visits.error ?? "Chargement visites impossible"),
        platform: ov.platform.ok
          ? null
          : (ov.platform.error ?? "Chargement plateforme impossible"),
      }}
    />
  );
}
