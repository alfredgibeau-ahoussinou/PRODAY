import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Dashboard Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  // Récupérer les données pour le dashboard
  const [betaData, visitsData] = await Promise.all([
    fetch("/api/admin/beta/waitlist", { cache: "no-store" }),
    fetch("/api/admin/visites", { cache: "no-store" }),
  ]);

  const beta = await betaData.json().catch(() => ({ counts: { all: 0, pending: 0, approved: 0, rejected: 0 } }));
  const visits = await visitsData.json().catch(() => ({ total: 0, today: 0, week: 0 }));

  return (
    <AdminDashboard
      betaCounts={beta.counts}
      visitStats={visits}
    />
  );
}
