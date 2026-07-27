import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminPoles } from "@/components/admin/AdminPoles";

export const metadata: Metadata = {
  title: "Gestion Pôles - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminPolesPage() {
  const ok = await getAdminSessionFromCookies();
  if (!ok) {
    redirect(ADMIN_LOGIN_PATH);
  }

  return <AdminPoles />;
}
