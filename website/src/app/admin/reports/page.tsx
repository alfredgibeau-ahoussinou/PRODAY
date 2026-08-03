import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminReports } from "@/components/admin/AdminReports";

export const metadata: Metadata = {
  title: "Modération Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminReportsPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return <AdminReports />;
}
