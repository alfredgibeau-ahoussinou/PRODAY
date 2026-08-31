import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { loadAccOverview } from "@/lib/adminCc/loadOverview";

export const metadata: Metadata = {
  title: "Abonnements · ProDay Admin",
  robots: { index: false, follow: false },
};

export default async function AccSubscriptionsPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) redirect(ADMIN_LOGIN_PATH);
  const ov = await loadAccOverview();
  const sub = ov.platform.data.subscriptions;
  return (
    <AdminSubscriptions
      items={sub.items}
      proCount={sub.pro_count}
      activeOrTrialing={sub.active_or_trialing}
      pastDue={sub.past_due}
      error={ov.platform.ok ? null : (ov.platform.error ?? "Chargement impossible")}
    />
  );
}
