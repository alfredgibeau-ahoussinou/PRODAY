import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminBetaDashboard } from "@/components/admin/AdminBetaDashboard";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export const metadata: Metadata = {
  title: "Admin bêta",
  robots: { index: false, follow: false },
};

export default async function AdminBetaPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return <AdminBetaDashboard />;
}
