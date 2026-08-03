import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminReports } from "@/components/admin/AdminReports";
import { fetchAdminPlatformStats } from "@/lib/adminPlatformApi";

export const metadata: Metadata = {
  title: "Modération Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const result = await fetchAdminPlatformStats();

  return (
    <AdminReports
      items={result.data.reports.items}
      total={result.data.reports.total}
      error={result.ok ? null : (result.error ?? "Chargement impossible")}
    />
  );
}
