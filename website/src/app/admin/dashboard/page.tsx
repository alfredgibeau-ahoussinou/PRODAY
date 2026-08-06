import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { fetchBetaWaitlistAdmin } from "@/lib/adminBetaApi";
import { fetchAdminPlatformStats } from "@/lib/adminPlatformApi";
import { fetchTrafficStatsAdmin } from "@/lib/adminTrafficApi";

export const metadata: Metadata = {
  title: "Dashboard Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const [beta, visits, platform] = await Promise.all([
    fetchBetaWaitlistAdmin({ pageSize: 1 }),
    fetchTrafficStatsAdmin(),
    fetchAdminPlatformStats(),
  ]);

  const days = visits.data.days ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const weekCutoff = new Date();
  weekCutoff.setUTCDate(weekCutoff.getUTCDate() - 6);
  const weekKey = weekCutoff.toISOString().slice(0, 10);

  const siteToday = days
    .filter((d) => d.day_key === todayKey)
    .reduce((a, d) => a + d.site_visits, 0);
  const siteWeek = days
    .filter((d) => d.day_key >= weekKey)
    .reduce((a, d) => a + d.site_visits, 0);

  return (
    <AdminDashboard
      betaCounts={beta.counts}
      betaError={beta.ok ? null : (beta.error ?? "Chargement bêta impossible")}
      visitsError={visits.ok ? null : (visits.error ?? "Chargement visites impossible")}
      platformError={
        platform.ok ? null : (platform.error ?? "Chargement plateforme impossible")
      }
      visitStats={{
        siteVisits: visits.data.totals.site_visits,
        appOpens: visits.data.totals.app_opens,
        siteToday,
        siteWeek,
      }}
      platformStats={
        platform.ok
          ? {
              users: platform.data.users.total,
              pro: platform.data.subscriptions.pro_count,
              referrals: platform.data.referrals.codes,
              reportsOpen: platform.data.reports.open,
            }
          : null
      }
    />
  );
}
