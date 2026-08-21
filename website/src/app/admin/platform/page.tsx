import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccPlatformOverview } from "@/components/admin/cc/AccPlatformOverview";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Plateforme · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccPlatformPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  return (
    <AccPlatformOverview
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
      users={ov.platform.data.users.total}
      active={ov.platform.data.users.active}
      byRole={ov.platform.data.users.by_role}
      siteWeek={ov.siteWeek}
      appOpens={ov.visits.data.totals.app_opens}
      pendingBeta={ov.beta.counts.pending}
      pro={ov.platform.data.subscriptions.pro_count}
    />
  );
}
