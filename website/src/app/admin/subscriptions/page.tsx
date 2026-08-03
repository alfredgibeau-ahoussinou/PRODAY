import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { fetchAdminPlatformStats } from "@/lib/adminPlatformApi";

export const metadata: Metadata = {
  title: "Abonnements Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminSubscriptionsPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const result = await fetchAdminPlatformStats();

  return (
    <AdminSubscriptions
      items={result.data.subscriptions.items}
      proCount={result.data.subscriptions.pro_count}
      activeOrTrialing={result.data.subscriptions.active_or_trialing}
      pastDue={result.data.subscriptions.past_due}
      error={result.ok ? null : (result.error ?? "Chargement impossible")}
    />
  );
}
