import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminSettings } from "@/components/admin/AdminSettings";

export const metadata: Metadata = {
  title: "Paramètres Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }
  return <AdminSettings />;
}
