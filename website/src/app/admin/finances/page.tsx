import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AccFinancesDashboard } from "@/components/admin/cc/AccFinancesDashboard";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Finances · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccFinancesPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  const sub = ov.platform.data.subscriptions;
  return (
    <AccFinancesDashboard
      badges={ov.badges}
      healthScore={ov.health.score}
      healthLabel={ov.health.label}
      proCount={sub.pro_count}
      freeCount={sub.free_count}
      activeOrTrialing={sub.active_or_trialing}
      pastDue={sub.past_due}
      mrr={sub.mrr}
      mrrAvailable={sub.mrr_available}
      byStatus={sub.by_status}
      items={sub.items}
      error={ov.platform.ok ? null : (ov.platform.error ?? "Stats finances indisponibles")}
    />
  );
}
