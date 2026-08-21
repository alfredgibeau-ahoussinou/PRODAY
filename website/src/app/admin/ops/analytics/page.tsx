import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { fetchAdminPlatformStats } from "@/lib/adminPlatformApi";
import { fetchTrafficStatsAdmin } from "@/lib/adminTrafficApi";

export const metadata: Metadata = {
  title: "Analytics : ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const [traffic, platform] = await Promise.all([
    fetchTrafficStatsAdmin(),
    fetchAdminPlatformStats(),
  ]);

  return (
    <AdminAnalytics
      totals={traffic.data.totals}
      days={traffic.data.days}
      userTotal={platform.ok ? platform.data.users.total : null}
      proCount={platform.ok ? platform.data.subscriptions.pro_count : null}
      trafficError={traffic.ok ? null : (traffic.error ?? "Chargement impossible")}
      platformError={
        platform.ok ? null : (platform.error ?? "Chargement impossible")
      }
    />
  );
}
