import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminVisitesDashboard } from "@/components/admin/AdminVisitesDashboard";
import { fetchTrafficStatsAdmin } from "@/lib/adminTrafficApi";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export const metadata: Metadata = {
  title: "Admin · Visites",
  robots: { index: false, follow: false },
};

export default async function AdminVisitesPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const result = await fetchTrafficStatsAdmin();

  return (
    <AdminVisitesDashboard
      initialTotals={result.data.totals}
      initialDays={result.data.days}
      initialError={result.ok ? null : (result.error ?? "Chargement impossible")}
    />
  );
}
